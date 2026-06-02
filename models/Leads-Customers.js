const mongoose = require("mongoose");
const trackChangesPlugin = require("../Service/trackChangePulgin");


const phoneSchema = new mongoose.Schema({
  code: { type: String },
  cMobileNo: { type: String },
  country: { type: String },
  flag: { type: String }
});
const LeadsCustomerDetailsSchema = new mongoose.Schema({
  cSalutation: { type: String },
  cFirst_Name: { type: String },
  cLast_Name: { type: String },
  cSuffix: { type: String },
  oCompany_Id:
    [{
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "mast_company_informations",
    }],
  cTitle: { type: String },
  oContactRoles: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "crm_contact_roles",
  },
  cEmail: { type: String },
  cLinkedInURL: { type: String },
  cWorkPhoneNumber: [phoneSchema],
  cCellPhoneNumber: [phoneSchema],
  cFax: [phoneSchema],
  cDisplayName: { type: String },
  dCreatedAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  bActive: {
    type: Boolean,
    default: true,
  },
  oCreatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "useradmin_mast_users",
  },
  oUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "useradmin_mast_users",
  },
  dUpdatedAt: {
    type: Date,
    default: Date.now,
  },
  // oUsercompanyId: { type: mongoose.Schema.Types.ObjectId },
  oUsercompanyId: {
    type: mongoose.Schema.Types.ObjectId,
    // required: true,
    ref: "mast_company_informations",
  },
  //*****************
  cPassword: {
    type: String,
  },
  cMobileNo: {
    type: String,
  },
  cDepartment: {
    // type: String,
    type: mongoose.Schema.Types.ObjectId,
    ref: "crm_mast_departments",
  },
  preferredContact: {
    type: Boolean,
    default: false,
  },
});

// Apply the track changes plugin
LeadsCustomerDetailsSchema.plugin(trackChangesPlugin, {
  fieldsToTrack: [
    'cSalutation',
    'cFirst_Name',
    'cLast_Name',
    'cSuffix',
    'cDisplayName',
    'cTitle',
    'cEmail',
    'cLinkedInURL',
    'cPassword',
    'cMobileNo',
    'cWorkPhoneNumber',
    'cCellPhoneNumber',
    'cFax',
    'oCompany_Id',
    'oContactRoles',
    'cDepartment',
    'preferredContact',
    'bActive',
    'dCreatedAt',
    'dUpdatedAt',
    'oCreatedBy'
  ],
  module: 'leads_customer_details'
});

// Pre-save hook to update dUpdatedDate on document update
LeadsCustomerDetailsSchema.pre("save", function (next) {
  if (!this.isNew) {
    this.dUpdatedDate = Date.now();
  }
  next();
});

const LeadsCustomerDetails = mongoose.model(
  "leads_customer_details",
  LeadsCustomerDetailsSchema
);


module.exports = LeadsCustomerDetails;
