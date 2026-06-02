const mongoose = require("mongoose");

const TransitionCommentShema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
    },
    cComment: {
        type: String,
        required: true,
    },
    type: {
        type: String,
    },
    // oCompanyId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "mast_company_informations",
    //     required: true,
    // },
    // oCategory_Id: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     required: true,
    //     ref: "leads_categories",
    // },
    // oProductCategory_Product_Mapping_Id: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     required: true,
    //     ref: "leads_productcategory_product_mappings",
    // },
    oActivation_Id: {
        type: mongoose.Schema.Types.ObjectId,
        // required: true,
        ref: "leads_customer_product_details",
    },
    transitionId: {
        type: mongoose.Schema.Types.ObjectId,
        // required: true,
        ref: "transition_phase_template_value_mappings",
    },
    oTemplateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "template",
        required: false,
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
        default: false
    },
})


const TransitionComment = mongoose.model(
    "Transition_Mast_Comments",
    TransitionCommentShema
);

module.exports = TransitionComment;
