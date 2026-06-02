const mongoose = require("mongoose");

// Define the schema for ABG_ProductDetails
const LeadsActivationStatusSchema = new mongoose.Schema({
  cStatus_Name: {
    type: String,
    required: true,
  },
  cStatus_Code: {
    type: String,
    required: true,
  },
  cStatus_Type: {
    type: String,
    required: true,
  },
  className: {
    type: String,
    required: true,
  },
  // statusIcons:{
  //   type:String,
  //   // required: true,
  // },
  statusIcons: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "useradmin_mast_icons",
    // required: true,
  },
  borderColor: {
    type: String,
    // required: true,
  },
  textColor: {
    type: String,
    // required: true,
  },
  iSortOrder: {
    type: Number,
    required: true,
  },
  dCreateAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  bActive: {
    type: Boolean,
    default: true,
  },
  isCustomerVisible: {
    type: Boolean,
    default: false,
  },
  bIsSubStatus: {
    type: Boolean,
    default: false,
  },
  oMainStatus_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "leads_master_statuses",
    required: function () {
      return this.bIsSubStatus === true;
    }
  },
  oUserCompanyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "mast_company_informations",
    required: true,
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
  },
});
const LeadsActivationStatus = mongoose.model(
  "leads_master_statuses",
  LeadsActivationStatusSchema,
);

module.exports = LeadsActivationStatus;
