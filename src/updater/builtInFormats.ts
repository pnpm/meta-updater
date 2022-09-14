import { equals } from 'ramda'
import { basename } from 'path'
import { loadJsonFile } from 'load-json-file'
import { writeJsonFile } from 'write-json-file'
import { createFormat } from './formatPlugin.js'

export const builtInFormatPlugins = {
  '.json': createFormat({
    read({ resolvedPath }) {
      return loadJsonFile<object>(resolvedPath)
    },
    update(actual, updater, options) {
      return updater(actual, options)
    },
    equal(expected, actual) {
      return equals(actual, expected)
    },
    async write(expected, { resolvedPath, _writeProjectManifest }) {
      if (basename(resolvedPath) === 'package.json') {
        await _writeProjectManifest(expected)
        return
      }
      await writeJsonFile(resolvedPath, expected, { detectIndent: true })
    },
  }),
}
export type BuildInFormatPlugins = typeof builtInFormatPlugins
