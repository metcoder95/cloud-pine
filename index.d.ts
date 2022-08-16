/// <reference types="node" />
import { Transform } from 'stream';
import { LoggingOptions, Log, LogSync } from '@google-cloud/logging';

declare function CloudPine(options?: PrettyOptions_): Transform;

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
    logOptions?: ConstructorParameters<Log> | ConstructorParameters<LogSync>;
  };
};

export default CloudPine;
export { CloudPineOptions };
