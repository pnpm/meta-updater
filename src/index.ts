import findWorkspaceDir from '@pnpm/find-workspace-dir'
import findWorkspacePackages from '@pnpm/find-workspace-packages'
import { ProjectManifest } from '@pnpm/types'
import loadJsonFile from 'load-json-file'
import path from 'path'
import exists from 'path-exists'
import R from 'ramda'
import writeJsonFile from 'write-json-file'
import printDiff from 'print-diff'

export default async function (opts: { test?: boolean }) {
  const workspaceDir = await findWorkspaceDir['default'](process.cwd())
  if (!workspaceDir) throw new Error(`Cannot find a workspace at ${process.cwd()}`)
  const updater = await import(`file://${path.resolve('.meta-updater/main.mjs').replace(/\\/g, '/')}`)
  const updateOptions = await updater.default(workspaceDir)
  const result = await performUpdates(workspaceDir, updateOptions, opts)
  if (result != null) {
    console.log(`ERROR: ${result.path} is not up-to-date`)
    printJsonDiff(result.actual, result.expected)
    process.exit(1)
  }
}

type UpdateFunc = (obj: object, dir: string, manifest: ProjectManifest) => object | Promise<object>

type UpdateError = {
  expected: Object
  actual: Object
  path: string
}

export async function performUpdates (
  workspaceDir: string,
  update: Record<string, UpdateFunc>,
  opts: { test?: boolean }
): Promise<null | UpdateError> {
  let pkgs = await findWorkspacePackages['default'](workspaceDir, { engineStrict: false })
  for (const { dir, manifest, writeProjectManifest } of pkgs) {
    for (const [p, updateFn] of Object.entries(update)) {
      const clonedManifest = R.clone(manifest)
      const fp = path.join(dir, p)
      if (p === 'package.json') {
        const updatedManifest = await updateFn(clonedManifest, dir, clonedManifest)
        const needsUpdate = !R.equals(manifest, updatedManifest)
        if (!needsUpdate) continue
        if (!opts.test) {
          await writeProjectManifest(updatedManifest)
          continue
        }
        return {
          expected: manifest,
          actual: updatedManifest,
          path: fp,
        }
      }
      if (!p.endsWith('.json')) continue
      if (!await exists(fp)) {
        continue
      }
      const obj = await loadJsonFile<Object>(fp)
      const updatedObj = await updateFn(R.clone(obj as object), dir, clonedManifest)
      const needsUpdate = !R.equals(obj, updatedObj)
      if (!needsUpdate) continue
      if (!opts.test) {
        await writeJsonFile(fp, updatedObj, { detectIndent: true })
        continue
      }
      return {
        expected: obj,
        actual: updatedObj,
        path: fp,
      }
    }
  }
  return null
}

function printJsonDiff(actual: Object, expected: Object) {
  printDiff(JSON.stringify(actual, null, 2), JSON.stringify(expected, null, 2))
}
