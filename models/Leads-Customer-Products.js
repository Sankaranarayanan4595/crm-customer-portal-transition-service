const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LeadsCustomerProductDetailsSchema = new Schema({
  oCompany_Id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "mast_company_informations",
  },
  oUserCompany_Id: {
    type: mongoose.Schema.Types.ObjectId,
    // required: true,
    ref: "mast_company_informations",
  },
  dActivationAt: {
    type: Date,
  },
  oStatus_Id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "leads_master_statuses",
  },
  dRequestAt: {
    type: Date,
  },
  oCategory_Id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "leads_categories",
  },
  oPortal_Id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "leads_portal_details",
  },
  oProductCategory_Product_Mapping_Id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "leads_productcategory_product_mappings",
  },
  cCreatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: "useradmin_mast_users",
  },
  cComments: {
    type: String,
  },
  dCreateDateAt: {
    type: Date,
    default: Date.now,
  },
  dUpdatedAt: {
    type: Date,
    default: Date.now,
  },
  refCompanyID: {
    type: String,
  },
  cSoldPrice: {
    type: String,
  },
  iBillingFrequency: {
    type: Number,
  },
  bIsproductBased: {
    type: Boolean,
    default: true,
  },
  otherCharges: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "crm_mast_additionalcharges",
      },
      cAmount: { type: String },
    },
  ],
});
const LeadsCustomerProductDetails = mongoose.model(
  "leads_customer_product_details",
  LeadsCustomerProductDetailsSchema
);
module.exports = LeadsCustomerProductDetails;
