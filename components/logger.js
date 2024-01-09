/**
 * back-end logger for application
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import config from '../routes/index.js';
winston.emitErrs = true;

const tsFormat = () => (new Date()).toLocaleTimeString();

const logger = new winston.Logger({
  transports: [
    new DailyRotateFile({
      filename: config.logDir + '/-warning.log',
      timestamp: tsFormat,
      datePattern: 'yyyy-MM-dd',
      prepend: true,
      level: 'warn'
    }),
    new winston.transports.Console({
      level: 'debug',
      handleExceptions: true,
      json: false,
      colorize: true
    })
  ],
  exitOnError: false
});

export default logger;
