#!/usr/bin/env node
import meow from 'meow'
import update from './index.js'

const cli = meow(`
Usage
  $ meta-updater

Options
  --test  Do not update the files. Fail if updates are needed.

Examples
  $ meta-updater
  $ meta-updater --test
`, {
  importMeta: import.meta,
  flags: {
    test: {
      type: 'boolean',
    },
  },
})

update(cli.flags).catch((err) => {
  console.error(err)
  process.exit(1)
})
