const { body, query, validationResult } = require('express-validator');

/**
 * Global validation chains for fields commonly flagged for CWE-1287 
 * (Improper Type Validation) by static analysis tools.
 */
const sanitizeKnownFields = [
    // Query string validations
    query('bActive').optional().isString().withMessage('bActive must be a string'),
    query('industryId').optional().isString().withMessage('industryId must be a string'),
    query('comId').optional().isString().withMessage('comId must be a string'),
    query('search').optional().isString().withMessage('search must be a string'),

    // Body validations - Arrays
    body('subscriptionData').optional().isArray().withMessage('subscriptionData must be an array'),
    body('pendingLogs').optional().isArray().withMessage('pendingLogs must be an array'),
    body('fteData').optional().isArray().withMessage('fteData must be an array'),
    body('oUserID').optional().isArray().withMessage('oUserID must be an array'),
    body('productId').optional().isArray().withMessage('productId must be an array'),
    body('subClassIds').optional().isArray().withMessage('subClassIds must be an array'),
    body('billingItems').optional().isArray().withMessage('billingItems must be an array'),
    body('subDetails').optional().isArray().withMessage('subDetails must be an array'),
    body('stageChangeLogs').optional().isArray().withMessage('stageChangeLogs must be an array'),
    body('statusChangeLogs').optional().isArray().withMessage('statusChangeLogs must be an array'),

    // Body validations - Strings
    body('cEmail').optional().isString().withMessage('cEmail must be a string'),
    body('cActivity').optional().isString().withMessage('cActivity must be a string'),
    body('cTaskName').optional().isString().withMessage('cTaskName must be a string'),
    body('cName').optional().isString().withMessage('cName must be a string'),
    body('cAccountClassificationName').optional().isString().withMessage('cAccountClassificationName must be a string'),
    body('glAccountCode').optional().isString().withMessage('glAccountCode must be a string'),
    body('cRegionName').optional().isString().withMessage('cRegionName must be a string'),
    body('cRoleName').optional().isString().withMessage('cRoleName must be a string'),
    body('cEscalationAmount').optional({ nullable: true }).custom(val => typeof val === 'string' || typeof val === 'number').withMessage('cEscalationAmount must be a string or number'),
    body('cEscalationPercentage').optional({ nullable: true }).custom(val => typeof val === 'string' || typeof val === 'number').withMessage('cEscalationPercentage must be a string or number')
];

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false, 
            message: "Invalid request payload types. " + errors.array().map(e => e.msg).join(', '),
            errors: errors.array() 
        });
    }
    next();
};

module.exports = {
    sanitizeKnownFields,
    handleValidationErrors
};
