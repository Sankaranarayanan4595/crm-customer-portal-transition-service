const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config({ path: "config.env" });
const http = require("http");
const https = require("https");
const fs = require("fs");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { v4: uuidv4 } = require("uuid");
const app = express();
app.disable('x-powered-by'); // CWE-200: suppress tech-stack fingerprinting via X-Powered-By header
const db = require("./db");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const winston = require("winston");
const promClient = require('prom-client');
const setupSocket = require('./utils/socket');
const { AppError, errorHandler } = require('./shared/errors/AppError');
const logger = require('./shared/logger');

// Sprint 6: Activate console bridge to route legacy console.log through structured logger
const consoleBridge = require('./shared/console-bridge');
consoleBridge.activate();

require("winston-mongodb");
try {
  const PORT = process.env.PORT;
  const DOMAIN = process.env.DOMAIN;
  let server;

  if (process.env.NODE_ENV === "Dev" || process.env.NODE_ENV === "QA") {
    server = http.createServer(app);
  } else {
    const keyPath = path.resolve(process.env.SSL_KEY_PATH);
    const certPath = path.resolve(process.env.SSL_CER_PATH);
    const options = {
      key: fs.readFileSync(keyPath, "utf8"),
      cert: fs.readFileSync(certPath, "utf8"),
    };
    server = https.createServer(options, app);
  }

  // P0-FIX: Socket.IO CORS — use explicit origins from environment
  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:4200').split(',').map(o => o.trim());

  const io = require('socket.io')(server, {
    path: "/CRMService/socket.io/",
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket"],
  });


  setupSocket(io);

  // Make io available to routes
  app.use((req, res, next) => {
    req.io = io;
    next();
  });

  // ═══════════════════════════════════════════════════════════════════
  // P0 SECURITY HARDENING — Applied per Enterprise Architecture Review
  // ═══════════════════════════════════════════════════════════════════

  // P0-FIX: Apply Helmet for security headers (CSP, HSTS, X-Frame-Options, etc.)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", ...allowedOrigins],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow cross-origin resources for API
  }));

  // P0-FIX: Rate limiting — prevent DoS and brute-force attacks
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15-minute window
    max: 500, // Max 500 requests per window per IP
    standardHeaders: true, // Return rate limit info in RateLimit-* headers
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.',
      },
    },
  });
  app.use(globalLimiter);

  // P0-FIX: Stricter rate limit for auth-sensitive endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50, // Max 50 auth attempts per 15 min
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts, please try again later.',
      },
    },
  });

  // P0-FIX: Correlation ID middleware — trace requests across logs
  app.use((req, res, next) => {
    req.correlationId = req.headers['x-correlation-id'] || uuidv4();
    res.setHeader('x-correlation-id', req.correlationId);
    next();
  });

  // P0-FIX: Reduce body size limit from 300MB to 10MB to prevent memory exhaustion
  app.use(express.json({ limit: "10mb", extended: true }));
  app.use(express.urlencoded({ limit: "10mb", extended: true, parameterLimit: 10000 }));
  
  const { sanitizeKnownFields, handleValidationErrors } = require('./middlewares/validators');
  app.use(sanitizeKnownFields, handleValidationErrors);

  // P0-FIX: CORS — use explicit origin allowlist instead of wildcard '*'
  const corsOptions = {
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn('CORS request blocked', { origin, allowedOrigins });
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Correlation-ID',
      // Headers sent by BBAuthInterceptor (frontend)
      'x-access-token',
      'access-token',
      'x-access-key',
      'session-id',
      'x-user-id',
      'x-comp-id',
      'ACCESS-KEY',
      'shared-link',
      'ip-address',
      'is-from',
      'isappwisecompany',
      'x-client',
    ],
  };
  app.use(cors(corsOptions));

  // P0-FIX: REMOVED — process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
  // This was globally disabling SSL certificate verification for ALL outgoing
  // HTTPS requests (Stripe, SendGrid, SharePoint, etc.), enabling MITM attacks.
  // If specific legacy services require TLS bypass, configure per-request agents instead.
  // Routes

  const register = new promClient.Registry();

  promClient.collectDefaultMetrics({ register });

  const httpRequestDuration = new promClient.Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status_code"],
  });

  const httpRequestCounter = new promClient.Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status_code"],
  });

  register.registerMetric(httpRequestDuration);
  register.registerMetric(httpRequestCounter);

  // ═══════════════════════════════════════════════════════════════════
  // Health & Readiness Probes (Sprint 2 enhanced)
  // ═══════════════════════════════════════════════════════════════════

  // Liveness probe — is the process alive?
  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "UP",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    });
  });

  // Readiness probe — is the service ready to accept traffic?
  app.get("/readiness", async (req, res) => {
    try {
      const dbState = db.getConnectionState();
      const isReady = dbState.isConnected;

      res.status(isReady ? 200 : 503).json({
        status: isReady ? "READY" : "NOT_READY",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
          database: {
            status: dbState.isConnected ? "CONNECTED" : "DISCONNECTED",
            lastConnectedAt: dbState.lastConnectedAt,
            lastError: dbState.lastError,
          },
          memory: {
            heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            heapTotalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
          },
        },
      });
    } catch (error) {
      res.status(503).json({
        status: "NOT_READY",
        error: error.message,
      });
    }
  });

  app.use((req, res, next) => {
    const end = httpRequestDuration.startTimer();
    res.on('finish', () => {
      httpRequestCounter.inc({
        method: req.method,
        route: req.route ? req.route.path : req.url,
        status_code: res.statusCode,
      });
      end({
        method: req.method,
        route: req.route ? req.route.path : req.url,
        status_code: res.statusCode,
      });
    });
    next();
  });
  // P0-FIX: Protect metrics endpoint — only allow internal/authenticated access
  const isAuth = require('./middlewares/authendicateSession');
  app.get('/CRMService/metrics', isAuth.getSessionUser, async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  // Sprint 6: Status code corrector — fixes legacy 201-for-errors before response
  const statusCodeCorrector = require('./shared/middleware/statusCodeCorrector');
  app.use(statusCodeCorrector);

  // Sprint 6: Versioned API routes (/api/v1/crm/*) + legacy (/CRMService/*)
  const { mountVersionedRoutes, buildRouteTable } = require('./routes/apiVersionRouter');
  mountVersionedRoutes(app, buildRouteTable());

  // P0-FIX: Removed duplicate /health endpoints. Single /health at L86 is sufficient.
  // Added /CRMService/health as alias for Kubernetes/PM2 probes.
  app.get("/CRMService/health", (req, res) => {
    const dbState = db?.connection?.readyState;
    res.status(200).json({
      status: "UP",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      database: dbState === 1 ? "CONNECTED" : "DISCONNECTED",
    });
  });


  // P1-FIX: Centralized error handler middleware (must be registered AFTER all routes)
  app.use(errorHandler);

  db.connect()
    .then(() => {
      server.listen(PORT, DOMAIN, () => {
        logger.info('CRM Service started', { port: PORT, domain: DOMAIN, env: process.env.NODE_ENV });
      });
    })
    .catch((error) => {
      logger.error('Database connection error', { error: error.message, stack: error.stack });
      process.exit(1);
    });
} catch (error) {
  // Use console.error here since logger may not be initialized yet
  console.error("Fatal initialization error:", error.message);
  console.error(error.stack);
  process.exit(1);
}

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION — Shutting down', {
    error: err.name,
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION — Shutting down', {
    error: err?.name || 'UnhandledRejection',
    message: err?.message || String(err),
    stack: err?.stack,
  });
  process.exit(1);
});

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  // Stop accepting new connections
  if (global._server) {
    global._server.close(() => {
      logger.info('HTTP server closed');
      mongoose.connection.close(false, () => {
        logger.info('MongoDB connection closed');
        process.exit(0);
      });
    });
    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after 30s timeout');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

