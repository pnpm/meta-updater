import execa from 'execa'
import fsx from 'fs-extra'
import loadJsonFile from 'load-json-file'
import path from 'path'
import tempy from 'tempy'
import { fileURLToPath } from 'url'
import { performUpdates } from "../src/index"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE1 = path.join(__dirname, '../__fixtures__/workspace-1')
const CLI = path.join(__dirname, '../lib/cli.js')

test('updates manifests', async () => {
  const tmp = tempy.directory()
  await fsx.copy(WORKSPACE1, tmp)
  const result = await execa('node', [CLI], { cwd: tmp })
  expect(result.exitCode).toBe(0)
  const fooManifest = await loadJsonFile<{ name: string }>(path.join(tmp, 'packages/foo/package.json'))
  expect(fooManifest.name).toBe('qar')
  const barManifest = await loadJsonFile<{ name: string }>(path.join(tmp, 'packages/bar/package.json'))
  expect(barManifest.name).toBe('qar')
  const fooTsconfig = await loadJsonFile<{ foo: number }>(path.join(tmp, 'packages/foo/tsconfig.json'))
  expect(fooTsconfig.foo).toBe(1)
  const barTsconfig = await loadJsonFile<{ foo: number }>(path.join(tmp, 'packages/bar/tsconfig.json'))
  expect(barTsconfig.foo).toBe(1)
})

test('updates are detected', async () => {
  const tmp = tempy.directory()
  await fsx.copy(WORKSPACE1, tmp)
  const result = await performUpdates(tmp, {
    'package.json': (manifest: { dependencies?: Record<string, string> }, dir) => {
      if (manifest.dependencies != null) {
        delete manifest.dependencies['express']
      }
      return manifest
    },
  }, { test: true })
  expect(result).toEqual({
    expected: {
      name: 'bar',
      version: '0.0.0',
      dependencies: {
        express: '3',
      },
    },
    actual: {
      name: 'bar',
      version: '0.0.0',
      dependencies: {},
    },
    path: path.join(tmp, 'packages/bar/package.json'),
  });
})
