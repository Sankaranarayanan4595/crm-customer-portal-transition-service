const mongoose = require("mongoose");

const TransitionMastActionOwnerSchema = new mongoose.Schema({
    cActionOwner: {
        type: String,
        required: true,
    },
    dCreatedAt: {
        type: Date,
        default: Date.now,
        immutable: true,
    },
    cCreatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "useradmin_mast_users",
    },
    dUpdatedAt: {
        type: Date,
        default: Date.now,
    },
    cUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        // required: true,
        ref: "useradmin_mast_users",
    },
    oUserCompanyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "mast_company_informations",
        required: true,
    },
    bActive: {
        type: Boolean,
        default: true
    },
});

const TransitionMastActionOwner = mongoose.model(
    "transition_action_owner",
    TransitionMastActionOwnerSchema
);

module.exports = TransitionMastActionOwner;
