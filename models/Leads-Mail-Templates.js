const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const LeadsMailTemplatesSchema = new Schema({
  cTemplateName: {
    type: String,
    default: null,
  },
  cSubject: {
    type: String,
  },
  cBody: {
    type: String,
  },
  dCreatedAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  dLastModifiedAt: {
    type: Date,
    default: Date.now,
  },
  bActive: {
    type: Boolean,
    default: true,
  },
  cCC: [
    {
      type: String,
    },
  ],
  cBCC: [
    {
      type: String,
    },
  ],
  oUsercompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mast_company_informations",
      required: true,
    },
  cCreatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "useradmin_mast_users",
  },
});

const LeadsMailTemplates = mongoose.model("leads_mail_templates", LeadsMailTemplatesSchema);
module.exports = LeadsMailTemplates;
