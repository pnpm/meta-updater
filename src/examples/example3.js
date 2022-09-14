import { createUpdateOptions } from '..'
import { eslintrc, tsconfig } from './defaultFiles'

/**
 * Usage Example 1: Simple usage
 */
export default (_workspaceDir) => {
  return createUpdateOptions({
    files: {
      // builtin .json format
      'tsconfig.json': (actual, _options) => actual ?? tsconfig,
      // buildin .json format with explicit format specifier
      '.eslintrc [.json]': (actual) => actual ?? eslintrc,
    },
  })
}
