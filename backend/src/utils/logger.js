const winston = require('winston');
const path = require('path');

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const transports = [
  new winston.transports.Console({
    format: combine(colorize(), simple()),
  }),
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
    format: combine(timestamp(), errors({ stack: true }), json()),
  }),
  new winston.transports.File({
    filename: path.join('logs', 'combined.log'),
    format: combine(timestamp(), errors({ stack: true }), json()),
  }),
];

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join('logs', 'exceptions.log') }),
  ],
});

module.exports = logger;
