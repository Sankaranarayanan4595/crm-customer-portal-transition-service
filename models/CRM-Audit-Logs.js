const mongoose = require('mongoose');

const CRMAuditLogSchema = new mongoose.Schema(
    {
        category: {
            type: String,
            default: "CRM",
            required: true,
        },
        collectionName: {
            type: String,
            required: true,
        },
        documentId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "useradmin_mast_users"
        },
        userName: {
            type: String,
        },
        app_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "useradmin_application_infos"
        },
        appName: {
            type: String,
        },
        empId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "useradmin_mast_employees"
        },
        empName: {
            type: String,
        },
        cChanges: [{
            cFieldChanged: {
                type: String,
                required: true,
            },
            cOldValue: {
                type: String,
            },
            cNewValue: {
                type: String,
            },
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "useradmin_mast_users"
            },
            app_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "useradmin_application_infos"
            },
            empId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "useradmin_mast_employees"
            },
            description: {
                type: String,
                default: "",
            }
        }],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "useradmin_mast_users"
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "useradmin_mast_users"
        },
        deletedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "useradmin_mast_users"
        },
        updatedAt: {
            type: Date,
            default: Date.now
        },
        // Additional CRM-specific fields that might be needed
        oUserCompanyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "mast_company_informations",
            required: true,
        },
        reason: {
            type: String,
            required: true
        },
    },
    {
        versionKey: false,
        strict: true,
    }
);

const CRMAuditLogs = mongoose.model('useradmin_audit_logs', CRMAuditLogSchema);

module.exports = CRMAuditLogs;