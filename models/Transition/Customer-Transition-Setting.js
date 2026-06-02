const mongoose = require("mongoose");

const CustomerTransitionSettingSchema = new mongoose.Schema({
    type: { type: String },
    transitonIds: [{
        type: mongoose.Schema.Types.ObjectId,
    }],
    cUserRoles: [
        {
            role: {
                type: String,
                required: true,
            },
            users: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "useradmin_mast_users",
                    required: true,
                }
            ]
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

const CustomerTransitionSetting = mongoose.model(
    "customer_transition_configurations",
    CustomerTransitionSettingSchema
);

module.exports = CustomerTransitionSetting;
