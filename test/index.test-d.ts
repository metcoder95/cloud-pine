import { Transform } from 'stream';
import { expectAssignable, expectType } from 'tsd';

import Pino from 'pino';

import CloudPine, { CloudPineOptions } from '../';


const options: CloudPineOptions = {
  logName: 'something',
  cloudLoggingOptions: {
    googleCloudOptions: {
      projectId: 'some-projectid',
    },
    skipInit: true,
    sync: false,
  },
};

expectType<typeof CloudPine>(CloudPine);
expectAssignable<CloudPineOptions>({
  logName: 'something',
  cloudLoggingOptions: {
    googleCloudOptions: {
      projectId: 'some-projectid',
    },
    skipInit: true,
    sync: false,
  },
});
expectType<Transform>(CloudPine(options));

Pino({
    transport: {
        options,
        target: 'cloud-pine',
    }
})
