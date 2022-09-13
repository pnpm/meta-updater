export default () => {
  return {
    files: {
      'package.json': (manifest, { dir }) => ({
        ...manifest,
        name: 'qar',
      }),
      'tsconfig.json': (tsconfig, { dir }) => ({
        ...tsconfig,
        foo: 1,
      }),
    },
  }
}
