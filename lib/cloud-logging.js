const { Logging } = require('@google-cloud/logging')

class CloudLogging {
  constructor (logName, options = {}) {
    this.name = logName
    this.logging = new Logging(options.googleCloudOptions)
    this._resource = Object.assign(
      { type: 'global', labels: { logger: 'pino' } },
      options.resourceSettings
    )
    this._log = null
    this._logOptions = options.logOptions
  }

  mapSeverity (logLevel) {
    return (
      CloudLogging.SEVERITY_MAP[logLevel] || CloudLogging.SEVERITY_MAP['30']
    )
  }

  get resource () {
    return this._resource
  }

  async init () {
    await this.logging.setProjectId()
    await this.logging.setDetectedResource()

    this._resource = Object.assign(
      this._resource,
      this.logging.detectedResource
    )

    this._log = this.logging.log(this.name)
    return this._log
  }

  parseLine (line) {
    let log
    let meta

    try {
      log = JSON.parse(line)
    } catch (e) {
      log = e
      meta = Object.assign(
        { severity: CloudLogging.SEVERITY_MAP['50'] },
        this.resource
      )
    }

    meta = Object.assign(
      { severity: this.mapSeverity(log.level) },
      this._resource,
      log.meta
    )

    if (log.httpRequest) {
      meta.httpRequest = log.httpRequest
      delete log.httpRequest
    }

    log.message = log.message || log.msg
    delete log.msg

    const entry = this._log.entry(meta, log)
    this._log.write(entry)
  }

  onFinish () {}
}

CloudLogging.SEVERITY_MAP = {
  10: 'DEBUG',
  20: 'DEBUG',
  30: 'INFO',
  40: 'WARNING',
  50: 'ERROR',
  60: 'CRITICAL'
}

module.exports = {
  CloudLogging
}
