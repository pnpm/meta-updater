import * as fs from 'fs/promises'
import { equals } from 'ramda'
import { createFormat, createUpdateOptions } from '..'
import { eslintrc, tsconfig } from './defaultFiles'

/**
 * User-defined format '.gitignore'
 */
const gitignoreFormat = createFormat({
  async read({ resolvedPath }) {
    return (await fs.readFile(resolvedPath, 'utf8')).split('\n')
  },
  update(actual, updater, options) {
    return updater(actual, options)
  },
  equal(expected, actual) {
    return equals(expected, actual)
  },
  async write(expected, { resolvedPath }) {
    const unique = <T extends unknown[]>(array: T) => Array.from(new Set<T[number]>(array)).sort()
    await fs.writeFile(resolvedPath, unique(expected).join('\n'), 'utf8')
  },
})

export default async (_workspaceDir: string) => {
  return createUpdateOptions({
    files: {
      // builtin
      'tsconfig.json': (actual, _options) => actual ?? tsconfig,
      // buildin .json format with explicit format specifier
      '.eslintrc [.json]': (actual) => actual ?? eslintrc,

      // user-defined `#ignore` format
      '.prettierignore [#ignore]': (actual) => actual ?? ['node_modules'],
      '.gitignore': (actual) => actual,
      'by-type.txt [#ignore]': (actual, _options) => actual,
      // [explicit format specifier] takes precedence over extension detection
      'by-type.json [#ignore]': (actual) => actual,
    },
    formats: {
      '.gitignore': gitignoreFormat,
      '#ignore': {
        ...gitignoreFormat,
      },
    },
  })
}
