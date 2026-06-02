const mongoose = require("mongoose");

const CRMApprovalSettingSchema = new mongoose.Schema({
    approvalType: { type: String },
    applyFor: { type: String },
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    opportunityId:
    {
        type: mongoose.Schema.Types.ObjectId,
    },
    subClassId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "leads_subclasses",
    },
    cUserLevels: [
        {
            level: {
                type: String,
                required: true,
            },
            users: [
                {
                    type: String,
                    required: true,
                }
            ],
            SLA: {
                iCount: {
                    type: Number,
                    default: 0,
                },
                iSelectedTimeUnit: {
                    type: String,
                    enum: ["Hours", "Days"],
                },
            },
        },
    ],
    dCreateAt: {
        type: Date,
        default: Date.now,
        immutable: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,

    },
    oCreatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "useradmin_mast_users",
    },
    oUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "useradmin_mast_users",
    },
    bActive: {
        type: Boolean,
        default: true,
    },
    oUserCompanyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "mast_company_informations",
        required: true,
    },
});

const CRMApprovalSetting = mongoose.model(
    "crm_approval_configurations",
    CRMApprovalSettingSchema
);

module.exports = CRMApprovalSetting;
