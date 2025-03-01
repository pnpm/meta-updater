export default () => {
  return {
    'package.json': (manifest, { dir }) => {
      const sortedObj = {}
      for (const key of Object.keys(manifest).sort()) {
        sortedObj[key] = manifest[key]
      }
      return sortedObj
    },
  }
}
