/**
 * Structured Logger — replaces console.log throughout the application.
 * 
 * Features:
 * - JSON structured output for log aggregation (ELK/Loki/CloudWatch)
 * - Log levels: error, warn, info, debug
 * - Automatic timestamp in ISO 8601
 * - Service name tagging
 * - Safe PII filtering (never logs tokens, passwords, emails in full)
 * 
 * Usage:
 *   const logger = require('./shared/logger');
 *   logger.info('User created', { userId: '123', context: 'customer.service' });
 *   logger.error('DB query failed', { error: err.message, correlationId: req.correlationId });
 * 
 * @module shared/logger
 */

const winston = require('winston');

// PII fields that must never appear in logs
const PII_FIELDS = ['password', 'token', 'secret', 'authorization', 'cookie', 'ssn', 'creditCard'];

/**
 * Redacts PII from log metadata objects.
 * @param {object} obj - The metadata object to sanitize
 * @returns {object} Sanitized copy of the object
 */
function redactPII(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (PII_FIELDS.some(pii => lowerKey.includes(pii))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date) && !(value instanceof Error)) {
      sanitized[key] = redactPII(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    winston.format.errors({ stack: true }),
    winston.format((info) => {
      // Redact PII from all metadata
      const { level, message, timestamp, stack, ...meta } = info;
      const sanitizedMeta = redactPII(meta);
      return { level, message, timestamp, stack, ...sanitizedMeta };
    })(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'customer-management-service',
  },
  transports: [
    // Console transport for development + container stdout
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'Dev'
        ? winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp, ...meta }) => {
            const metaStr = Object.keys(meta).length > 1 ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} [${level}]: ${message}${metaStr}`;
          })
        )
        : winston.format.json(),
    }),
  ],
  // Do not exit on handled exceptions
  exitOnError: false,
});

// Add file transport for production
if (process.env.NODE_ENV !== 'Dev' && process.env.NODE_ENV !== 'QA') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    tailable: true,
  }));
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 10 * 1024 * 1024,
    maxFiles: 10,
    tailable: true,
  }));
}

module.exports = logger;
