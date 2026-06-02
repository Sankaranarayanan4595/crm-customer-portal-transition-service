const mongoose = require("mongoose");

const objectId = mongoose.Schema.Types.ObjectId;

const runningNumberSchema = new mongoose.Schema({
  iModuleLastNumber: {
    type: Number,
    required: true,
    integer: true,
  },
  dUpdatedAt: {
    type: Date,
    required: true,
  },
  bActive: {
    type: Boolean,
    required: true,
  },
});

const runningNumberSettingsSchema = new mongoose.Schema({
  cModuleName: {
    type: String,
    required: true,
    maxlength: 50
  },
  cPrefix: {
    type: String,
    maxlength: 8,
    default: "",
  },
  cSuffix: {
    type: String,
    maxlength: 8,
    default: "",
  },
  iNumberLength: {
    type: Number,
    required: true,
    default: 4,
  },
  bUseCurrentYear: {
    type: Boolean,
    default: false,
  },
  cResetFrequency: {
    type: String,
    enum: ["daily", "monthly", "yearly"],
    default: "yearly",
  },
  oCompanyId: {
    type: objectId,
    ref: "mast_company_informations",
    required: true,
  },
  dResetAt: {
    type: Date,
    default: Date.now,
  },
  runningNumbers: [runningNumberSchema],
});

const RunningNumberSetting = mongoose.model("running_number_settings", runningNumberSettingsSchema);

module.exports = RunningNumberSetting;

