#!/usr/bin/env node
import meow from 'meow'
import update from './index.js'
import path from 'path'

const cli = meow(`
Usage
  $ meta-updater <path to js>

Options
  --test  Do not update the files. Fail if updates are needed.

Examples
  $ meta-updater update.js
  $ meta-updater update.js --test
`, {
  flags: {
    test: {
      type: 'boolean',
    },
  },
})

update(path.resolve(cli.input[0]), cli.flags).catch((err) => {
  console.error(err)
  process.exit(1)
})
