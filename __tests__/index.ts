import { execa } from 'execa'
import fsx from 'fs-extra'
import { loadJsonFile } from 'load-json-file'
import path from 'path'
import tempy from 'tempy'
import { fileURLToPath } from 'url'
import { createUpdateOptions, performUpdates } from '../src/index.js'

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
  const result = await performUpdates(
    tmp,
    createUpdateOptions({
      files: {
        'package.json': (manifest: null | { dependencies?: Record<string, string> }) => {
          if (manifest?.dependencies != null) {
            delete manifest.dependencies['express']
          }
          return manifest
        },
      },
    }),
    { test: true }
  )
  expect(result).toEqual([
    {
      actual: {
        name: 'bar',
        version: '0.0.0',
        dependencies: {
          express: '3',
        },
      },
      expected: {
        name: 'bar',
        version: '0.0.0',
        dependencies: {},
      },
      path: path.resolve(tmp, 'packages/bar/package.json'),
    },
  ])
})

test('new config files are added', async () => {
  const tmp = tempy.directory()
  await fsx.copy(WORKSPACE1, tmp)
  const result = await performUpdates(
    tmp,
    createUpdateOptions({
      files: {
        'config/config.json': (config) => {
          expect(config).toBe(null)
          return { foo: 1 }
        },
      },
    })
  )
  expect(result).toBe(null)
  const fooConfig = await loadJsonFile<{ foo: number }>(path.join(tmp, 'packages/foo/config/config.json'))
  expect(fooConfig.foo).toBe(1)
  const barConfig = await loadJsonFile<{ foo: number }>(path.join(tmp, 'packages/bar/config/config.json'))
  expect(barConfig.foo).toBe(1)
})

test('config files are removed', async () => {
  const tmp = tempy.directory()
  await fsx.copy(WORKSPACE1, tmp)
  const result = await performUpdates(
    tmp,
    createUpdateOptions({
      files: {
        'tsconfig.json': (config, { manifest }) => {
          if (manifest.name === 'foo') {
            return null
          }
          return config
        },
      },
    })
  )
  expect(result).toBe(null)
  expect(fsx.existsSync(path.join(tmp, 'packages/foo/tsconfig.json'))).toBeFalsy()
  expect(fsx.existsSync(path.join(tmp, 'packages/bar/tsconfig.json'))).toBeTruthy()
})
