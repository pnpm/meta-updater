#!/usr/bin/env node
import update from '.'
import path = require('path')

update(path.resolve(process.argv[2])).catch((err) => {
  console.error(err)
  process.exit(1)
})
