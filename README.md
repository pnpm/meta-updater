# @pnpm/meta-updater

> Keeps meta files up-to-date in a monorepo

[![npm version](https://img.shields.io/npm/v/@pnpm/meta-updater.svg)](https://www.npmjs.com/package/@pnpm/meta-updater)

## Installation

```sh
<pnpm|yarn|npm> add @pnpm/meta-updater
```

## Usage

Create a JavaScript file that contains the updater functions. For instance, the next file will have updaters for `package.json` and `tsconfig.json` files:

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

To perform the update on the affected config files, pass the path to the updater file to the CLI. For instance: `meta-updater ./update.js`

## License

[MIT](./LICENSE) © [Zoltan Kochan](https://www.kochan.io/)
