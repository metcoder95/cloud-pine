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

tap.plan(1)

tap.test('CloudLogging', root => {
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
    nested.plan(2)

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

        const labels = Object.assign(
          { logger: 'pino' },
          detectedResource.labels
        )
        const { CloudLogging } = t.mock('../../lib/cloud-logging', {
          '@google-cloud/logging': { Logging: LoggingMock }
        })

        t.plan(3)

        const instance = new CloudLogging(logName, defaultOptions)

        await instance.init()
        t.same(
          instance.resource,
          Object.assign({}, detectedResource, {
            type: 'global',
            labels: labels
          })
        )
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

        const labels = Object.assign(
          { logger: 'pino' },
          detectedResource.labels
        )
        const { CloudLogging } = t.mock('../../lib/cloud-logging', {
          '@google-cloud/logging': { Logging: LoggingMock }
        })

        t.plan(5)

        const instance = new CloudLogging(logName, defaultOptions)

        await instance.init()
        t.same(
          instance.resource,
          Object.assign({}, detectedResource, {
            type: 'global',
            labels: labels
          })
        )
        t.same(
          instance.resource,
          Object.assign({}, detectedResource, {
            type: 'global',
            labels: labels
          })
        )
        t.same(
          instance.resource,
          Object.assign({}, detectedResource, {
            type: 'global',
            labels: labels
          })
        )
      }
    )
  })

  root.test('#parseLine', { todo: true })
})
