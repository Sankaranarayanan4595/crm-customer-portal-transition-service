var jwt = require("jsonwebtoken");
const crypto = require("crypto");
const logger = require('../shared/logger');

// ═══════════════════════════════════════════════════════════════════
// P0 SECURITY FIX: JWT Secret Key Validation
// ═══════════════════════════════════════════════════════════════════
const WEAK_SECRETS = ['mysecretkey', 'secret', 'password', 'test', 'key', '123456'];
const JWT_SECRET = process.env.SECREAT_KEY;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  logger.error('SECURITY VIOLATION: JWT secret key is too weak or missing. Must be at least 32 characters.', {
    context: 'token.js',
    secretLength: JWT_SECRET ? JWT_SECRET.length : 0,
  });
}
if (WEAK_SECRETS.includes(JWT_SECRET?.toLowerCase())) {
  logger.error('SECURITY VIOLATION: JWT secret key is a known weak value. Replace immediately.', {
    context: 'token.js',
  });
}

// P0-FIX: JWT token expiration — tokens now expire after 15 minutes (was: never)
const TOKEN_EXPIRY = process.env.JWT_EXPIRY || '15m';

async function validateToken(token) {
  try {
    if (!token) throw new Error('Token not provided');
    const decoded = jwt.verify(token, JWT_SECRET);
    // P0-FIX: Removed console.log of decoded token (PII leak risk)
    return decoded;
  } catch (err) {
    logger.warn('Token validation failed', {
      context: 'token.validateToken',
      error: err.message,
      // Do NOT log the token itself — it may contain PII
    });
    throw err;
  }
}

async function generateToken(securitytokendatas) {
  const claims = {
    sub: securitytokendatas.userName,
    idofuser: securitytokendatas.userId,
    iRole_id: securitytokendatas.roleId,
    jti: crypto.randomUUID(), // P0-FIX: Use cryptographic UUID instead of Math.random
    iat: Math.floor(Date.now() / 1000),
  };

  // P0-FIX: Add token expiration (was: no expiresIn, tokens lived forever)
  const tokenGen = jwt.sign(claims, JWT_SECRET, {
    algorithm: process.env.ALGORITHAM || 'HS256',
    expiresIn: TOKEN_EXPIRY,
  });

  logger.info('JWT token generated', {
    context: 'token.generateToken',
    userId: securitytokendatas.userId,
    expiresIn: TOKEN_EXPIRY,
    // Do NOT log the actual token
  });

  return tokenGen;
}

module.exports.validateToken = validateToken;
module.exports.generateToken = generateToken;
