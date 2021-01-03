import findWorkspaceDir from '@pnpm/find-workspace-dir'
import findWorkspacePackages from '@pnpm/find-workspace-packages'
import { ProjectManifest } from '@pnpm/types'
import loadJsonFile = require('load-json-file')
import path = require('path')
import exists = require('path-exists')
import writeJsonFile = require('write-json-file')

export default async function (updaterFilePath: string) {
  const workspaceDir = await findWorkspaceDir(updaterFilePath)
  if (!workspaceDir) throw new Error(`${updaterFilePath} is not inside a workspace`)
  const { default: updater } = await import(updaterFilePath)
  const updateOptions = await updater(workspaceDir)
  await performUpdates(workspaceDir, updateOptions)
}

async function performUpdates (
  workspaceDir: string,
  update: Record<string, (obj: object, dir: string, manifest: ProjectManifest) => object | Promise<object>>
) {
  let pkgs = await findWorkspacePackages(workspaceDir, { engineStrict: false })
  for (const { dir, manifest, writeProjectManifest } of pkgs) {
    for (const [p, updateFn] of Object.entries(update)) {
      if (p === 'package.json') {
        await writeProjectManifest(await updateFn(manifest, dir, manifest))
        continue
      }
      if (!p.endsWith('.json')) continue
      const fp = path.join(dir, p)
      if (!await exists(fp)) {
        continue
      }
      const obj = await loadJsonFile(fp)
      await writeJsonFile(fp, await updateFn(obj as object, dir, manifest), { detectIndent: true })
    }
  }
}

