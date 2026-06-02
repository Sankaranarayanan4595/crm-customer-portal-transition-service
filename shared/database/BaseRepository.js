/**
 * BaseRepository — Abstract data access layer with tenant scoping.
 *
 * Sprint 3: Provides standardized CRUD operations for all Mongoose models.
 * Every query is automatically scoped by tenantId (oUsercompanyId/oUserCompanyId)
 * unless explicitly opted out.
 *
 * Usage:
 *   class CompanyRepository extends BaseRepository {
 *     constructor() { super(CompanyModel, 'oUsercompanyId'); }
 *   }
 *
 * @module shared/database/BaseRepository
 */

const mongoose = require('mongoose');
const logger = require('../logger');
const { AppError, ErrorCodes } = require('../errors/AppError');

class BaseRepository {
  /**
   * @param {mongoose.Model} model - Mongoose model
   * @param {string} tenantField - Field name for tenant scoping (default: 'oUsercompanyId')
   */
  constructor(model, tenantField = 'oUsercompanyId') {
    if (!model) {
      throw new Error('BaseRepository requires a Mongoose model');
    }
    this.model = model;
    this.tenantField = tenantField;
    this.modelName = model.modelName || 'Unknown';
  }

  /**
   * Build tenant-scoped filter. Always injects tenantId unless explicitly skipped.
   * @param {Object} filter - Query filter
   * @param {string|null} tenantId - Tenant ID from JWT
   * @param {boolean} [skipTenant=false] - Skip tenant scoping (for system queries)
   * @returns {Object} Scoped filter
   */
  _scopeFilter(filter, tenantId, skipTenant = false) {
    if (skipTenant || !tenantId) return { ...filter };
    return {
      ...filter,
      [this.tenantField]: mongoose.Types.ObjectId(tenantId),
    };
  }

