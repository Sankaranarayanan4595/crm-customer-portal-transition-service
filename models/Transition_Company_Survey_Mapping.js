const mongoose = require("mongoose");
const { Schema } = mongoose;

const CSATValueMappingSchema = new Schema({
  oCompanyId: {
    type: Schema.Types.ObjectId,
    ref: "mast_company_informations",
  },
  transitionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transition_Phase_Template_Value_Mappings",
  },
  SurveyDetails: [
    {
      oTemplateId: {
        type: Schema.Types.ObjectId,
        ref: "form_templates",
        required: true,
      },
      cSurveyName: {
        type: String,
        required: true,
      },
      cSurveyTemplateId: {
        type: Schema.Types.ObjectId,
        ref: "survey_templates",
      },
    },
  ],
  recipients_response: [
    {
      email: {
        type: String,
        required: true,
      },
      isSubmitted: {
        type: Boolean,
        default: false,
      },
      response: {
        type: Schema.Types.Mixed,
        default: null,
      },
      cSurveyTemplateId: {
        type: Schema.Types.ObjectId,
        ref: "survey_templates",
      },
      csatScore: { type: Number },
      surveyStartTime: { type: Date },
      surveyEndTime: { type: Date },
    },
  ],
  overAllCSATScore: { type: Number },
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
  isMailsent: {
    type: Boolean,
    default: false,
  },
});

const CSATValueMappings = mongoose.model(
  "Transition_Company_Survey_Mappings",
  CSATValueMappingSchema
);

module.exports = CSATValueMappings;
