const tap = require('tap')

const { CloudLogging } = require('../../lib/cloud-logging')

class BaseLogMock {
  constructor (name) {
    this.name = name
  }

  entry () {
    return {}
  }

  write () {}
}

class BaseLoggingMock {
  constructor () {
    this.detectedResource = null
  }

  setProjectId () {
    return Promise.resolve()
  }

  setDetectedResource () {
    return Promise.resolve()
  }

  parseLine () {}

  log (name = 'test') {
    return new BaseLogMock(name)
  }
}

tap.plan(2)

tap.test('CloudLogging#sync', root => {
  root.plan(3)
  root.test('#mapSeverity', t => {
    const cloudLogging = new CloudLogging({ sync: true })
    t.plan(7)

    t.equal(cloudLogging.mapSeverity('10'), 'DEBUG')
    t.equal(cloudLogging.mapSeverity('20'), 'DEBUG')
    t.equal(cloudLogging.mapSeverity('30'), 'INFO')
    t.equal(cloudLogging.mapSeverity('40'), 'WARNING')
    t.equal(cloudLogging.mapSeverity('50'), 'ERROR')
    t.equal(cloudLogging.mapSeverity('60'), 'CRITICAL')
    t.equal(cloudLogging.mapSeverity('100'), 'INFO')
  })

  root.test('#init', nested => {
    nested.plan(3)

    nested.test(
      'Should initialize the log instance with resources',
      async t => {
        const logName = 'test'
        const projectId = 'test-project'
        const detectedResource = {
          labels: {
            projectId,
            instanceId: '12345678901234',
            zone: 'us-central1-a'
          }
        }
        const defaultOptions = {
          googleCloudOptions: {
            projectId,
            keyFilename: '/path/to/keyfile.json'
          },
          sync: true
        }

        class LoggingMock extends BaseLoggingMock {
          constructor (options) {
            t.same(options, defaultOptions.googleCloudOptions)
            super()
          }

          setProjectId () {
            return Promise.resolve()
          }

          setDetectedResource () {
            this.detectedResource = detectedResource
            return Promise.resolve()
          }

          logSync (name) {
            t.equal(name, logName)
            return new BaseLogMock(name)
          }
        }

        const expectedDetectedResource = Object.assign(
          { type: 'global' },
          detectedResource
        )
        const { CloudLogging } = t.mock('../../lib/cloud-logging', {
          '@google-cloud/logging': { Logging: LoggingMock }
        })

        t.plan(4)

        const instance = new CloudLogging(logName, defaultOptions)

        await instance.init()
        t.same(instance.resource, expectedDetectedResource)
        t.ok(instance.sync)
      }
    )

    nested.test(
      'Calles made to #resource should return the fresh object of the parent resource',
      async t => {
        const logName = 'test'
        const projectId = 'test-project'
        const detectedResource = {
          labels: {
            projectId,
            instanceId: '12345678901234',
            zone: 'us-central1-a'
          }
        }
        const defaultOptions = {
          googleCloudOptions: {
            projectId,
            keyFilename: '/path/to/keyfile.json'
          },
          sync: true
        }

        class LoggingMock extends BaseLoggingMock {
          constructor (options) {
            t.same(options, defaultOptions.googleCloudOptions)
            super()
          }

          setProjectId () {
            return Promise.resolve()
          }

          setDetectedResource () {
            this.detectedResource = detectedResource
            return Promise.resolve()
          }

          logSync (name) {
            t.equal(name, logName)
            return new BaseLogMock(name)
          }
        }

        const expectedDetectedResource = Object.assign(
          { type: 'global' },
          detectedResource
        )
        const { CloudLogging } = t.mock('../../lib/cloud-logging', {
          '@google-cloud/logging': { Logging: LoggingMock }
        })

        t.plan(6)

        const instance = new CloudLogging(logName, defaultOptions)

        await instance.init()
        t.ok(instance.sync)
        t.same(instance.resource, expectedDetectedResource)
        t.same(instance.resource, expectedDetectedResource)
        t.same(instance.resource, expectedDetectedResource)
      }
    )

    nested.test(
      'Should be skip if skipInit flag is set',
      async t => {
        const logName = 'test'
        const projectId = 'test-project'
        const detectedResource = {
          labels: {
            projectId,
            instanceId: '12345678901234',
            zone: 'us-central1-a'
          }
        }
        const defaultOptions = {
          googleCloudOptions: {
            projectId,
            keyFilename: '/path/to/keyfile.json'
          },
          sync: true,
          skipInit: true
        }

        class LoggingMock extends BaseLoggingMock {
          constructor (options) {
            t.same(options, defaultOptions.googleCloudOptions)
            super()
          }

          setProjectId () {
            t.fail('setProjectId should not be called')
            return Promise.resolve()
          }

          setDetectedResource () {
            t.fail('setDetectedResource should not be called')
            this.detectedResource = detectedResource
            return Promise.resolve()
          }

          logSync (name) {
            t.equal(name, logName)
            return new BaseLogMock(name)
          }
        }

        const expectedDetectedResource = Object.assign(
          { type: 'global' },
          detectedResource
        )
        const { CloudLogging } = t.mock('../../lib/cloud-logging', {
          '@google-cloud/logging': { Logging: LoggingMock }
        })

        t.plan(4)

        const instance = new CloudLogging(logName, defaultOptions)

        await instance.init()
        t.ok(instance.sync)
        t.notSame(instance.resource, expectedDetectedResource)
      }
    )
  })

  root.test('#parseLine', nested => {
    const logName = 'test'
    const projectId = 'test-project'
    const detectedResource = {
      labels: {
        projectId,
        instanceId: '12345678901234',
        zone: 'us-central1-a'
      }
    }
    const defaultOptions = {
      googleCloudOptions: {
        projectId,
        keyFilename: '/path/to/keyfile.json'
      },
      sync: true
    }

    nested.plan(9)

    nested.test('Should parse a line correctly', async t => {
      let expectedEntry
      const expectedLogEntry = {
        some: 'log',
        being: 'printed',
        message: 'being printed',
        meta: {
          trace: 'testTrace-123'
        }
      }
      class LogMock extends BaseLogMock {
        entry (meta, log) {
          const expectedMeta = Object.assign(
            expectedLogEntry.meta,
            {
              severity: CloudLogging.SEVERITY_MAP[30],
              labels: {
                logger: 'pino',
                agent: 'cloud_pine'
              }
            },
            { resource: Object.assign({ type: 'global' }, detectedResource) }
          )

          const { meta: _meta, ...expectedLog } = expectedLogEntry

          t.same(meta, expectedMeta)
          t.same(log, expectedLog)

          return (
            (expectedEntry = Object.assign({}, meta, {
              jsonPayload: expectedLog,
              logName: this.name
            })),
            expectedEntry
          )
        }

        write (entry) {
          t.same(entry, expectedEntry)
        }
      }

      class LoggingMock extends BaseLoggingMock {
        setProjectId () {
          return Promise.resolve()
        }

        setDetectedResource () {
          this.detectedResource = detectedResource
          return Promise.resolve()
        }

        logSync (name) {
          return new LogMock(name)
        }
      }

      const { CloudLogging } = t.mock('../../lib/cloud-logging', {
        '@google-cloud/logging': { Logging: LoggingMock }
      })

      t.plan(3)

      const instance = new CloudLogging(logName, defaultOptions)

      await instance.init()

      instance.parseLine(JSON.stringify(expectedLogEntry))
    })

    nested.test('Should parse a line correctly (custom severity)', async t => {
      let expectedEntry
      const expectedLogEntry = {
        level: 50,
        some: 'log',
        being: 'printed',
        message: 'being printed',
        meta: {
          trace: 'testTrace-123'
        }
      }
      class LogMock extends BaseLogMock {
        entry (meta, log) {
          const expectedMeta = Object.assign(
            expectedLogEntry.meta,
            {
              severity: CloudLogging.SEVERITY_MAP[50],
              labels: {
                logger: 'pino',
                agent: 'cloud_pine'
              }
            },
            { resource: Object.assign({ type: 'global' }, detectedResource) }
          )

          const { meta: _meta, ...expectedLog } = expectedLogEntry

          t.same(meta, expectedMeta)
          t.same(log, expectedLog)

          return (
            (expectedEntry = Object.assign({}, meta, {
              jsonPayload: expectedLogEntry,
              logName: this.name
            })),
            expectedEntry
          )
        }

        write (entry) {
          t.same(entry, expectedEntry)
        }
      }

      class LoggingMock extends BaseLoggingMock {
        setProjectId () {
          return Promise.resolve()
        }

        setDetectedResource () {
          this.detectedResource = detectedResource
          return Promise.resolve()
        }

        logSync (name) {
          return new LogMock(name)
        }
      }

      const { CloudLogging } = t.mock('../../lib/cloud-logging', {
        '@google-cloud/logging': { Logging: LoggingMock }
      })

      t.plan(3)

      const instance = new CloudLogging(logName, defaultOptions)

      await instance.init()

      instance.parseLine(JSON.stringify(expectedLogEntry))
    })

    nested.test('Should parse a line correctly (custom meta)', async t => {
      let expectedEntry
      const expectedLogEntry = {
        some: 'log',
        being: 'printed',
        message: 'being printed',
        meta: {
          trace: 'testTrace-123'
        }
      }
      class LogMock extends BaseLogMock {
        entry (meta, log) {
          const expectedMeta = Object.assign(
            expectedLogEntry.meta,
            {
              severity: CloudLogging.SEVERITY_MAP[30],
              labels: {
                logger: 'pino',
                agent: 'cloud_pine'
              }
            },
            { resource: Object.assign({ type: 'global' }, detectedResource) }
          )

          const { meta: _meta, ...expectedLog } = expectedLogEntry

          t.same(meta, expectedMeta)
          t.same(log, expectedLog)

          return (
            (expectedEntry = Object.assign({}, meta, {
              jsonPayload: expectedLog,
              logName: this.name
            })),
            expectedEntry
          )
        }

        write (entry) {
          t.same(entry, expectedEntry)
        }
      }

      class LoggingMock extends BaseLoggingMock {
        setProjectId () {
          return Promise.resolve()
        }

        setDetectedResource () {
          this.detectedResource = detectedResource
          return Promise.resolve()
        }

        logSync (name) {
          return new LogMock(name)
        }
      }

      const { CloudLogging } = t.mock('../../lib/cloud-logging', {
        '@google-cloud/logging': { Logging: LoggingMock }
      })

      t.plan(3)

      const instance = new CloudLogging(logName, defaultOptions)

      await instance.init()

      instance.parseLine(JSON.stringify(expectedLogEntry))
    })

    nested.test('Should discard non-object meta and parse a line correctly', async t => {
      let expectedEntry
      const expectedLogEntry = {
        some: 'log',
        being: 'printed',
        message: 'being printed',
        meta: false
      }

      class LogMock extends BaseLogMock {
        entry (meta, log) {
          const expectedMeta = Object.assign(
            {
              severity: CloudLogging.SEVERITY_MAP[30],
              labels: {
                logger: 'pino',
                agent: 'cloud_pine'
              }
            },
            { resource: Object.assign({ type: 'global' }, detectedResource) }
          )

          t.same(meta, expectedMeta)
          t.same(log, expectedLogEntry)

          return (
            (expectedEntry = Object.assign({}, meta, {
              jsonPayload: expectedLogEntry,
              logName: this.name
            })),
            expectedEntry
          )
        }

        write (entry) {
          t.same(entry, expectedEntry)
        }
      }

      class LoggingMock extends BaseLoggingMock {
        setProjectId () {
          return Promise.resolve()
        }

        setDetectedResource () {
          this.detectedResource = detectedResource
          return Promise.resolve()
        }

        logSync (name) {
          return new LogMock(name)
        }
      }

      const { CloudLogging } = t.mock('../../lib/cloud-logging', {
        '@google-cloud/logging': { Logging: LoggingMock }
      })

      t.plan(3)

      const instance = new CloudLogging(logName, defaultOptions)

      await instance.init()

      instance.parseLine(JSON.stringify(expectedLogEntry))
    })

    nested.test('Should delete the msg and meta property', async t => {
      let expectedEntry
      const logEntry = {
        level: 50,
        some: 'log',
        being: 'printed',
        msg: 'being printed',
        meta: {
          trace: 'testTrace-123',
          spanId: 'testSpan-123'
        }
      }
      class LogMock extends BaseLogMock {
        entry (meta, log) {
          const expectedMeta = Object.assign(
            logEntry.meta,
            {
              severity: CloudLogging.SEVERITY_MAP[50],
              labels: {
                logger: 'pino',
                agent: 'cloud_pine'
              }
            },
            { resource: Object.assign({ type: 'global' }, detectedResource) }
          )
          const expectedLogEntry = Object.assign({ message: '' }, logEntry)

          expectedLogEntry.message = logEntry.msg
          delete expectedLogEntry.msg

          const { meta: _meta, ...expectedLog } = expectedLogEntry

          delete expectedLogEntry.meta

          t.same(meta, expectedMeta)
          t.same(log, expectedLog)

          return (
            (expectedEntry = Object.assign({}, meta, {
              jsonPayload: log,
              logName: this.name
            })),
            expectedEntry
          )
        }

        write (entry) {
          t.notOk(entry.jsonPayload.msg)
          t.notOk(entry.jsonPayload.meta)
          t.equal(entry.jsonPayload.message, logEntry.msg)
          t.same(entry, expectedEntry)
        }
      }

      class LoggingMock extends BaseLoggingMock {
        setProjectId () {
          return Promise.resolve()
        }

        setDetectedResource () {
          this.detectedResource = detectedResource
          return Promise.resolve()
        }

        logSync (name) {
          return new LogMock(name)
        }
      }

      const { CloudLogging } = t.mock('../../lib/cloud-logging', {
        '@google-cloud/logging': { Logging: LoggingMock }
      })

      t.plan(6)

      const instance = new CloudLogging(logName, defaultOptions)

      await instance.init()

      instance.parseLine(JSON.stringify(logEntry))
    })

    nested.test('Should handle msg property', async t => {
      let expectedEntry
      const logEntry = {
        level: 50,
        some: 'log',
        being: 'printed',
        msg: 'being printed',
        meta: {
          trace: 'testTrace-123'
        }
      }
      class LogMock extends BaseLogMock {
        entry (meta, log) {
          const expectedMeta = Object.assign(
            logEntry.meta,
            {
              severity: CloudLogging.SEVERITY_MAP[50],
              labels: {
                logger: 'pino',
                agent: 'cloud_pine'
              }
            },
            { resource: Object.assign({ type: 'global' }, detectedResource) }
          )
          const expectedLogEntry = Object.assign({ message: '' }, logEntry)

          expectedLogEntry.message = logEntry.msg
          delete expectedLogEntry.msg

          const { meta: _meta, ...expectedLog } = expectedLogEntry

          t.same(meta, expectedMeta)
          t.same(log, expectedLog)

          return (
            (expectedEntry = Object.assign({}, meta, {
              jsonPayload: log,
              logName: this.name
            })),
            expectedEntry
          )
        }

        write (entry) {
          t.notOk(entry.jsonPayload.msg)
          t.equal(entry.jsonPayload.message, logEntry.msg)
          t.same(entry, expectedEntry)
        }
      }

      class LoggingMock extends BaseLoggingMock {
        setProjectId () {
          return Promise.resolve()
        }

        setDetectedResource () {
          this.detectedResource = detectedResource
          return Promise.resolve()
        }

        logSync (name) {
          return new LogMock(name)
        }
      }

      const { CloudLogging } = t.mock('../../lib/cloud-logging', {
        '@google-cloud/logging': { Logging: LoggingMock }
      })

      t.plan(5)

      const instance = new CloudLogging(logName, defaultOptions)

      await instance.init()

      instance.parseLine(JSON.stringify(logEntry))
    })

    nested.test('Should respect default labels when parsing lines', async t => {
      let expectedEntry
      const logEntry = {
        level: 50,
        some: 'log',
        being: 'printed',
        msg: 'being printed'
      }
      const defaultLabels = {
        some: 'label',
        another: 'label'
      }
      const newLogLabels = {
        passed: 'when',
        parsing: 'line'
      }
      class LogMock extends BaseLogMock {
        entry (meta, log) {
          const expectedMeta = Object.assign(
            {
              severity: CloudLogging.SEVERITY_MAP[50],
              labels: Object.assign(
                {
                  logger: 'pino',
                  agent: 'cloud_pine'
                },
                defaultLabels,
                newLogLabels
              )
            },
            { resource: Object.assign({ type: 'global' }, detectedResource) }
          )
          const expectedLogEntry = Object.assign({ message: '' }, logEntry)

          expectedLogEntry.message = logEntry.msg

          delete expectedLogEntry.msg

          t.same(meta, expectedMeta)
          t.same(log, expectedLogEntry)

          return (
            (expectedEntry = Object.assign({}, meta, {
              jsonPayload: log,
              logName: this.name
            })),
            expectedEntry
          )
        }

        write (entry) {
          t.notOk(entry.jsonPayload.msg)
          t.equal(entry.jsonPayload.message, logEntry.msg)
          t.same(entry, expectedEntry)
        }
      }

      class LoggingMock extends BaseLoggingMock {
        setProjectId () {
          return Promise.resolve()
        }

        setDetectedResource () {
          this.detectedResource = detectedResource
          return Promise.resolve()
        }

        logSync (name) {
          return new LogMock(name)
        }
      }

      const { CloudLogging } = t.mock('../../lib/cloud-logging', {
        '@google-cloud/logging': { Logging: LoggingMock }
      })

      t.plan(10)

      const instance = new CloudLogging(
        logName,
        Object.assign({}, { defaultLabels }, defaultOptions)
      )

      await instance.init()

      instance.parseLine(
        JSON.stringify(
          Object.assign({}, logEntry, {
            meta: {
              labels: newLogLabels
            }
          })
        )
      )
      instance.parseLine(
        JSON.stringify(
          Object.assign({}, logEntry, {
            meta: {
              labels: newLogLabels
            }
          })
        )
      )
    })

    nested.test('Should handle an httpRequest prop being passed', async t => {
      let expectedEntry
      const expectedLogEntry = {
        some: 'log',
        being: 'printed',
        message: 'being printed',
        meta: {
          trace: 'testTrace-123'
        }
      }
      const httpRequestLog = {
        requestMethod: 'POST',
        requestUrl: 'some/url',
        requestSize: '1234',
        status: '201',
        responseSize: '1234',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
        remoteIp: '192.132.34.2',
        serverIp: '192.132.34.2',
        referer: 'https://developer.mozilla.org/es/docs/Web/JavaScript',
        latency: '1234',
        cacheLookup: false,
        cacheHit: true,
        cacheValidatedWithOriginServer: false,
        cacheFillBytes: false,
        protocol: 'HTTPS'
      }
      class LogMock extends BaseLogMock {
        entry (meta, log) {
          const expectedMeta = Object.assign(
            expectedLogEntry.meta,
            {
              httpRequest: httpRequestLog,
              severity: CloudLogging.SEVERITY_MAP[30],
              labels: {
                logger: 'pino',
                agent: 'cloud_pine'
              }
            },
            { resource: Object.assign({ type: 'global' }, detectedResource) }
          )

          const { meta: _meta, ...expectedLog } = expectedLogEntry

          t.same(meta, expectedMeta)
          t.same(log, expectedLog)

          return (
            (expectedEntry = Object.assign({}, meta, {
              jsonPayload: expectedLogEntry,
              logName: this.name
            })),
            expectedEntry
          )
        }

        write (entry) {
          t.same(entry, expectedEntry)
        }
      }

      class LoggingMock extends BaseLoggingMock {
        setProjectId () {
          return Promise.resolve()
        }

        setDetectedResource () {
          this.detectedResource = detectedResource
          return Promise.resolve()
        }

        logSync (name) {
          return new LogMock(name)
        }
      }

      const { CloudLogging } = t.mock('../../lib/cloud-logging', {
        '@google-cloud/logging': { Logging: LoggingMock }
      })

      t.plan(3)

      const instance = new CloudLogging(logName, defaultOptions)

      await instance.init()

      instance.parseLine(
        JSON.stringify(
          Object.assign({ httpRequest: httpRequestLog }, expectedLogEntry)
        )
      )
    })

    nested.test(
      'Should map into an error log if the line is malformed',
      async t => {
        let expectedEntry
        const expectedLogEntry = {
          error: new SyntaxError('Unexpected token { in JSON at position 1'),
          message: 'Malformed log entry'
        }
        class LogMock extends BaseLogMock {
          entry (meta, log) {
            const expectedMeta = Object.assign(
              {
                severity: CloudLogging.SEVERITY_MAP[50],
                labels: {
                  logger: 'pino',
                  agent: 'cloud_pine'
                }
              },
              { resource: Object.assign({ type: 'global' }, detectedResource) }
            )

            t.same(meta, expectedMeta)
            t.same(log, expectedLogEntry)

            return (
              (expectedEntry = Object.assign({}, meta, {
                jsonPayload: expectedLogEntry,
                logName: this.name
              })),
              expectedEntry
            )
          }

          write (entry) {
            t.same(entry, expectedEntry)
          }
        }

        class LoggingMock extends BaseLoggingMock {
          setProjectId () {
            return Promise.resolve()
          }

          setDetectedResource () {
            this.detectedResource = detectedResource
            return Promise.resolve()
          }

          logSync (name) {
            return new LogMock(name)
          }
        }

        const { CloudLogging } = t.mock('../../lib/cloud-logging', {
          '@google-cloud/logging': { Logging: LoggingMock }
        })

        t.plan(3)

        const instance = new CloudLogging(logName, defaultOptions)

        await instance.init()

        instance.parseLine('{{}')
      }
    )
  })
})

