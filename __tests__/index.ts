import { jest } from '@jest/globals'
import { execa } from 'execa'
import fsx from 'fs-extra'
import { loadJsonFile } from 'load-json-file'
import path from 'path'
import tempy from 'tempy'
import { fileURLToPath } from 'url'
import { createFormat, createUpdateOptions, performUpdates } from '../src/index.js'

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
    { test: true },
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
    }),
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
    }),
  )
  expect(result).toBe(null)
  expect(fsx.existsSync(path.join(tmp, 'packages/foo/tsconfig.json'))).toBeFalsy()
  expect(fsx.existsSync(path.join(tmp, 'packages/bar/tsconfig.json'))).toBeTruthy()
})

test('custom format plugins are used', async () => {
  const tmp = tempy.directory()
  await fsx.copy(WORKSPACE1, tmp)
  const mockFormat = createFormat({
    read(options) {
      return fsx.readFile(options.resolvedPath, 'utf8')
    },
    clone(value) {
      return value
    },
    update(actual, updater, options) {
      return updater(actual, options)
    },
    equal(expected, actual) {
      return actual === expected
    },
    write(expected, options) {
      return fsx.writeFile(options.resolvedPath, expected)
    },
  })
  const spy = {
    read: jest.spyOn(mockFormat, 'read'),
    clone: jest.spyOn(mockFormat, 'clone'),
    update: jest.spyOn(mockFormat, 'update'),
    equal: jest.spyOn(mockFormat, 'equal'),
    write: jest.spyOn(mockFormat, 'write'),
  }
  const updateOptions = createUpdateOptions({
    files: {
      ['name.txt [#mock]']: (_, { manifest }) => {
        return typeof manifest.name === 'string' ? `${manifest.name}\n` : null
      },
    },
    formats: {
      ['#mock']: mockFormat,
    },
  })
  const result = await performUpdates(tmp, updateOptions)
  expect(result).toBe(null)
  expect(spy.read).toHaveBeenCalledTimes(3)
  expect(spy.clone).toHaveBeenCalledTimes(3)
  expect(spy.clone).toHaveBeenCalledWith('old\n')
  expect(spy.clone).toHaveBeenCalledWith('bar\n')
  expect(spy.clone).toHaveBeenCalledWith('root\n')
  expect(spy.update).toHaveBeenCalledTimes(3)
  expect(spy.update).toHaveBeenCalledWith('old\n', expect.any(Function), expect.any(Object))
  expect(spy.update).toHaveBeenCalledWith('bar\n', expect.any(Function), expect.any(Object))
  expect(spy.update).toHaveBeenCalledWith('root\n', expect.any(Function), expect.any(Object))
  expect(spy.equal).toHaveBeenCalledTimes(2)
  expect(spy.equal).toHaveBeenCalledWith('foo\n', 'old\n', expect.any(Object))
  expect(spy.equal).toHaveBeenCalledWith('bar\n', 'bar\n', expect.any(Object))
  expect(spy.write).toHaveBeenCalledTimes(1)
  expect(fsx.existsSync(path.join(tmp, 'packages/foo/name.txt'))).toBeTruthy()
  expect(fsx.existsSync(path.join(tmp, 'packages/bar/name.txt'))).toBeTruthy()
  expect(fsx.existsSync(path.join(tmp, 'name.txt'))).toBeFalsy()
})
