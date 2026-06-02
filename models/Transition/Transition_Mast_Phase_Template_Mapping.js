const mongoose = require("mongoose");
const { Schema } = mongoose;

const PhaseTemplateMasterSchema = new Schema({
  cGroupName: {
    type: String,
    required: true,
  },
  cDescription: {
    type: String,
    required: true,
  },
  transitionDetails: [
    {
      iSortOrder: {
        type: Number,
        required: true,
      },
      oTemplateId: {
        type: Schema.Types.ObjectId,
        ref: "form_templates",
        required: true,
      },
      cTemplateName: {
        type: String,
      },
      oPhaseId: {
        type: Schema.Types.ObjectId,
        ref: "Transition_Mast_Phases",
        required: true,
      },
      cPhaseName: {
        type: String,
      },
    },
  ],
  dCreatedAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  cCreatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "useradmin_mast_users",
  },
  bActive: {
    type: Boolean,
    default: false,
  },
});

const PhaseTemplateMasterMappings = mongoose.model(
  "Phase_Template_Master_Mappings",
  PhaseTemplateMasterSchema
);

module.exports = PhaseTemplateMasterMappings;
