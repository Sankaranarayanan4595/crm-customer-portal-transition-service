/**
 * HTTP Status Code Corrections for Legacy Controllers.
 *
 * Sprint 6: Express middleware that fixes incorrect status codes
 * in legacy controller responses WITHOUT modifying the 48K+ lines
 * of controller code.
 *
 * Known issues in legacy code:
 *   - res.status(201).json({ success: false, ... }) — 201 used for errors
 *   - res.status(200) for created resources (should be 201)
 *
 * This middleware intercepts res.json() to correct obvious mismatches.
 *
 * @module shared/middleware/statusCodeCorrector
 */

const logger = require('../logger');

/**
 * Middleware that corrects clearly wrong HTTP status codes.
 *
 * Rule: If status is 2xx (success) but body contains success:false,
 * downgrade to 400 (client error) or 500 (server error based on message).
 */
function statusCodeCorrector(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = function (body) {
    // Only intercept when we have a body with success: false
    if (body && body.success === false && res.statusCode >= 200 && res.statusCode < 300) {
      const correctedCode = inferCorrectStatusCode(body, res.statusCode);

      if (correctedCode !== res.statusCode) {
        logger.debug('Status code corrected', {
          context: 'statusCodeCorrector',
          path: req.originalUrl,
          original: res.statusCode,
          corrected: correctedCode,
          message: body.message || body.error?.message,
        });

        res.status(correctedCode);
      }
    }

    return originalJson(body);
  };

  next();
}

/**
 * Infer correct status code from response body content.
 * @param {Object} body - Response body
 * @param {number} currentCode - Current status code
 * @returns {number} Corrected status code
 */
function inferCorrectStatusCode(body, currentCode) {
  const message = (body.message || body.error?.message || '').toLowerCase();

  // Authentication errors
  if (message.includes('unauthorized') || message.includes('token') || message.includes('session')) {
    return 401;
  }

  // Not found
  if (message.includes('not found') || message.includes('no record')) {
    return 404;
  }

  // Validation errors
  if (message.includes('required') || message.includes('invalid') || message.includes('validation')) {
    return 400;
  }

  // Duplicate
  if (message.includes('duplicate') || message.includes('already exists')) {
    return 409;
  }

  // Internal server error
  if (message.includes('internal server error') || message.includes('something went wrong')) {
    return 500;
  }

  // Generic fallback for success:false with 2xx
  return 400;
}

module.exports = statusCodeCorrector;
