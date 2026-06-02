const mongoose = require("mongoose");
const { Schema } = mongoose;
const CompanyIntegrationConfigurationSchema = new Schema(
  {
    oCompanyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    defaultConfigurationType: {
      type: String,
      enum: ["NONE", "netsuiteConfig", "quickbooksConfig"],
      default: "NONE",
    },

    netsuiteConfig: {
      accountId: { type: String },
      consumerKey: { type: String },
      consumerSecret: { type: String },
      tokenId: { type: String },
      tokenSecret: { type: String },
      roleId: { type: String },
      baseUrl: { type: String },
      active: { type: Boolean, default: true },
      adminMailId: { type: Array },
      productInActive: { type: String },
      productNotFound: { type: String },
      error: { type: String },
      pdfScript: { type: String },
      customForm: { type: String },
      standardCustomForm: { type: String },
      creditMemoMailTemplateId: { type: String },
    },

    quickbooksConfig: {
      clientId: { type: String },
      clientSecret: { type: String },
      realmId: { type: String },
      refreshToken: { type: String },
      accessToken: { type: String },
      tokenExpiry: { type: Date },
      active: { type: Boolean, default: true },
    },
    fileSizeConfig: {
      type: String,
      default: 20, //mb
    },
    emailConfig: {
      cAttachmentSizeLimit: {
        type: Number,
        default: 10, //mb
      },

      cArchiveMailID: { type: Array },
      cDistributionMailID: { type: Array },
      cBccMailID: { type: Array },
    },
    active: { type: Boolean, default: true },

    oCreatedBy: {
      type: Schema.Types.ObjectId,
      ref: "useradmin_mast_users",
    },
    oUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: "useradmin_mast_users",
    },
    dCreateAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    isDefault: {
      type: Boolean,
      default: true
    },
    transitionConfig: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
);

const CRMCompanyConfig = mongoose.model(
  "mast_company_integration_configurations",
  CompanyIntegrationConfigurationSchema
);
module.exports = CRMCompanyConfig;
