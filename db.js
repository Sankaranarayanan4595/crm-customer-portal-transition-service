const mongoose = require("mongoose");
const logger = require('./shared/logger');

// ═══════════════════════════════════════════════════════════════════
// Sprint 2: Database Connection Hardening
// ═══════════════════════════════════════════════════════════════════

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000; // 3 seconds, doubles each retry

/**
 * Connection state tracker for health/readiness probes.
 * Exported so health endpoints can check without re-querying mongoose.
 */
const connectionState = {
  isConnected: false,
  lastConnectedAt: null,
  lastError: null,
  retryCount: 0,
};

/**
 * MongoDB connection options — tuned for production workloads.
 * See: https://mongoosejs.com/docs/connections.html#options
 */
const connectionOptions = {
  // Connection Pool
  maxPoolSize: 20,              // Max connections in pool (default: 5)
  minPoolSize: 5,               // Min connections maintained warm
  maxIdleTimeMs: 30000,         // Close idle connections after 30s

  // Timeouts
  connectTimeoutMS: 30000,      // Initial connection: 30s (was: 600000 = 10 min!)
  serverSelectionTimeoutMS: 15000, // Server selection: 15s
  socketTimeoutMS: 45000,       // Socket inactivity: 45s
  heartbeatFrequencyMS: 10000,  // Check server health every 10s

  // Write Concerns
  retryWrites: true,
  retryReads: true,
};

/**
 * Delay helper for retry logic with exponential backoff.
 * @param {number} ms - Base delay in milliseconds
 * @param {number} attempt - Current retry attempt (0-indexed)
 * @returns {Promise<void>}
 */
function delay(ms, attempt) {
  const backoff = ms * Math.pow(2, attempt);
  const jitter = Math.random() * 1000; // Add random jitter to prevent thundering herd
  return new Promise(resolve => setTimeout(resolve, backoff + jitter));
}

/**
 * Connects to MongoDB with retry logic and exponential backoff.
 * Fails fast if connection string is missing.
 * @returns {Promise<mongoose.Connection>}
 */
module.exports.connect = async () => {
  const connectionString = process.env.MONGODB_CONNECTION_STRING || process.env.DB_CONNECTION;

  if (!connectionString) {
    const errorMsg = 'MONGODB_CONNECTION_STRING or DB_CONNECTION environment variable is required';
    logger.error(errorMsg, { context: 'db.connect' });
    throw new Error(errorMsg);
  }

  mongoose.set("strictQuery", false);

  // Register connection event listeners
  mongoose.connection.on("connected", () => {
    connectionState.isConnected = true;
    connectionState.lastConnectedAt = new Date().toISOString();
    connectionState.retryCount = 0;
    logger.info('MongoDB connected', {
      context: 'db',
      database: process.env.MONGODB_DATABASE_NAME || 'unknown',
      poolSize: connectionOptions.maxPoolSize,
    });
  });

  mongoose.connection.on("disconnected", () => {
    connectionState.isConnected = false;
    logger.warn('MongoDB disconnected', { context: 'db' });
  });

  mongoose.connection.on("error", (error) => {
    connectionState.lastError = error.message;
    logger.error('MongoDB connection error', {
      context: 'db',
      error: error.message,
    });
  });

  // Monitor slow queries in non-production
  if (process.env.NODE_ENV === 'Dev' || process.env.NODE_ENV === 'QA') {
    mongoose.set('debug', (collectionName, methodName, ...args) => {
      logger.debug('MongoDB query', {
        context: 'db.query',
        collection: collectionName,
        method: methodName,
      });
    });
  }

  // Retry loop with exponential backoff
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      connectionState.retryCount = attempt;
      await mongoose.connect(connectionString, connectionOptions);
      return mongoose.connection;
    } catch (error) {
      logger.error('MongoDB connection attempt failed', {
        context: 'db.connect',
        attempt: attempt + 1,
        maxRetries: MAX_RETRIES,
        error: error.message,
      });

      if (attempt < MAX_RETRIES - 1) {
        await delay(RETRY_DELAY_MS, attempt);
        logger.info('Retrying MongoDB connection...', {
          context: 'db.connect',
          attempt: attempt + 2,
        });
      } else {
        logger.error('All MongoDB connection attempts exhausted', {
          context: 'db.connect',
          totalAttempts: MAX_RETRIES,
        });
        throw error;
      }
    }
  }
};

/**
 * Returns current connection state for health/readiness probes.
 * @returns {{ isConnected: boolean, lastConnectedAt: string|null, lastError: string|null }}
 */
module.exports.getConnectionState = () => ({ ...connectionState });

/**
 * Mongoose connection reference for direct access.
 */
module.exports.connection = mongoose.connection;

