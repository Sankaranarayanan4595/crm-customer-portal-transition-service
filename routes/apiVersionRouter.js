/**
 * API Versioning Router — Centralizes route versioning.
 *
 * Sprint 6: Adds /api/v1/ prefix to all routes while maintaining
 * backward compatibility with existing /CRMService/ paths.
 *
 * Strategy:
 *   - NEW routes use /api/v1/crm/* prefix
 *   - LEGACY routes remain at /CRMService/* (backward compatible)
 *   - Both mount the same route files
 *   - Legacy routes can be deprecated after frontend migration
 *
 * @module routes/apiVersionRouter
 */

const express = require('express');
const logger = require('../shared/logger');

const API_V1_PREFIX = '/api/v1/crm';
const LEGACY_PREFIX = '/CRMTransitionService';

/**
 * Create a versioned API router that mounts routes under both
 * the new versioned prefix and the legacy prefix.
 *
 * @param {express.Application} app - Express application
 * @param {Array<{path: string, router: express.Router}>} routes - Route definitions
 */
function mountVersionedRoutes(app, routes) {
  for (const { path: routePath, router } of routes) {
    // New versioned path
    const versionedPath = `${API_V1_PREFIX}/${routePath}`;
    app.use(versionedPath, router);

    // Legacy path (backward compatible)
    const legacyPath = `${LEGACY_PREFIX}/${routePath}`;
    app.use(legacyPath, router);

    logger.info('Route mounted', {
      context: 'apiVersionRouter',
      versioned: versionedPath,
      legacy: legacyPath,
    });
  }

  // Deprecation warning header for legacy routes
  app.use(LEGACY_PREFIX, (req, res, next) => {
    res.set('Deprecation', 'true');
    res.set('Sunset', 'Thu, 01 Jan 2027 00:00:00 GMT');
    res.set('Link', `<${API_V1_PREFIX}${req.path}>; rel="successor-version"`);
    next();
  });
}

/**
 * Build the route table from existing route files.
 * @returns {Array<{path: string, router: express.Router}>}
 */
function buildRouteTable() {
  return [
    { path: 'transition', router: require('./transitionRoutes') },
    { path: 'customerPortal', router: require('./customerPortalRoutes') },
  ];
}

module.exports = {
  mountVersionedRoutes,
  buildRouteTable,
  API_V1_PREFIX,
  LEGACY_PREFIX,
};
