/**
 * Validated Configuration Module
 * 
 * Sprint 2: Centralizes ALL environment variable access with Joi validation.
 * The service will FAIL FAST on startup if any required variable is missing
 * or malformed — no more silent undefined-variable bugs in production.
 * 
 * Usage:
 *   const config = require('./shared/config');
 *   const dbUri = config.db.connectionString;
 *   const jwtSecret = config.jwt.secret;
 * 
 * @module shared/config
 */

const Joi = require('joi');

// ═══════════════════════════════════════════════════════════════════
// Schema Definition — every env var the service uses
// ═══════════════════════════════════════════════════════════════════
const envSchema = Joi.object({
  // Server
  NODE_ENV: Joi.string().valid('Dev', 'QA', 'Staging', 'Production').default('Dev'),
  PORT: Joi.number().port().default(7001),
  DOMAIN: Joi.string().hostname().default('localhost'),

  // Database
  MONGODB_CONNECTION_STRING: Joi.string().optional(),
  DB_CONNECTION: Joi.string().optional(),
  MONGODB_DATABASE_NAME: Joi.string().optional().default('crm'),

  // JWT Security
  SECREAT_KEY: Joi.string().min(16).required()
    .messages({ 'string.min': 'JWT secret must be at least 16 characters for security' }),
  SECRET_KEY: Joi.string().optional(),
  ALGORITHAM: Joi.string().valid('HS256', 'HS384', 'HS512', 'RS256').default('HS256'),
  KEYID: Joi.string().optional(),
  JWT_EXPIRY: Joi.string().pattern(/^\d+[smhd]$/).default('15m')
    .messages({ 'string.pattern.base': 'JWT_EXPIRY must be like 15m, 1h, 7d' }),

  // CORS
  CORS_ALLOWED_ORIGINS: Joi.string().default('http://localhost:4200'),

  // SSL (production)
  SSL_KEY_PATH: Joi.string().optional(),
  SSL_CER_PATH: Joi.string().optional(),

  // SendGrid
  SENDGRID_API_KEY: Joi.string().optional(),
  SENDGRID_SENDER_EMAIL: Joi.string().email().optional(),
  SENDGRID_SENDER_NAME: Joi.string().optional(),

  // SharePoint
  SHAREPOINT_TENANT_ID: Joi.string().optional(),
  SHAREPOINT_CLIENT_ID: Joi.string().optional(),
  SHAREPOINT_CLIENT_SECRET: Joi.string().optional(),
  SHAREPOINT_SITE_ID: Joi.string().optional(),
  SHAREPOINT_DRIVE_ID: Joi.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: Joi.string().optional(),
  STRIPE_PUBLISHABLE_KEY: Joi.string().optional(),

  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),

  // Internal Services
  AUTH_SERVICE_URL: Joi.string().optional(),
  USER_ADMIN_SERVICE_URL: Joi.string().optional(),
}).unknown(true); // Allow other env vars we don't validate

// ═══════════════════════════════════════════════════════════════════
// Validate on module load — fail fast
// ═══════════════════════════════════════════════════════════════════
const { error, value: validatedEnv } = envSchema.validate(process.env, {
  abortEarly: false,       // Report ALL errors, not just the first
  stripUnknown: false,     // Keep unknown vars (other services may need them)
  allowUnknown: true,
});

if (error) {
  const errorDetails = error.details.map(d => `  - ${d.message}`).join('\n');
  console.error(`\n╔════════════════════════════════════════════════════════╗`);
  console.error(`║  CONFIGURATION VALIDATION FAILED — Service cannot start ║`);
  console.error(`╚════════════════════════════════════════════════════════╝\n`);
  console.error(`The following environment variables are invalid:\n${errorDetails}\n`);
  console.error(`Fix these in your config.env file and restart.\n`);
  // In development, warn but don't crash (allow partial startup for debugging)
  if (process.env.NODE_ENV !== 'Dev') {
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════════
// Structured Config Object — typed, validated, documented
// ═══════════════════════════════════════════════════════════════════
const config = {
  server: {
    env: validatedEnv.NODE_ENV,
    port: validatedEnv.PORT,
    domain: validatedEnv.DOMAIN,
    isDev: validatedEnv.NODE_ENV === 'Dev',
    isQA: validatedEnv.NODE_ENV === 'QA',
    isProd: validatedEnv.NODE_ENV === 'Production',
  },

  db: {
    connectionString: validatedEnv.MONGODB_CONNECTION_STRING || validatedEnv.DB_CONNECTION,
    databaseName: validatedEnv.MONGODB_DATABASE_NAME,
  },

  jwt: {
    secret: validatedEnv.SECREAT_KEY,
    algorithm: validatedEnv.ALGORITHAM,
    keyId: validatedEnv.KEYID,
    expiry: validatedEnv.JWT_EXPIRY,
  },

  cors: {
    allowedOrigins: (validatedEnv.CORS_ALLOWED_ORIGINS || '')
      .split(',')
      .map(o => o.trim())
      .filter(Boolean),
  },

  ssl: {
    keyPath: validatedEnv.SSL_KEY_PATH,
    certPath: validatedEnv.SSL_CER_PATH,
  },

  sendgrid: {
    apiKey: validatedEnv.SENDGRID_API_KEY,
    senderEmail: validatedEnv.SENDGRID_SENDER_EMAIL,
    senderName: validatedEnv.SENDGRID_SENDER_NAME,
  },

  sharepoint: {
    tenantId: validatedEnv.SHAREPOINT_TENANT_ID,
    clientId: validatedEnv.SHAREPOINT_CLIENT_ID,
    clientSecret: validatedEnv.SHAREPOINT_CLIENT_SECRET,
    siteId: validatedEnv.SHAREPOINT_SITE_ID,
    driveId: validatedEnv.SHAREPOINT_DRIVE_ID,
  },

  stripe: {
    secretKey: validatedEnv.STRIPE_SECRET_KEY,
    publishableKey: validatedEnv.STRIPE_PUBLISHABLE_KEY,
  },

  logging: {
    level: validatedEnv.LOG_LEVEL,
  },

  services: {
    authUrl: validatedEnv.AUTH_SERVICE_URL,
    userAdminUrl: validatedEnv.USER_ADMIN_SERVICE_URL,
  },
};

// Validate that at least one DB connection string exists
if (!config.db.connectionString) {
  console.error('FATAL: Neither MONGODB_CONNECTION_STRING nor DB_CONNECTION is set.');
  if (!config.server.isDev) {
    process.exit(1);
  }
}

module.exports = config;
