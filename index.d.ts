/// <reference types="node" />
import { Transform } from 'stream';
import { LoggingOptions, Log, LogSync } from '@google-cloud/logging';

declare function CloudPine(options?: CloudPineOptions): Transform;

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
};

export default CloudPine;
export { CloudPineOptions };
