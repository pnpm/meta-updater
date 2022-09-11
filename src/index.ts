import path from "path"
import fs from "fs/promises"
import findWorkspaceDir from "@pnpm/find-workspace-dir"
import printDiff from "print-diff"
import { clone } from "ramda"
import { findWorkspacePackagesNoCheck } from "@pnpm/find-workspace-packages"
import { UpdateOptions, UpdateOptionsWithFormats } from "./updater/updateOptions.js"
import { BaseFormatPlugins, FormatPlugin } from "./updater/formatPlugin.js"
import { builtInFormatPlugins } from "./updater/builtInFormats.js"

export { createFormat, type BaseFormatPlugins, type FormatPlugin, type FormatPluginFnOptions } from './updater/formatPlugin.js';
export { createUpdateOptions, type UpdateOptions, type UpdateOptionsWithFormats } from './updater/updateOptions.js'
export type { Files } from './updater/files'

export default async function (opts: { test?: boolean }) {
  const workspaceDir = await findWorkspaceDir["default"](process.cwd())
  if (!workspaceDir) throw new Error(`Cannot find a workspace at ${process.cwd()}`)
  const updater = await import(`file://${path.resolve(".meta-updater/main.mjs").replace(/\\/g, "/")}`)
  const updateOptions = await updater.default(workspaceDir)
  const result = await performUpdates(workspaceDir, updateOptions, opts)
  if (result != null) {
    for (const error of result) {
      if ("exception" in error) {
        console.error(`ERROR: ${error.exception}`)
      } else {
        const { path, actual, expected } = error
        console.log(`ERROR: ${path} is not up-to-date`)
        printJsonDiff(actual, expected)
      }
    }
    process.exit(1)
  }
}

type UpdateError =
  | {
      expected: unknown
      actual: unknown
      path: string
    }
  | {
      exception: any
    }

export async function performUpdates<
  FileNameWithOptions extends string,
  UserDefinedFormatPlugins extends BaseFormatPlugins
>(
  workspaceDir: string,
  update2: UpdateOptions<FileNameWithOptions> | UpdateOptionsWithFormats<FileNameWithOptions, UserDefinedFormatPlugins>,
  opts?: { test?: boolean }
): Promise<null | UpdateError[]> {
  let pkgs = await findWorkspacePackagesNoCheck(workspaceDir)

  const { files } = update2
  const formats = "formats" in update2 ? { ...builtInFormatPlugins, ...update2.formats } : builtInFormatPlugins

  const promises = pkgs.flatMap(({ dir, manifest, writeProjectManifest }) =>
    Object.keys(files).map(async (fileKey) => {
      const updateTargetFile = !opts?.test
      const clonedManifest = clone(manifest)
      const { file, formatPlugin } = parseFileKey(fileKey, formats)

      const resolvedPath = path.resolve(dir, file)
      const formatHandlerOptions = {
        file,
        dir,
        manifest: clonedManifest,
        resolvedPath,
        _writeProjectManifest: writeProjectManifest,
      }
      const actual = (await fileExists(resolvedPath)) ? await formatPlugin.read(formatHandlerOptions) : null
      const expected = await formatPlugin.update(actual, files[fileKey], formatHandlerOptions)

      const equal =
        (actual == null && expected == null) ||
        (actual != null && expected != null && (await formatPlugin.equal(expected, actual, formatHandlerOptions)))
      if (equal) {
        return
      }

      if (updateTargetFile) {
        if (expected == null) {
          await fs.unlink(resolvedPath)
        } else {
          await formatPlugin.write(expected, formatHandlerOptions)
        }
      }

      return { actual, expected, path: resolvedPath }
    })
  )

  const diffs = await Promise.allSettled(promises)
  const errors = diffs.flatMap((diff) => {
    switch (diff.status) {
      case "fulfilled":
        return diff.value ?? []
      case "rejected":
        return { exception: diff.reason }
    }
  })
  return errors.length > 0 ? errors : null
}

function printJsonDiff(actual: unknown, expected: unknown) {
  printDiff(
    typeof actual !== "string" ? JSON.stringify(actual, null, 2) : actual,
    typeof expected !== "string" ? JSON.stringify(expected, null, 2) : expected
  )
}

async function fileExists(path: string) {
  try {
    const stat = await fs.stat(path)
    return stat.isFile()
  } catch (error) {
    return false
  }
}

function parseFileKey(fileKey: string, formatPlugins: Record<string, FormatPlugin<unknown>>) {
  const forcedExtensionMatch = fileKey.match(/(?<file>.*?)\s*\[(?<extension>.*?)\]$/)
  if (forcedExtensionMatch) {
    const { extension, file } = forcedExtensionMatch.groups!
    const formatPlugin = formatPlugins[extension]

    if (!formatPlugin) {
      throw new Error(
        `Configuration error: there is no format plugin for fileKey "${fileKey}" with forced extension "${extension}"`
      )
    }

    return {
      file,
      extension,
      formatPlugin,
    }
  }

  const extension = Object.keys(formatPlugins).find((extension) => fileKey.endsWith(extension))
  if (!extension) {
    throw new Error(
      `Configuration error: there is no format plugin for fileKey "${fileKey}", supported extensions are ${Object.keys(
        formatPlugins
      )}`
    )
  }

  return {
    file: fileKey,
    extension,
    formatPlugin: formatPlugins[extension],
  }
}
