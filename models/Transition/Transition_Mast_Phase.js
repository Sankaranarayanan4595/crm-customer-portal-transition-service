const mongoose = require("mongoose");

const TransitionMastPhaseSchema = new mongoose.Schema({
  cPhaseName: {
    type: String,
    required: true,
  },
  cPhaseDescription: {
    type: String,
  },
  iSortOrder: {
    type: Number,
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
});

const TransitionMastPhases = mongoose.model(
  "Transition_Mast_Phases",
  TransitionMastPhaseSchema
);

module.exports = TransitionMastPhases;
