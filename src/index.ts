import findWorkspaceDir from '@pnpm/find-workspace-dir'
import findWorkspacePackages from '@pnpm/find-workspace-packages'
import { ProjectManifest } from '@pnpm/types'
import loadJsonFile = require('load-json-file')
import path = require('path')
import exists = require('path-exists')
import isEqual from 'ramda/src/isEqual'
import writeJsonFile = require('write-json-file')

export default async function (updaterFilePath: string, opts: { test?: boolean }) {
  const workspaceDir = await findWorkspaceDir(updaterFilePath)
  if (!workspaceDir) throw new Error(`${updaterFilePath} is not inside a workspace`)
  const updaterLib = await import(updaterFilePath)
  const updater = updaterLib.default ?? updaterLib
  const updateOptions = await updater(workspaceDir)
  await performUpdates(workspaceDir, updateOptions, opts)
}

async function performUpdates (
  workspaceDir: string,
  update: Record<string, (obj: object, dir: string, manifest: ProjectManifest) => object | Promise<object>>,
  opts: { test?: boolean }
) {
  let pkgs = await findWorkspacePackages(workspaceDir, { engineStrict: false })
  for (const { dir, manifest, writeProjectManifest } of pkgs) {
    for (const [p, updateFn] of Object.entries(update)) {
      if (p === 'package.json') {
        const updatedManifest = await updateFn(manifest, dir, manifest)
        const needsUpdate = isEqual(manifest, updatedManifest)
        if (!needsUpdate) continue
        if (!opts.test) {
          await writeProjectManifest(updatedManifest)
          continue
        }
        throw new Error(`package.json file in ${dir} is not up-to-date`)
      }
      if (!p.endsWith('.json')) continue
      const fp = path.join(dir, p)
      if (!await exists(fp)) {
        continue
      }
      const obj = await loadJsonFile(fp)
      const updatedObj = await updateFn(obj as object, dir, manifest)
      const needsUpdate = isEqual(manifest, updatedObj)
      if (!needsUpdate) continue
      if (!opts.test) {
        await writeJsonFile(fp, updatedObj, { detectIndent: true })
        continue
      }
      throw new Error(`${fp} is not up-to-date`)
    }
  }
}

