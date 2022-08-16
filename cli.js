#!/usr/bin/env node
'use strict'
const { pipeline } = require('node:stream')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')

const minimist = require('minimist')
const CloudPine = require('./index')

function parseOptions (argv) {
  const opts = {
    logName: argv.name,
    cloudLoggingOptions: {
      sync: argv.sync,
      skipInit: argv['skip-init'],
      googleCloudOptions: {
        projectId: argv.projectId,
        keyFilename: argv.key
      },
      resource: {
        type: argv.resource,
        labels: {}
      },
      defaultLabels: {}
    }
  }

  if (argv['resource-labels'] != null) {
    const plainLabels = Array.isArray(argv['resource-labels'])
      ? argv['resource-labels']
      : [argv['resource-labels']]

    for (const label of plainLabels) {
      const [key, value] = label.split('=')
      opts.cloudLoggingOptions.resource.labels[key] = value
    }
  }

  if (argv.labels != null) {
    const plainLabels = Array.isArray(argv.labels) ? argv.labels : [argv.labels]

    for (const label of plainLabels) {
      const [key, value] = label.split('=')
      opts.cloudLoggingOptions.defaultLabels[key] = value
    }
  }

  return opts
}

async function handler (fgs) {
  let rs, rj
  const promise = new Promise(
    // eslint-ignore-next-line no-return-assign
    (resolve, reject) => {
      rs = resolve
      rj = reject
    }
  )

  if (fgs.version) {
    const { version } = JSON.parse(
      readFileSync(join(__dirname, 'package.json'), 'utf-8')
    )
    console.log(`cloud-pine@v${version}`)

    rs()
  } else if (fgs.help) {
    console.log(readFileSync(join(__dirname, 'help.txt'), 'utf-8'))

    rs()
  } else {
    const options = parseOptions(fgs)

    pipeline(process.stdin, await CloudPine(options), err => {
      if (err) rj(err)
    })
  }

  return promise
}

const flags = minimist(process.argv.slice(2), {
  alias: {
    name: 'n',
    version: 'v',
    help: 'h',
    sync: 's',
    projectId: 'p',
    key: 'k',
    labels: 'l',
    resource: 'r',
    'resource-labels': 'rs',
    'skip-init': 'i'
  },
  boolean: ['skip-init', 'sync'],
  default: {
    sync: true,
    'skip-init': false
  }
})

handler(flags).then(null, console.error)
