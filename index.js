'use strict'
const split = require('split2')
const { CloudLogging } = require('./lib/cloud-logging')

async function CloudPine (options) {
  const { logName = 'Cloud_Pine', cloudLoggingOptions } = options
  const logging = new CloudLogging(logName, cloudLoggingOptions)

  await logging.init()

  const stream = split(logging.parseLine.bind(logging), { autoDestroy: true })

  return stream
}

module.exports = CloudPine
