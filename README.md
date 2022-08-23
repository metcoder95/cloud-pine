[![CI](https://github.com/metcoder95/cloud-pine/actions/workflows/ci.yml/badge.svg)](https://github.com/metcoder95/cloud-pine/actions/workflows/ci.yml)
[![CodeQL](https://github.com/metcoder95/cloud-pine/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/metcoder95/cloud-pine/actions/workflows/codeql-analysis.yml)
![version](https://badge.fury.io/js/cloud-pine.svg)

# Cloud Pine

Pino Transport that abstracts Google Cloud Logging implementation underneath.

## Description

This library executes a thin abstraction of the [`@google-cloud/logging`](https://cloud.google.com/nodejs/docs/reference/logging/latest) client library.
The goal is to provide a clean support over Google Cloud Logging service for the Pino ecosystem using the Transport feature of Pino itself.

### Usage

#### How to use it?

The library can be used either by piping logs using the `pipe` operator on Linux, or programatically by installing it as part of your dependencies in you project.

**Within your Dependencies**

Using it programatically, is easy as just install the library as part for your dependencies in any of the following ways:

- **npm**: `npm install cloud-pine`

- **yarn**: `yarn add cloud-pine`

- **pnpm**: `pnpm install cloud-pine`

Once installed, is necessary to set it up as part of of your Pino transport configuration, an example can be:

```js
const Pino = require('pino')
const logger = Pino({
   transport: {
      target: 'cloud-pine',
      options: {
         cloudLoggingOptions: {
            skipInit: true,
            sync: true,
         }
      }
   }
})


logger.info('hello world')
logger.error({ oops: 'hello!' }, 'error')
```

or in **TypeScript**

```ts
import Pino from ('pino')

const logger = Pino({
   transport: {
      target: 'cloud-pine',
      options: {
         cloudLoggingOptions: {
            skipInit: true,
            sync: true,
         }
      }
   }
})


logger.info('hello world')
logger.error({ oops: 'hello!' }, 'error')
```

**Configuration**
`Cloud-Pine` supports the following configuration:

```js
const cloudPine = {
    logName: 'cloud-pine', // Name of the logging agent. Default to 'cloud-pine'
    cloudLoggingOptions: {
        googleCloudOptions: {}, // Configuration Object for establishing connection with Google Cloud Logging. Default to undefined. Ref: https://cloud.google.com/nodejs/docs/reference/logging/latest/logging/loggingoptions

        resourceSettings: {}, // Resource settings hash, default to `{ type: 'global' }`. The hash is persisted across logs and inferred based on the API `Logging#setDetectedResource` result. Ref: https://cloud.google.com/logging/docs/reference/v2/rest/v2/MonitoredResource

        defaultLabels: {}, // Labels hash, default to `{ logger: 'pino', agent: 'cloud_pine' }`. The hash is persisted across logs. Ref: https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry,

        logOptions: {}, // Configuration object that is passed to the Log/LogSync instance. Default to undefined. Ref: https://cloud.google.com/nodejs/docs/reference/logging/latest/logging/log and https://cloud.google.com/nodejs/docs/reference/logging/latest/logging/logsync

        skipInit: false, // Indicates wheter to skip the automatic inferr of `projectId` and `MonitoredResource` metadata. Default to `false`.

        sync: false, // Indicates wheter to use a Log or LogSync instance. Default to false.
    }
}
```

>For more information about the `sync` and `async` diference, please take a look at the section [Sync or Async](#syncorasync)

**CLI**

When using it in CLI mode, all the logs are ingested automatically from `stdin`. In case exists some malformed log, the library will automatically dispatch an log with severity to `error` to Google Cloud Logging.

**Usage**

See the following description for usage:
```
Usage: cat log | cloud-pine --projectid someprojectid -l something=else -l service=http

  Flags
  -h  | --help              Display Help

  -v  | --version           Display Version

  -n  | --name              Log Name. Default to Cloud_Pine

  -s  | --sync              Cloud Logging Mode. Sync will print to `stdout` 
                            meanwhile async will forward logs to Cloud Logging.
                            Default to true.

  -p  | --projectid         Google Cloud Project ID. Default to automatic       
                            detected resource or 
                            `GOOGLE_APPLICATION_CREDENTIALS`

  -k  | --key               Path to key file

  -l  | --labels            Custom labels to be attached to the logging labels. 
                            Should be in the format `label=value`.
                            Can be used one or more times.

  -r  | --resource          Monitoring Resource type. Default to `type=global`
                            or Monitored Resource detected.

  -rs  | --resource-labels   Monitoring Resource#Labels that will be attached
                            to the resource by default.
                            Follows same pattern as `--labels`.

  -i  | --skip-init         Skips identification of monitored resource, which
                            will infer things like `project-id` and Monitored 
                            Resource settings. Default to false.
```

**TypeScript Interface**

```ts
type CloudPineOptions = {
  logName?: string;
  cloudLoggingOptions: {
    googleCloudOptions?: LoggingOptions;
    resourceSettings?: {
      type?: string;
      labels: Record<string, string>;
    };
    defaultLabels?: Record<string, string>;
    skipInit?: boolean;
    sync?: boolean;
    logOptions?: ConstructorParameters<typeof Log> | ConstructorParameters<typeof LogSync>;
  };
```

### Sync or Async
<a id="syncorasync"></a>

The library can be used in either of two modes, `sync` or `async`.

The default mode for the CLI usage is `sync` meaning that all logs will be directly streamed to `stdout`, meanwhile the default mode for the Transport usage is `async`, where all the logs will be streamed directly to Google Cloud Logging service.

>For more information about when to use one or another please take a look at the following documentation: [**Writting to `stdout`**](https://cloud.google.com/nodejs/docs/reference/logging/latest#writing-to-stdout).


