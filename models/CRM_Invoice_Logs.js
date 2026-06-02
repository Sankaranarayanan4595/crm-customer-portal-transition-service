const mongoose = require('mongoose');

const CRMInvoiceLogSchema = new mongoose.Schema({
    oInvoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "crm_invoices_histories",
        // required: true
    },
    oDraftId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "crm_draft_invoices",
        // required: true
    },
    oSubClassId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "leads_subclasses",
        // required: true
    },
    oUserCompanyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "mast_company_informations",
        // required: true,
    },
    cActionPerformed: {
        type: mongoose.Schema.Types.ObjectId,
        // required: true,
        ref: "leads_master_statuses",
    },
    updatedData: {
        // type: Map,
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    originalData: {
        // type: Map,
        type: mongoose.Schema.Types.Mixed,
        required: false
    },
    updatedAt: {
        type: Date,
        default: Date.now,
        // immutable: true
    },
    slaLastUpdatedAt: {
        type: Date,
        // default: Date.now,
        // immutable: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "useradmin_mast_users",
        // required: true,
    },
    timeZone: {
        type: String,
    },
    reason: {
        type: String,
        // required: true
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "useradmin_mast_users",
        // required: true
    },
    currentLevel: [
        {
            level: {
                type: String,
            },
            cmpLevel: {
                type: String,
            },
            // product_id: {
            //     type: mongoose.Schema.Types.ObjectId,
            //     ref: "leads_productCategory_product_mapping"
            // },
            user_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "useradmin_mast_users"
            },
            isApproved: {
                type: Boolean,
                default: false
            },
            isRejected: {
                type: Boolean,
                default: false
            },
            isCurrentLevel: {
                type: Boolean,
                default: false
            },
            isApproveReqMailSent: {
                type: Boolean,
                default: false
            },
        }
    ],
    bIsCompanyBased: {
        type: Boolean,
        default: false
    },
    // bIsProductBased: {
    //     type: Boolean,
    //     default: false
    // },
    bAllMustApprove: {
        type: Boolean,
        default: false
    },
    log_name: {
        type: String,
        // required: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    bActive: {
        type: Boolean,
        default: false
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    SLA:
    {
        iCount: {
            type: Number,
            default: 0
        },
        iSelectedTimeUnit: {
            type: String,
        },
    },
    isSLAMailTriggered: {
        type: Boolean,
        default: false
    },
    isRead: {
        type: Boolean,
        default: false
    },
    approvalId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    companyLevelApprovalId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    isLastLevelApprover: {
        type: Boolean,
        default: false
    },
    levelIndex: {
        type: Number,
        default: 0
    },
    skippedLevel :  {
        type: mongoose.Schema.Types.Mixed,
    },
    finalApprovers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "useradmin_mast_users"
        }
    ],
});

const CRMInvoiceLogs = mongoose.model('crm_invoice_logs', CRMInvoiceLogSchema);

module.exports = CRMInvoiceLogs;
