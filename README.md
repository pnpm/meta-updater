# @pnpm/meta-updater

> Keeps meta files up-to-date in a monorepo

[![npm version](https://img.shields.io/npm/v/@pnpm/meta-updater.svg)](https://www.npmjs.com/package/@pnpm/meta-updater)

## Installation

```sh
<pnpm|yarn|npm> add @pnpm/meta-updater
```

## Usage

Create a JavaScript file at `.meta-updater/main.mjs` that contains the updater functions.

## Example 1

The following `.meta-updater/main.mjs` defines updaters for `package.json` and `tsconfig.json` files:

```js
export default (workspaceDir) => {
  return {
    'package.json': (manifest, dir) => {
      return {
        ...manifest,
        author: 'Foo Bar',
      }
    },
    'tsconfig.json': (tsConfig, dir) => {
      return {
        ...tsConfig,
        compilerOptions: {
          outDir: 'lib',
          rootDir: 'src',
        },
      }
    },
  }
}
```

### Example 2

The following `.meta-updater/main.mjs` defines format `#ignore` and updaters for `.gitignore` and `.eslintrc` using explicit format specifier.

```js
import * as fs from 'fs/promises'
import { createFormat, createUpdateOptions } from '@pnpm/meta-updater'

/* default .eslintrc */
export const eslintrc = {}

/* default tsconfig.json */
export const tsconfig = { compilerOptions: { target: 'esnext' } }

/**
 * User-defined format '#ignore'
 */
const ignoreFormat = createFormat({
  async read({ resolvedPath }) {
    return (await fs.readFile(resolvedPath, 'utf8')).split('\n')
  },
  update(actual, updater, options) {
    return updater(actual, options)
  },
  equal(expected, actual) {
    return R.equals(expected, actual)
  },
  async write(expected, { resolvedPath }) {
    const unique = (array) => Array.from(new Set() < T[number] > array).sort()
    await fs.writeFile(resolvedPath, unique(expected).join('\n'), 'utf8')
  },
})

export default async (_workspaceDir) => {
  return createUpdateOptions({
    files: {
      // builtin
      'tsconfig.json': (actual, _options) => actual ?? tsconfig,
      // buildin .json format with explicit format specifier
      '.eslintrc [.json]': (actual) => actual ?? eslintrc,
      // user-defined `#ignore` format
      '.prettierignore [#ignore]': (actual) => actual ?? ['node_modules'],
    },
    formats: {
      '#ignore': ignoreFormat,
    },
  })
}
```

See more examples at [src/examples/](src/example/)

To perform the update on the affected config files, run `pnpm meta-updater`.

To check that all meta files are up-to-date, run `pnpm meta-updater --test`. It is recommended to always check the meta files before running the tests, so add it to your test command:

```json
{
  "test": "meta-updater --test && jest"
}
```

## API

### Updater Function: `(config | null, dir, manifest) => Promise<config | null>`

The updater function recieves the config object or null (if the config file does not exist). The updater function returns the config object that should be saved. If the updater function returns null, the config should be removed.

## License

[MIT](./LICENSE) © [Zoltan Kochan](https://www.kochan.io/)
