/**
 * Centralized Error Handling — AppError class and error handler middleware.
 * 
 * Purpose:
 * - Standardize ALL error responses across the API
 * - Classify errors by type (validation, auth, business, server)
 * - Include correlation IDs for traceability
 * - Prevent internal details from leaking to clients
 * 
 * Usage:
 *   const { AppError, ErrorCodes } = require('./shared/errors/AppError');
 *   throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Email is required', 400);
 * 
 * @module shared/errors/AppError
 */

const logger = require('../logger');

// ═══════════════════════════════════════════════════════════════════
// Error Codes Enum — prevents magic strings throughout codebase
// ═══════════════════════════════════════════════════════════════════
const ErrorCodes = Object.freeze({
  // Validation (400-422)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

  // Authentication (401)
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_MISSING: 'TOKEN_MISSING',

  // Authorization (403)
  AUTHORIZATION_FAILED: 'AUTHORIZATION_FAILED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Not Found (404)
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',

  // Business Rules (409, 422)
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  STATE_CONFLICT: 'STATE_CONFLICT',

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Server (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',

  // External (502-504)
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  EXTERNAL_SERVICE_TIMEOUT: 'EXTERNAL_SERVICE_TIMEOUT',
});

// ═══════════════════════════════════════════════════════════════════
// AppError — Custom error class for all application errors
// ═══════════════════════════════════════════════════════════════════
class AppError extends Error {
  /**
   * @param {string} code - Error code from ErrorCodes enum
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code
   * @param {Array} [details] - Optional array of field-level error details
   */
  constructor(code, message, statusCode, details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // Distinguishes expected errors from programming bugs

    Error.captureStackTrace(this, this.constructor);
  }
}

// ═══════════════════════════════════════════════════════════════════
// Centralized Error Handler Middleware
// Must be registered AFTER all routes: app.use(errorHandler)
// ═══════════════════════════════════════════════════════════════════
function errorHandler(err, req, res, _next) {
  const correlationId = req.correlationId || 'unknown';
  const timestamp = new Date().toISOString();

  // Determine if this is a known/operational error
  if (err instanceof AppError) {
    // Operational error — log at WARN level
    logger.warn('Operational error', {
      correlationId,
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      path: req.originalUrl,
      method: req.method,
    });

    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details || undefined,
        traceId: correlationId,
        timestamp,
      },
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
      code: 'INVALID_FORMAT',
    }));

    logger.warn('Mongoose validation error', {
      correlationId,
      details,
      path: req.originalUrl,
    });

    return res.status(400).json({
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Validation failed',
        details,
        traceId: correlationId,
        timestamp,
      },
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'unknown';
    logger.warn('Duplicate key error', {
      correlationId,
      field,
      path: req.originalUrl,
    });

    return res.status(409).json({
      success: false,
      error: {
        code: ErrorCodes.DUPLICATE_ENTRY,
        message: `Duplicate value for field: ${field}`,
        traceId: correlationId,
        timestamp,
      },
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: ErrorCodes.TOKEN_INVALID,
        message: 'Invalid authentication token',
        traceId: correlationId,
        timestamp,
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: ErrorCodes.TOKEN_EXPIRED,
        message: 'Authentication token has expired',
        traceId: correlationId,
        timestamp,
      },
    });
  }

  // Unknown/programming error — log full details at ERROR level
  logger.error('Unhandled error', {
    correlationId,
    error: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  // Never expose internal error details to clients
  return res.status(500).json({
    success: false,
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: 'An unexpected error occurred. Please try again later.',
      traceId: correlationId,
      timestamp,
    },
  });
}

module.exports = { AppError, ErrorCodes, errorHandler };
