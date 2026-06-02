const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const trackChangesPlugin = require("../Service/trackChangePulgin");

const LeadsProductCategoryProductMappingSchema = new Schema({
  //New Fields
  cProductCode: {
    type: String,
    required: false,
  },
  cDisplayName: {
    type: String,
    required: true,
  },
  cFeaturesDesc: {
    type: String,
    required: true,
  },
  oCategoryID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "leads_categories",
    required: true,
  },
  oSubClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "leads_subclasses",
    required: true,
  },
  cGL_Account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "leads_glaccounts",
    required: true,
  },
  cBillingUnit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "leads_billing_units",
    required: true,
  },
  cStandardPrice: {
    type: Number,
    required: true,
  },
  cStandardPriceUnit: {
    type: String,
    required: true,
  },
  cBillingFrequency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "crm_mast_frequencies",
    required: true,
  },
  oProductLevel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "crm_mast_levels",
    required: true,
  },
  oUserID: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "useradmin_mast_users",
        required: true,
      },
    },
  ],
  cProductType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "leads_product_types",
    required: true,
  },
  dAvailabileFrom: {
    type: Date,
    default: Date.now,
    required: true,
  },
  dAvailabileTill: {
    type: Date,
    default: Date.now,
  },
  bExpiryNotified: {
    type: Boolean,
    default: false,
  },
  oRegion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "mast_countries",
    required: true,
  },
  cVersion: {
    type: String,
  },
  bActive: {
    type: Boolean,
    default: true,
  },

  //Old Fields
  cBasePrice: [
    {
      country: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "mast_countries",
      },
      oCurrency_ID: {
        type: String,
        ref: "mast_currencies",
      },
      basePrice: { type: String },
    },
  ],
  oIconId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "useradmin_mast_icons",
    // required: true,
  },
  // cAccountManagerMailIds: [
  //   {
  //     type: String,
  //   },
  // ],
  // cSalesBcc: [
  //   {
  //     type: String,
  //   },
  // ],
  // cSalesCC: [
  //   {
  //     type: String,
  //   },
  // ],
  // bSendMailToAccountManagers: {
  //   type: Boolean,
  //   default: false,
  // },
  // oAMMailTemplateID: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "leads_mail_templates",
  // },
  // oCustomerMailTemplateID: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "leads_mail_templates",
  // },
  // bSendMailToCustomer: {
  //   type: Boolean,
  //   default: false,
  // },
  // cCustomerBcc: [
  //   {
  //     type: String,
  //   },
  // ],
  // cCustomerCC: [
  //   {
  //     type: String,
  //   },
  // ],
  cImg_src: {
    type: String,
  },
  iSortOrder: {
    type: Number,
    // required: true,
  },
  // bIsService: {
  //   type: Boolean,
  //   default: false,
  // },
  bIsPublic: {
    type: Boolean,
    default: false,
  },
  dCreatedAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  oPortalID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "leads_portal_details",
    // required: true,
  },
  oCreatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "useradmin_mast_users",
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "useradmin_mast_users",
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "useradmin_mast_users",
  },
  oUserCompanyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "mast_company_informations",
    // required: false,
  },
  // cOtherCharges: [
  //   {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: "crm_mast_additionalcharges",
  //   },
  // ],
  iQBProductId: {
    type: String,
  },
  bIsFTE: {
    type: Boolean,
  },
  bIsSubscription: {
    type: Boolean,
  },
  // bIsAutoActivate: {
  //   type: Boolean,
  //   default: false,
  // },
  // oAdminUserIds: [
  //   {
  //     _id: {
  //       type: mongoose.Schema.Types.ObjectId,
  //       ref: "useradmin_mast_users",
  //       // required: true,
  //     },
  //   },
  // ],
  // bIsProductBased: {
  //   type: Boolean,
  //   default: false,
  // },
  // cUserLevel: [
  //   {
  //     level: {
  //       type: String,
  //       // required: true,
  //     },
  //     users: [
  //       {
  //         type: mongoose.Schema.Types.ObjectId,
  //         ref: "useradmin_mast_user",
  //         // required: true,
  //       },
  //     ],
  //     SLA: {
  //       iCount: {
  //         type: Number,
  //         default: 0,
  //       },
  //       iSelectedTimeUnit: {
  //         //hrs and Days only
  //         type: String,
  //       },
  //     },
  //     bAllMustApprove: {
  //       type: Boolean,
  //       default: false,
  //     },
  //   },
  // ],
  // DiscountSettings: [
  //   {
  //     bIsItemLevel: { type: Boolean, default: false },
  //     bIsBillLevel: { type: Boolean, default: false },
  //     iItemThreshold: { type: Number },
  //     iBillThreashold: { type: Number },
  //     iMaxItemDiscount: { type: Number },
  //     iMaxBillDiscount: { type: Number },
  //     iOverAllDiscountLimit: { type: Number },
  //   },
  // ],
});

LeadsProductCategoryProductMappingSchema.plugin(trackChangesPlugin, {
  fieldsToTrack: [
    'cProductCode',
    'cDisplayName',
    'cFeaturesDesc',
    'cStandardPrice',
    'cStandardPriceUnit',
    'bActive',
    'cVersion',
    'dAvailabileFrom',
    'dAvailabileTill',
    'dCreatedAt',
    'oUserID',
    'cBasePrice',
    'oCategoryID',
    'oSubClass',
    'cGL_Account',
    'cGL_Account_Code',
    'cBillingUnit',
    'cBillingFrequency',
    'oProductLevel',
    'cProductType',
    'oRegion',
    'oIconId',
    'oPortalID',
    'bExpiryNotified'
  ],
  module: 'leads_productcategory_product_mappings'
});


const LeadsProductCategoryProductMapping = mongoose.model(
  "leads_productcategory_product_mappings",
  LeadsProductCategoryProductMappingSchema
);
module.exports = LeadsProductCategoryProductMapping;