tap.test('CloudLogging#async', root => {
  root.plan(3)
  root.test('#mapSeverity', t => {
    const cloudLogging = new CloudLogging({})
    t.plan(7)

    t.equal(cloudLogging.mapSeverity('10'), 'DEBUG')
    t.equal(cloudLogging.mapSeverity('20'), 'DEBUG')
    t.equal(cloudLogging.mapSeverity('30'), 'INFO')
    t.equal(cloudLogging.mapSeverity('40'), 'WARNING')
    t.equal(cloudLogging.mapSeverity('50'), 'ERROR')
    t.equal(cloudLogging.mapSeverity('60'), 'CRITICAL')
    t.equal(cloudLogging.mapSeverity('100'), 'INFO')
  })

  root.test('#init', nested => {
    nested.plan(3)

    nested.test(
      'Should initialize the log instance with resources',
      async t => {
        const logName = 'test'
        const projectId = 'test-project'
        const detectedResource = {
          labels: {
            projectId,
            instanceId: '12345678901234',
            zone: 'us-central1-a'
          }
        }
        const defaultOptions = {
          googleCloudOptions: {
            projectId,
            keyFilename: '/path/to/keyfile.json'
          }
        }

        class LoggingMock extends BaseLoggingMock {
          constructor (options) {
            t.same(options, defaultOptions.googleCloudOptions)
            super()
          }

          setProjectId () {
            return Promise.resolve()
          }

          setDetectedResource () {
            this.detectedResource = detectedResource
            return Promise.resolve()
          }

          log (name) {
            t.equal(name, logName)
            return new BaseLogMock(name)
          }
        }

        const expectedDetectedResource = Object.assign(
          { type: 'global' },
          detectedResource
        )
        const { CloudLogging } = t.mock('../../lib/cloud-logging', {
          '@google-cloud/logging': { Logging: LoggingMock }
        })

        t.plan(3)

        const instance = new CloudLogging(logName, defaultOptions)

        await instance.init()
        t.same(instance.resource, expectedDetectedResource)
      }
    )

    nested.test(
      'Calles made to #resource should return the fresh object of the parent resource',
      async t => {
        const logName = 'test'
        const projectId = 'test-project'
        const detectedResource = {
          labels: {
            projectId,
            instanceId: '12345678901234',
            zone: 'us-central1-a'
          }
        }
        const defaultOptions = {
          googleCloudOptions: {
            projectId,
            keyFilename: '/path/to/keyfile.json'
          }
        }

        class LoggingMock extends BaseLoggingMock {
          constructor (options) {
            t.same(options, defaultOptions.googleCloudOptions)
            super()
          }

          setProjectId () {
            return Promise.resolve()
          }

          setDetectedResource () {
            this.detectedResource = detectedResource
            return Promise.resolve()
          }

          log (name) {
            t.equal(name, logName)
            return new BaseLogMock(name)
          }
        }

        const expectedDetectedResource = Object.assign(
          { type: 'global' },
          detectedResource
        )
        const { CloudLogging } = t.mock('../../lib/cloud-logging', {
          '@google-cloud/logging': { Logging: LoggingMock }
        })

        t.plan(5)

        const instance = new CloudLogging(logName, defaultOptions)

        await instance.init()
        t.same(instance.resource, expectedDetectedResource)
        t.same(instance.resource, expectedDetectedResource)
        t.same(instance.resource, expectedDetectedResource)
      }
    )

    nested.test(
      'Should be skip if skipInit flag is set',
      async t => {
        const logName = 'test'
        const projectId = 'test-project'
        const detectedResource = {
          labels: {
            projectId,
            instanceId: '12345678901234',
            zone: 'us-central1-a'
          }
        }
        const defaultOptions = {
          googleCloudOptions: {
            projectId,
            keyFilename: '/path/to/keyfile.json'
          },
          skipInit: true
        }

        class LoggingMock extends BaseLoggingMock {
          constructor (options) {
            t.same(options, defaultOptions.googleCloudOptions)
            super()
          }

          setProjectId () {
            t.fail('setProjectId should not be called')
            return Promise.resolve()
          }

          setDetectedResource () {
            t.fail('setDetectedResource should not be called')
            this.detectedResource = detectedResource
            return Promise.resolve()
          }

          log (name) {
            t.equal(name, logName)
            return new BaseLogMock(name)
          }
        }

        const expectedDetectedResource = Object.assign(
          { type: 'global' },
          detectedResource
        )
        const { CloudLogging } = t.mock('../../lib/cloud-logging', {
          '@google-cloud/logging': { Logging: LoggingMock }
        })

        t.plan(4)

        const instance = new CloudLogging(logName, defaultOptions)

        await instance.init()
        t.notOk(instance.sync)
        t.notSame(instance.resource, expectedDetectedResource)
      }
    )
  })

  root.test('#parseLine', nested => {
    const logName = 'test'
    const projectId = 'test-project'
    const detectedResource = {
      labels: {
        projectId,
        instanceId: '12345678901234',
        zone: 'us-central1-a'
      }
    }
    const defaultOptions = {
      googleCloudOptions: {
        projectId,
        keyFilename: '/path/to/keyfile.json'
      }
    }

    nested.plan(8)

    nested.test('Should discard non-object meta and parse a line correctly', async t => {
      let expectedEntry
      const expectedLogEntry = {
        some: 'log',
        being: 'printed',
        message: 'being printed',
        meta: false
      }
      class LogMock extends BaseLogMock {
        entry (meta, log) {
          const expectedMeta = Object.assign(
            {
              severity: CloudLogging.SEVERITY_MAP[30],
              labels: {
                logger: 'pino',
                agent: 'cloud_pine'
              }
            },
            { resource: Object.assign({ type: 'global' }, detectedResource) }
          )

          t.same(meta, expectedMeta)
          t.same(log, expectedLogEntry)

          return (
            (expectedEntry = Object.assign({}, meta, {
              jsonPayload: expectedLogEntry,
              logName: this.name
            })),
            expectedEntry
          )
        }

        write (entry) {
          t.same(entry, expectedEntry)
        }
      }

      class LoggingMock extends BaseLoggingMock {
        setProjectId () {
          return Promise.resolve()
        }

        setDetectedResource () {
          this.detectedResource = detectedResource
          return Promise.resolve()
        }

        log (name) {
          return new LogMock(name)
        }
      }

      const { CloudLogging } = t.mock('../../lib/cloud-logging', {
        '@google-cloud/logging': { Logging: LoggingMock }
      })

      t.plan(3)

      const instance = new CloudLogging(logName, defaultOptions)

      await instance.init()

      instance.parseLine(JSON.stringify(expectedLogEntry))
    })

    nested.test('Should parse a line correctly', async t => {
      let expectedEntry
      const expectedLogEntry = {
        some: 'log',
        being: 'printed',
        message: 'being printed',
        meta: {
          trace: 'exampleTrace-123'
        }
      }
      class LogMock extends BaseLogMock {
        entry (meta, log) {
          const expectedMeta = Object.assign(
            expectedLogEntry.meta,
            {
              severity: CloudLogging.SEVERITY_MAP[30],
              labels: {
                logger: 'pino',
                agent: 'cloud_pine'
              }
            },
            { resource: Object.assign({ type: 'global' }, detectedResource) }
          )

          const { meta: _meta, ...expectedLog } = expectedLogEntry

          t.same(meta, expectedMeta)
          t.same(log, expectedLog)

          return (
            (expectedEntry = Object.assign({}, meta, {
              jsonPayload: expectedLogEntry,
              logName: this.name
            })),
            expectedEntry
          )
        }

        write (entry) {
          t.same(entry, expectedEntry)
        }
      }

      class LoggingMock extends BaseLoggingMock {
        setProjectId () {
          return Promise.resolve()
        }

        setDetectedResource () {
          this.detectedResource = detectedResource
          return Promise.resolve()
        }

        log (name) {
          return new LogMock(name)
        }
      }

      const { CloudLogging } = t.mock('../../lib/cloud-logging', {
        '@google-cloud/logging': { Logging: LoggingMock }
      })

      t.plan(3)

      const instance = new CloudLogging(logName, defaultOptions)

      await instance.init()

      instance.parseLine(JSON.stringify(expectedLogEntry))
    })

    nested.test('Should parse a line correctly (custom severity)', async t => {
      let expectedEntry
      const expectedLogEntry = {
        level: 50,
        some: 'log',
        being: 'printed',
        message: 'being printed',
        meta: {
          trace: 'testTrace-123'
        }
      }
      class LogMock extends BaseLogMock {
        entry (meta, log) {
          const expectedMeta = Object.assign(
            expectedLogEntry.meta,
            {
              severity: CloudLogging.SEVERITY_MAP[50],
              labels: {
                logger: 'pino',
                agent: 'cloud_pine'
              }
            },
            { resource: Object.assign({ type: 'global' }, detectedResource) }
          )

          const { meta: _meta, ...expectedLog } = expectedLogEntry

          t.same(meta, expectedMeta)
          t.same(log, expectedLog)

          return (
            (expectedEntry = Object.assign({}, meta, {
              jsonPayload: expectedLogEntry,
              logName: this.name
            })),
            expectedEntry
          )
        }

        write (entry) {
          t.same(entry, expectedEntry)
        }
      }

      class LoggingMock extends BaseLoggingMock {
        setProjectId () {
          return Promise.resolve()
        }

        setDetectedResource () {
          this.detectedResource = detectedResource
          return Promise.resolve()
        }

        log (name) {
          return new LogMock(name)
        }
      }

      const { CloudLogging } = t.mock('../../lib/cloud-logging', {
        '@google-cloud/logging': { Logging: LoggingMock }
      })

      t.plan(3)

      const instance = new CloudLogging(logName, defaultOptions)

      await instance.init()

      instance.parseLine(JSON.stringify(expectedLogEntry))
    })

    nested.test('Should parse a line correctly (custom meta)', async t => {
      let expectedEntry
      const expectedLogEntry = {
        some: 'log',
        being: 'printed',
        message: 'being printed',
        meta: {
          trace: 'exampleTrace-123'
        }
      }
      class LogMock extends BaseLogMock {
        entry (meta, log) {
          const expectedMeta = Object.assign(
            expectedLogEntry.meta,
            {
              severity: CloudLogging.SEVERITY_MAP[30],
              labels: {
                logger: 'pino',
                agent: 'cloud_pine'
              }
            },
            { resource: Object.assign({ type: 'global' }, detectedResource) }
          )

          const { meta: _meta, ...expectedLog } = expectedLogEntry

          t.same(meta, expectedMeta)
          t.same(log, expectedLog)

          return (
            (expectedEntry = Object.assign({}, meta, {
              jsonPayload: expectedLogEntry,
              logName: this.name
            })),
            expectedEntry
          )
        }

        write (entry) {
          t.same(entry, expectedEntry)
        }
      }

      class LoggingMock extends BaseLoggingMock {
        setProjectId () {
          return Promise.resolve()
        }

        setDetectedResource () {
          this.detectedResource = detectedResource
          return Promise.resolve()
        }

        log (name) {
          return new LogMock(name)
        }
      }

      const { CloudLogging } = t.mock('../../lib/cloud-logging', {
        '@google-cloud/logging': { Logging: LoggingMock }
      })

      t.plan(3)

      const instance = new CloudLogging(logName, defaultOptions)

      await instance.init()

      instance.parseLine(JSON.stringify(expectedLogEntry))
    })

    nested.test('Should handle msg property', async t => {
      let expectedEntry
      const logEntry = {
        level: 50,
        some: 'log',
        being: 'printed',
        msg: 'being printed',
        meta: {
          trace: 'testTrace-123'
        }
      }
      class LogMock extends BaseLogMock {
        entry (meta, log) {
          const expectedMeta = Object.assign(
            logEntry.meta,
            {
              severity: CloudLogging.SEVERITY_MAP[50],
              labels: {
                logger: 'pino',
                agent: 'cloud_pine'
              }
            },
            { resource: Object.assign({ type: 'global' }, detectedResource) }
          )
          const expectedLogEntry = Object.assign({ message: '' }, logEntry)

          expectedLogEntry.message = logEntry.msg
          delete expectedLogEntry.msg

          const { meta: _meta, ...expectedLog } = expectedLogEntry

          t.same(meta, expectedMeta)
          t.same(log, expectedLog)

          return (
            (expectedEntry = Object.assign({}, meta, {
              jsonPayload: log,
              logName: this.name
            })),
            expectedEntry
          )
        }

        write (entry) {
          t.notOk(entry.jsonPayload.msg)
          t.equal(entry.jsonPayload.message, logEntry.msg)
          t.same(entry, expectedEntry)
        }
      }

      class LoggingMock extends BaseLoggingMock {
        setProjectId () {
          return Promise.resolve()
        }

        setDetectedResource () {
          this.detectedResource = detectedResource
          return Promise.resolve()
        }

        log (name) {
          return new LogMock(name)
        }
      }

      const { CloudLogging } = t.mock('../../lib/cloud-logging', {
        '@google-cloud/logging': { Logging: LoggingMock }
      })

      t.plan(5)

      const instance = new CloudLogging(logName, defaultOptions)

      await instance.init()

      instance.parseLine(JSON.stringify(logEntry))
    })

    nested.test('Should respect default labels when parsing lines', async t => {
      let expectedEntry
      const logEntry = {
        level: 50,
        some: 'log',
        being: 'printed',
        msg: 'being printed'
      }
      const defaultLabels = {
        some: 'label',
        another: 'label'
      }
      const newLogLabels = {
        passed: 'when',
        parsing: 'line'
      }
      class LogMock extends BaseLogMock {
        entry (meta, log) {
          const expectedMeta = Object.assign(
            {
              severity: CloudLogging.SEVERITY_MAP[50],
              labels: Object.assign(
                {
                  logger: 'pino',
                  agent: 'cloud_pine'
                },
                defaultLabels,
                newLogLabels
              )
            },
            { resource: Object.assign({ type: 'global' }, detectedResource) }
          )
          const expectedLogEntry = Object.assign({ message: '' }, logEntry)

          expectedLogEntry.message = logEntry.msg

          delete expectedLogEntry.msg

          t.same(meta, expectedMeta)
          t.same(log, expectedLogEntry)

          return (
            (expectedEntry = Object.assign({}, meta, {
              jsonPayload: log,
              logName: this.name
            })),
            expectedEntry
          )
        }

        write (entry) {
          t.notOk(entry.jsonPayload.msg)
          t.equal(entry.jsonPayload.message, logEntry.msg)
          t.same(entry, expectedEntry)
        }
      }

      class LoggingMock extends BaseLoggingMock {
        setProjectId () {
          return Promise.resolve()
        }

        setDetectedResource () {
          this.detectedResource = detectedResource
          return Promise.resolve()
        }

        log (name) {
          return new LogMock(name)
        }
      }

      const { CloudLogging } = t.mock('../../lib/cloud-logging', {
        '@google-cloud/logging': { Logging: LoggingMock }
      })

      t.plan(10)

      const instance = new CloudLogging(
        logName,
        Object.assign({}, { defaultLabels }, defaultOptions)
      )

      await instance.init()

      instance.parseLine(
        JSON.stringify(
          Object.assign({}, logEntry, {
            meta: {
              labels: newLogLabels
            }
          })
        )
      )
      instance.parseLine(
        JSON.stringify(
          Object.assign({}, logEntry, {
            meta: {
              labels: newLogLabels
            }
          })
        )
      )
    })

    nested.test('Should handle an httpRequest prop being passed', async t => {
      let expectedEntry
      const expectedLogEntry = {
        some: 'log',
        being: 'printed',
        message: 'being printed',
        meta: {
          trace: 'testTrace-123'
        }
      }
      const httpRequestLog = {
        requestMethod: 'POST',
        requestUrl: 'some/url',
        requestSize: '1234',
        status: '201',
        responseSize: '1234',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
        remoteIp: '192.132.34.2',
        serverIp: '192.132.34.2',
        referer: 'https://developer.mozilla.org/es/docs/Web/JavaScript',
        latency: '1234',
        cacheLookup: false,
        cacheHit: true,
        cacheValidatedWithOriginServer: false,
        cacheFillBytes: false,
        protocol: 'HTTPS'
      }
      class LogMock extends BaseLogMock {
        entry (meta, log) {
          const expectedMeta = Object.assign(
            expectedLogEntry.meta,
            {
              httpRequest: httpRequestLog,
              severity: CloudLogging.SEVERITY_MAP[30],
              labels: {
                logger: 'pino',
                agent: 'cloud_pine'
              }
            },
            { resource: Object.assign({ type: 'global' }, detectedResource) }
          )

          const { meta: _meta, ...expectedLog } = expectedLogEntry

          t.same(meta, expectedMeta)
          t.same(log, expectedLog)

          return (
            (expectedEntry = Object.assign({}, meta, {
              jsonPayload: expectedLogEntry,
              logName: this.name
            })),
            expectedEntry
          )
        }

        write (entry) {
          t.same(entry, expectedEntry)
        }
      }

      class LoggingMock extends BaseLoggingMock {
        setProjectId () {
          return Promise.resolve()
        }

        setDetectedResource () {
          this.detectedResource = detectedResource
          return Promise.resolve()
        }

        log (name) {
          return new LogMock(name)
        }
      }

      const { CloudLogging } = t.mock('../../lib/cloud-logging', {
        '@google-cloud/logging': { Logging: LoggingMock }
      })

      t.plan(3)

      const instance = new CloudLogging(logName, defaultOptions)

      await instance.init()

      instance.parseLine(
        JSON.stringify(
          Object.assign({ httpRequest: httpRequestLog }, expectedLogEntry)
        )
      )
    })

    nested.test(
      'Should map into an error log if the line is malformed',
      async t => {
        let expectedEntry
        const expectedLogEntry = {
          error: new SyntaxError('Unexpected token { in JSON at position 1'),
          message: 'Malformed log entry'
        }
        class LogMock extends BaseLogMock {
          entry (meta, log) {
            const expectedMeta = Object.assign(
              {
                severity: CloudLogging.SEVERITY_MAP[50],
                labels: {
                  logger: 'pino',
                  agent: 'cloud_pine'
                }
              },
              { resource: Object.assign({ type: 'global' }, detectedResource) }
            )

            t.same(meta, expectedMeta)
            t.same(log, expectedLogEntry)

            return (
              (expectedEntry = Object.assign({}, meta, {
                jsonPayload: expectedLogEntry,
                logName: this.name
              })),
              expectedEntry
            )
          }

          write (entry) {
            t.same(entry, expectedEntry)
          }
        }

        class LoggingMock extends BaseLoggingMock {
          setProjectId () {
            return Promise.resolve()
          }

          setDetectedResource () {
            this.detectedResource = detectedResource
            return Promise.resolve()
          }

          log (name) {
            return new LogMock(name)
          }
        }

        const { CloudLogging } = t.mock('../../lib/cloud-logging', {
          '@google-cloud/logging': { Logging: LoggingMock }
        })

        t.plan(3)

        const instance = new CloudLogging(logName, defaultOptions)

        await instance.init()

        instance.parseLine('{{}')
      }
    )
  })
})
