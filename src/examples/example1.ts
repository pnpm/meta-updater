import { createUpdateOptions } from '../updater/updateOptions.js'
import { eslintrc, tsconfig } from './defaultFiles.js'

/**
 * Usage Example 1: Simple usage
 */
export default (_workspaceDir: string) => {
  return createUpdateOptions({
    files: {
      // builtin .json format
      'tsconfig.json': (actual, _options) => actual ?? tsconfig,
      // buildin .json format with explicit format specifier
      '.eslintrc [.json]': (actual) => actual ?? eslintrc,
    },
  })
}