  /**
   * Find a single document by ID with tenant scoping.
   * @param {string} id - Document ID
   * @param {string} tenantId - Tenant ID
   * @param {Object} [options] - { select, populate, lean }
   * @returns {Promise<Object|null>}
   */
  async findById(id, tenantId, options = {}) {
    try {
      const filter = this._scopeFilter({ _id: mongoose.Types.ObjectId(id) }, tenantId);
      let query = this.model.findOne(filter);

      if (options.select) query = query.select(options.select);
      if (options.populate) query = query.populate(options.populate);
      if (options.lean !== false) query = query.lean();

      const doc = await query;
      if (!doc) {
        throw new AppError(
          ErrorCodes.RESOURCE_NOT_FOUND,
          `${this.modelName} not found with ID: ${id}`,
          404
        );
      }
      return doc;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`${this.modelName}.findById failed`, {
        context: `${this.modelName}Repository`,
        id,
        error: error.message,
      });
      throw new AppError(ErrorCodes.DATABASE_ERROR, error.message, 500);
    }
  }

  /**
   * Find multiple documents with pagination and tenant scoping.
   * @param {Object} filter - Query filter (tenant auto-injected)
   * @param {string} tenantId - Tenant ID
   * @param {Object} [options] - { page, limit, sort, select, populate, lean }
   * @returns {Promise<{ data: Array, pagination: Object }>}
   */
  async findAll(filter, tenantId, options = {}) {
    try {
      const { page = 1, limit = 50, sort = { createdAt: -1 }, select, populate } = options;
      const scopedFilter = this._scopeFilter(filter, tenantId);

      const [data, total] = await Promise.all([
        this.model
          .find(scopedFilter)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .select(select || '')
          .populate(populate || '')
          .lean(),
        this.model.countDocuments(scopedFilter),
      ]);

      return {
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`${this.modelName}.findAll failed`, {
        context: `${this.modelName}Repository`,
        error: error.message,
      });
      throw new AppError(ErrorCodes.DATABASE_ERROR, error.message, 500);
    }
  }

  /**
   * Execute an aggregation pipeline with tenant scoping injected as $match at the start.
   * @param {Array} pipeline - MongoDB aggregation pipeline
   * @param {string} tenantId - Tenant ID
   * @param {boolean} [injectTenant=true] - Whether to inject tenant $match
   * @returns {Promise<Array>}
   */
  async aggregate(pipeline, tenantId, injectTenant = true) {
    try {
      const fullPipeline = [...pipeline];
      if (injectTenant && tenantId) {
        // Inject tenant filter as the first $match stage for index utilization
        const tenantMatch = { $match: { [this.tenantField]: mongoose.Types.ObjectId(tenantId) } };

        // If the first stage is already a $match, merge; otherwise prepend
        if (fullPipeline.length > 0 && fullPipeline[0].$match) {
          fullPipeline[0].$match[this.tenantField] = mongoose.Types.ObjectId(tenantId);
        } else {
          fullPipeline.unshift(tenantMatch);
        }
      }
      return await this.model.aggregate(fullPipeline);
    } catch (error) {
      logger.error(`${this.modelName}.aggregate failed`, {
        context: `${this.modelName}Repository`,
        pipelineLength: pipeline.length,
        error: error.message,
      });
      throw new AppError(ErrorCodes.DATABASE_ERROR, error.message, 500);
    }
  }

  /**
   * Create a new document with audit metadata.
   * @param {Object} data - Document data
   * @param {string} tenantId - Tenant ID
   * @param {string} userId - Creating user's ID
   * @returns {Promise<Object>}
   */
  async create(data, tenantId, userId) {
    try {
      const cleanData = { ...data };
      if (!cleanData._id) delete cleanData._id;

      const doc = new this.model({
        ...cleanData,
        cCreatedBy: userId ? mongoose.Types.ObjectId(userId) : undefined,
        dCreatedAt: new Date(),
      });
      if (tenantId) {
        doc[this.tenantField] = mongoose.Types.ObjectId(tenantId);
      }
      const saved = await doc.save();
      logger.info(`${this.modelName} created`, {
        context: `${this.modelName}Repository`,
        documentId: saved._id ? saved._id.toString() : null,
      });
      return saved.toObject();
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyValue || {})[0] || 'unknown';
        throw new AppError(ErrorCodes.DUPLICATE_ENTRY, `Duplicate value for field: ${field}`, 409);
      }
      logger.error(`${this.modelName}.create failed`, {
        context: `${this.modelName}Repository`,
        error: error.message,
      });
      throw new AppError(ErrorCodes.DATABASE_ERROR, error.message, 500);
    }
  }

  /**
   * Update a document by ID with tenant scoping.
   * @param {string} id - Document ID
   * @param {Object} updates - Fields to update
   * @param {string} tenantId - Tenant ID
   * @param {string} userId - Updating user's ID
   * @returns {Promise<Object>}
   */
  async updateById(id, updates, tenantId, userId) {
    try {
      const filter = this._scopeFilter({ _id: mongoose.Types.ObjectId(id) }, tenantId);
      const updateData = {
        ...updates,
        cUpdatedBy: userId ? mongoose.Types.ObjectId(userId) : undefined,
        dUpdatedAt: new Date(),
      };

      const doc = await this.model.findOneAndUpdate(filter, updateData, {
        new: true,
        runValidators: true,
      }).lean();

      if (!doc) {
        throw new AppError(
          ErrorCodes.RESOURCE_NOT_FOUND,
          `${this.modelName} not found with ID: ${id}`,
          404
        );
      }

      logger.info(`${this.modelName} updated`, {
        context: `${this.modelName}Repository`,
        documentId: id,
      });
      return doc;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`${this.modelName}.updateById failed`, {
        context: `${this.modelName}Repository`,
        id,
        error: error.message,
      });
      throw new AppError(ErrorCodes.DATABASE_ERROR, error.message, 500);
    }
  }

  /**
   * Soft delete a document (set active: false).
   * @param {string} id - Document ID
   * @param {string} tenantId - Tenant ID
   * @param {string} userId - Deleting user's ID
   * @returns {Promise<Object>}
   */
  async softDelete(id, tenantId, userId) {
    return this.updateById(id, { active: false, bActive: false }, tenantId, userId);
  }

  /**
   * Hard delete a document. Use with caution.
   * @param {string} id - Document ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<boolean>}
   */
  async hardDelete(id, tenantId) {
    try {
      const filter = this._scopeFilter({ _id: mongoose.Types.ObjectId(id) }, tenantId);
      const result = await this.model.deleteOne(filter);

      if (result.deletedCount === 0) {
        throw new AppError(
          ErrorCodes.RESOURCE_NOT_FOUND,
          `${this.modelName} not found with ID: ${id}`,
          404
        );
      }

      logger.info(`${this.modelName} hard deleted`, {
        context: `${this.modelName}Repository`,
        documentId: id,
      });
      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`${this.modelName}.hardDelete failed`, {
        context: `${this.modelName}Repository`,
        id,
        error: error.message,
      });
      throw new AppError(ErrorCodes.DATABASE_ERROR, error.message, 500);
    }
  }

  /**
   * Count documents with tenant scoping.
   * @param {Object} filter - Query filter
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<number>}
   */
  async count(filter, tenantId) {
    const scopedFilter = this._scopeFilter(filter, tenantId);
    return this.model.countDocuments(scopedFilter);
  }

  /**
   * Find one document matching filter, with tenant scoping.
   * @param {Object} filter - Query filter
   * @param {string} tenantId - Tenant ID
   * @param {Object} [options] - { select, populate, lean }
   * @returns {Promise<Object|null>}
   */
  async findOne(filter, tenantId, options = {}) {
    try {
      const scopedFilter = this._scopeFilter(filter, tenantId);
      let query = this.model.findOne(scopedFilter);

      if (options.select) query = query.select(options.select);
      if (options.populate) query = query.populate(options.populate);
      if (options.lean !== false) query = query.lean();

      return await query;
    } catch (error) {
      logger.error(`${this.modelName}.findOne failed`, {
        context: `${this.modelName}Repository`,
        error: error.message,
      });
      throw new AppError(ErrorCodes.DATABASE_ERROR, error.message, 500);
    }
  }
}

module.exports = BaseRepository;
