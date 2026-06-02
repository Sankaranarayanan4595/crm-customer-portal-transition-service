const mongoose = require("mongoose");

const CRMBillingAddressSchema = new mongoose.Schema({
  cBilling_First_Name: {
    type: String,
  },
  cBilling_Last_Name: {
    type: String,
  },
  cBilling_Email: {
    type: String,
  },
 
  cBilling_MobileNo: {
    type: String,
  },
  oCompany_Id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "mast_company_informations",
  },
  dCreatedAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  dUpdatedAt: {
    type: Date,
    default: Date.now,
  },
  cBilling_Address1: {
    type: String,
    required: false, // signup changes
  },
  cBilling_Address2: {
    type: String,
  },
  cBilling_Postal_Code: {
    type: String,
    // required: true,
  },
  cBilling_City: {
    type: String,
    // required: true,
  },
  cBilling_State: {
    type: String,
    // required: true,
  },
  cBilling_Country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "mast_countries",
    required: false, //signup changes
  },
 
  bActive: {
    type: Boolean,
    default: true,
  },
  oCreatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "useradmin_mast_users",
  },
  oUsercompanyId: { type: mongoose.Schema.Types.ObjectId },
});

// Pre-save hook to update dUpdatedDate on document update
CRMBillingAddressSchema.pre("save", function (next) {
  if (!this.isNew) {
    this.dUpdatedDate = Date.now();
  }
  next();
});

const CRMBillingAddress = mongoose.model(
  "crm_billing_addresses",
  CRMBillingAddressSchema
);

module.exports = CRMBillingAddress;
