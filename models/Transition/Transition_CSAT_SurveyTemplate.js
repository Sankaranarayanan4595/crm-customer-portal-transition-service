const mongoose = require("mongoose");
const { Schema } = mongoose;

const MastSurveySchema = new Schema({
  cSurveyName: {
    type: String,
    required: true,
  },
  oTemplateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "form_templates",
    required: true,
  },
  transitionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "transition_phase_template_value_mappings",
    required: true,
  },
  oTask_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "transition_tasks"
  },
  oActivation_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "leads_customer_product_details",
    // required: true,
  },
  subClassId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "leads_subclasses",
    // required: true,
  },
  publish: {
    type: Boolean,
    default: false,
  },
  iSurveyOrder: {
    type: Number,
    required: true,
  },
  dCreatedAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },

  cCreatedBy: {
    type: mongoose.Schema.Types.ObjectId,
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
    default: false,
  },
});

const MastCSATSurveyTemplates = mongoose.model(
  "survey_templates",
  MastSurveySchema
);

module.exports = MastCSATSurveyTemplates;
