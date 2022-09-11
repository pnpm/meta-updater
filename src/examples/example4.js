import * as fs from "fs/promises"
import { createFormat, createUpdateOptions } from ".."
import { eslintrc, tsconfig } from "./defaultFiles"

/**
 * User-defined format '.gitignore'
 */
 const gitignoreFormat = createFormat({
  async read({ resolvedPath }) {
    return (await fs.readFile(resolvedPath, "utf8")).split("\n")
  },
  update(actual, updater, options) {
    return updater(actual, options)
  },
  equal(expected, actual) {
    return R.equals(expected, actual)
  },
  async write(expected, { resolvedPath }) {
    const unique = (array) => Array.from(new Set<T[number]>(array)).sort()
    await fs.writeFile(resolvedPath, unique(expected).join("\n"), "utf8")
  },
})

export default async (_workspaceDir) => {
  return createUpdateOptions({
    files: {
      // builtin
      "tsconfig.json": (actual, _options) => actual ?? tsconfig,
      ".eslintrc [.json]": (actual) => actual ?? eslintrc,
      // custom
      ".prettierignore [.gitignore]": (actual) => actual ?? ["node_modules"],
      "by-extension.ignore": (actual) => actual,
      "by-type.txt [.ignore]": (actual, _options) => actual,
      // [format-type] takes precedence
      "by-type.ignore [.json]": (actual) => actual,
    },
    formats: {
      ".gitignore": gitignoreFormat,
      ".ignore": {
        ...gitignoreFormat,
      },
    },
  })
}

