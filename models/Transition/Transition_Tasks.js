const mongoose = require("mongoose");

const TransitionTaskSchema = new mongoose.Schema({
  cTaskName: {
    type: String,
    required: true,
  },
  cTaskDescription: {
    type: String,
  },
  oTaskStatus: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "leads_master_statuses",
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

const TransitionTasks = mongoose.model(
  "transition_tasks",
  TransitionTaskSchema
);

module.exports = TransitionTasks;
