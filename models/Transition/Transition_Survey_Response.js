const mongoose = require("mongoose");

const SurveyResponseSchema = new mongoose.Schema(
  {
    surveyMappingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CSATValueMappings",
      required: true,
    },
    activationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    recipientEmail: {
      type: String,
      required: true,
    },
    responses: {
      type: Object,
      required: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // optional: track user
    },
  },
  { timestamps: true }
);

const TransitionSurveyResponse = mongoose.model(
  "transition_survey_response",
  SurveyResponseSchema
);

module.exports = TransitionSurveyResponse;
