const mongoose = require("mongoose");
const trackChangesPlugin = require("../Service/trackChangePulgin");
const Schema = mongoose.Schema;

const teamMemberSchema = new mongoose.Schema({
  oRole_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'leads_roles',
    // required: true
  },
  oUser_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'useradmin_mast_users',
    // required: true
  },
  cRole_Name: {
    type: String,
    // required: true
  },
  cUser_Name: {
    type: String,
    // required: true
  },
  cEmail: {
    type: String,
    // required: true
  },
  // New fields
  jobTitle: {
    type: String,
    default: ''
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  billableStartDate: {
    type: Date,
    default: null
  },
  billableEndDate: {
    type: Date,
    default: null
  },
  status: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'leads_master_statuses',
    default: null
  },
  status_Name: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  }
}, { _id: true });

const LeadsOpportunityProductCompanyMappingsSchema = new Schema({
  cOpportunityCode: { type: String, unique: true }, // Auto-generated code
  cOpportunityName: { type: String },
  cDescription: { type: String },
  oOpportunity_Owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "useradmin_mast_users",
  },
  // oStatus_Id: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "leads_master_statuses",
  //   required: true,
  // },
  // dStatusUpdatedAt: {
  //   type: Date,
  //   default: Date.now,
  // },
  oCompany_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "leads_company_details",
    required: true,
  },
  oUserCompany_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "mast_company_informations",
  },
  // oContactPerson: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "leads_customer_details",
  //   required: true,
  // },

  cProbability: { type: String },

  dTargetclose_Date: {
    type: Date,
    default: Date.now,
  },
  oOpportunitysource_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "leads_opportunity_sources",
  },
  oSubClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "leads_subclasses",
    // required: true,
  },
  competitiveLandscape: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "crm_mast_competitivelandscapes",
    // required: true,
  }],
  internalChampion: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "leads_customer_details",
    // required: true,
  }],
  rfp: {
    type: Boolean,
    default: false,
  },
  solutionObjective: {
    type: String
    // required: true,
  },
  urgencyLevel: {
    type: String
    // required: true,
  },

  oCategoryID: [{ //class
    type: mongoose.Schema.Types.ObjectId,
    ref: "leads_categories",
    required: true,
  }],

  // Escalation details
  bIsEscalation: {
    type: Boolean,
    default: false,
  },
  bIsEscalationRounded: {
    type: Boolean,
    default: false,
  },
  cEscalationPercentage: {
    type: Number,
  },
  cEscalationAmount: {
    type: Number,
  },
  // oldEscalationPercentage: {
  //   type: Number,
  // }, oldEscalationAmount: {
  //   type: Number,
  // }, roundedEscalationPercentage: {
  //   type: Number,
  // }, roundedEscalationAmount: {
  //   type: Number,
  // },
  roundTo: {
    type: Number
  },
  escalationDate: {
    type: Date,
  },
  oEscalationFrequency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "crm_mast_frequencies"
  },
  nextEscalationBillingDate: {
    type: Date,
  },
  endDate: {
    type: Date
  },
  startDate: {
    type: Date,
    default: null
  },
  lastEscalationDate: { type: Date },     // Last time price was escalated
  isEscalationMet: {
    type: Boolean,
    default: false
  },
  ProductDetails: [
    {
      cOpportunityLineCode: { type: String, unique: true }, // Auto-generated code
      oProductCategory_Product_Mapping_Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "leads_productcategory_product_mappings",
        required: true,
      },
      cFeaturesDesc: { type: String },
      oBilling_Unit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "leads_billing_units",
      },
      oLevel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "crm_mast_levels",
      },
      cOpportunityLine: { type: String },
      cBillingCycle: { type: String },
      cNegotiatedPrice: { type: String },
      cEscalatedPrice: { type: String },
      originalEscalatedPrice: { type: Number },
      cBasePrice: { type: String },
      cBillingType: { type: String },
      cQuantity: { type: String },
      cExtendedPrice: { type: String },
      cAnnualValue: { type: String },
      cStandardPriceUnit: { type: String },
      forecasting: { type: mongoose.Schema.Types.Mixed },
      isAddedToBillingRows: {
        type: Boolean,
        default: false,
      },
      draftCreatedAt: {
        type: Date,
        default: null,
      },
      dCreateDate: {
        type: Date,
        default: null,
      },
    },
  ],
  cOppValue: { type: String },
  unifiedNotificataionid: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "useradmin_notifications"
  }],
  TeamDetails: [teamMemberSchema],
  statusChangeLogs: [
    {
      oOpportunitySubStatus: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "leads_master_statuses",
      },
      dStatusChangeDate: {
        type: Date,
        default: Date.now,
      },
      cStatusNotes: {
        type: String,
      },
      oUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "useradmin_mast_users",
      },
    },
  ],
  stageChangeLogs: [
    {
      oOpportunityStage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "leads_master_statuses",
      },
      dStageChangeDate: {
        type: Date,
        default: Date.now,
      },
      cStatusNotes: {
        type: String,
      },
      oUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "useradmin_mast_users",
      },
    },
  ],

  Links: [
    {
      cLink: { type: String },

      cLinkDescription: { type: String },

      oUploaded_By: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "useradmin_mast_users",
      },
      dUploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  Files: [
    {
      cFileName: { type: String },
      cFilePath: { type: String },
      cFileDescription: { type: String },
      oFileUploaded_By: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "useradmin_mast_users",
      },
      dFileUploadedAt: {
        type: Date,
        default: Date.now,
      },
      sourceType: { type: String },
      sourceActivityId: { type: mongoose.Schema.Types.ObjectId },
      sourceActivityName: { type: String },
      sourceActivityCode: { type: String }
    },
  ],

  oActivityId: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Leads_Activities",
  }],

  cCreatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "useradmin_mast_users",
  },
  dCreateDateAt: {
    type: Date,
    default: Date.now,
  },

  dUpdatedAt: {
    type: Date,
    default: Date.now,
  },
  cUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "useradmin_mast_users",
  },
  bActive: {
    type: Boolean,
    default: true,
  },
  isTransition: {
    type: Boolean,
    default: false,
  }
});
// Auto-generate unique opportunity code
LeadsOpportunityProductCompanyMappingsSchema.pre("validate", async function (next) {
  try {
    const Model = mongoose.model("leads_opportunity_product_company_mappings");
    const existingDocs = await Model.find({}, { "ProductDetails.cOpportunityLineCode": 1, "cOpportunityCode": 1 }).lean();
    let maxLineNum = 0;
    let maxOppNum = 0;

    if (this.isNew && !this.cOpportunityCode) {
      existingDocs.forEach(doc => {
        if (doc.cOpportunityCode && doc.cOpportunityCode.startsWith("OPP-")) {
          const num = parseInt(doc.cOpportunityCode.split("OPP-")[1]);
          if (!isNaN(num) && num > maxOppNum) maxOppNum = num;
        }
      });

      this.cOpportunityCode = `OPP-${String(maxOppNum + 1).padStart(4, "0")}`;
    }
    // 🔹 Generate unique line codes for each product (globally unique)
    if (Array.isArray(this.ProductDetails) && this.ProductDetails.length > 0) {
      // Find the max number currently used in all opportunity lines

      existingDocs.forEach(doc => {
        doc.ProductDetails?.forEach(p => {
          if (p.cOpportunityLineCode && p.cOpportunityLineCode.startsWith("OPP-LN-")) {
            const num = parseInt(p.cOpportunityLineCode.split("OPP-LN-")[1]);
            if (!isNaN(num) && num > maxLineNum) maxLineNum = num;
          }
        });
      });

      // Assign new codes sequentially
      for (const product of this.ProductDetails) {
        if (!product.cOpportunityLineCode) {
          maxLineNum++;
          product.cOpportunityLineCode = `OPP-LN-${String(maxLineNum).padStart(4, "0")}`;
        }
      }
    }

    next();
  } catch (err) {
    next(err);
  }
});

// Apply the plugin
LeadsOpportunityProductCompanyMappingsSchema.plugin(trackChangesPlugin, {
  fieldsToTrack: [
    'cOpportunityName',
    'cDescription',
    'oOpportunity_Owner',
    'oCompany_Id',
    'cProbability',
    'dTargetclose_Date',
    'oOpportunitysource_Id',
    'oSubClass',
    'oCategoryID',
    'bIsEscalation',
    'bIsEscalationRounded',
    'cEscalationPercentage',
    'cEscalationAmount',
    'roundTo',
    'escalationDate',
    'oEscalationFrequency',
    'nextEscalationBillingDate',
    'endDate',
    'startDate',
    'lastEscalationDate',
    'isEscalationMet',
    'ProductDetails',
    'cOppValue',
    'TeamDetails',
    'statusChangeLogs',
    'stageChangeLogs',
    'Links',
    'Files',
    'bActive'
  ],
  module: 'leads_opportunity_product_company_mappings'
});


const LeadsOpportunityProductCompanyMappings =
  mongoose.model("leads_opportunity_product_company_mappings",
    LeadsOpportunityProductCompanyMappingsSchema);
module.exports = LeadsOpportunityProductCompanyMappings;



