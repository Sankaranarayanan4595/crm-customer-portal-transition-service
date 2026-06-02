/**
 * Console Logger Bridge — Drop-in replacement for console.log in legacy controllers.
 *
 * Sprint 6: Instead of touching 1,707 console.log/error/warn calls across
 * 20 legacy controller files (which risks breaking production), we intercept
 * console methods globally and route them through the structured logger.
 *
 * This approach:
 *   1. Zero code changes in legacy controllers
 *   2. Immediate structured logging for all existing output
 *   3. Captures context (caller file, line number) automatically
 *   4. Safe to enable/disable via environment variable
 *
 * Usage: require('./shared/console-bridge') in main.js (before controllers load)
 *
 * @module shared/console-bridge
 */

const logger = require('./logger');

// Store original console methods for fallback
const originalConsole = {
  log: console.log.bind(console),
  error: console.error.bind(console),
  warn: console.warn.bind(console),
  info: console.info.bind(console),
  debug: console.debug.bind(console),
};

/**
 * Extract caller context from stack trace.
 * @returns {{ file: string, line: number }}
 */
function getCallerContext() {
  const err = new Error();
  const stack = err.stack || '';
  // Skip: Error, getCallerContext, console.X override, actual caller
  const lines = stack.split('\n');
  const callerLine = lines[3] || lines[2] || '';

  // Extract filename and line from stack frame
  const match = callerLine.match(/([^/\\]+\.js):(\d+):\d+/);
  if (match) {
    return { file: match[1], line: parseInt(match[2], 10) };
  }
  return { file: 'unknown', line: 0 };
}

/**
 * Format arguments into a single message string.
 * @param {Array} args
 * @returns {string}
 */
function formatArgs(args) {
  return args
    .map(arg => {
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(' ');
}

/**
 * Activate the console bridge.
 * Only activates when CONSOLE_BRIDGE_ENABLED=true (default: true).
 */
function activate() {
  const enabled = process.env.CONSOLE_BRIDGE_ENABLED !== 'false';
  if (!enabled) {
    logger.info('Console bridge disabled via CONSOLE_BRIDGE_ENABLED=false', {
      context: 'console-bridge',
    });
    return;
  }

  // console.log → logger.info (legacy controllers use this for general output)
  console.log = function (...args) {
    const ctx = getCallerContext();
    logger.info(formatArgs(args), {
      context: `legacy:${ctx.file}`,
      line: ctx.line,
      source: 'console.log',
    });
  };

  // console.error → logger.error
  console.error = function (...args) {
    const ctx = getCallerContext();
    logger.error(formatArgs(args), {
      context: `legacy:${ctx.file}`,
      line: ctx.line,
      source: 'console.error',
    });
  };

  // console.warn → logger.warn
  console.warn = function (...args) {
    const ctx = getCallerContext();
    logger.warn(formatArgs(args), {
      context: `legacy:${ctx.file}`,
      line: ctx.line,
      source: 'console.warn',
    });
  };

  // console.info → logger.info
  console.info = function (...args) {
    const ctx = getCallerContext();
    logger.info(formatArgs(args), {
      context: `legacy:${ctx.file}`,
      line: ctx.line,
      source: 'console.info',
    });
  };

  // console.debug → logger.debug
  console.debug = function (...args) {
    const ctx = getCallerContext();
    logger.debug(formatArgs(args), {
      context: `legacy:${ctx.file}`,
      line: ctx.line,
      source: 'console.debug',
    });
  };

  logger.info('Console bridge activated — all console.log/error/warn routed through structured logger', {
    context: 'console-bridge',
    legacyConsoleStatements: 1707,
  });
}

module.exports = { activate, originalConsole };
