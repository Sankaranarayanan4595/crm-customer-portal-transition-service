const mongoose = require("mongoose");
const AutoIncrement = require("../utils/autoIncrement")(mongoose);

const EscalationNotificationSchema = new mongoose.Schema(
  {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    emailNotified: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const CrmDraftInvoicesSchema = new mongoose.Schema({
  iDraftNo: {
    type: Number,
    unique: true,
  },
  cInsuServeID: {
    type: String,
    unique: true,
  },
  dCreateAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  oCreatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "useradmin_mast_users",
  },
  dUpdatedAt: {
    type: Date,
    default: Date.now,
  },
  oUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "useradmin_mast_users",
  },
  oCompany_Id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "mast_company_informations",
  },
  oSubClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "leads_subclasses",
    // required: true,
  },
  oAccountManagerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "useradmin_mast_users",
  },
  // oActivation_Id: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   // required: true,
  //   ref: "leads_customer_product_details",
  // },
  cInvoiceDuration: {
    type: String,
  },
  cFilePath: {
    type: String,
  },
  cRejectReason: {
    type: String,
  },
  cFileName: {
    type: String,
  },
  // iQty: {
  //   type: Number,
  //   required: true,
  // },
  // cValue: {
  //   type: String, 
  //   required: true,
  // },
  // cSubTotal: {
  //   type: String,
  // },
  oInvoiceDraftStatus: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "leads_master_statuses",
  },
  cDraftType: {
    type: String,
  },
  // cProductName: {
  //   type: String,
  // },
  cComments: {
    type: String,
  },
  oUserCompanyId: { type: mongoose.Schema.Types.ObjectId },
  iInvoiceRefId: {
    type: String,
    // required: true,
  },
  bActive: {
    type: Boolean,
    default: true,
  },
  isCreditMemo: {
    type: Boolean,
    default: false,
  },
  oOriginalInvoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "crm_invoices_history",
  },
  internalCreditNotes: {
    type: String,
  },
  reasonForCredit: {
    type: String,
  },
  cTotal: {
    type: String,
  },
  cCurrency: {
    type: String,
    default: "USD",
  },
  cExchangeRate: {
    type: Number,
    default: 1,
  },
  cTotalUSD: {
    type: Number,
  },
  // strDtl:[
  //   {
  //     type: String
  //   }
  // ],
  //  parentCompany:{
  //   type: String
  //  },
  OriginallineItems: [
    {
      oAccountManagerUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "useradmin_mast_users",
      },
      oCompanyId: {
        type: mongoose.Schema.Types.ObjectId
      },
      oOpportunityCode: {
        type: String,
      },
      oOpportunity_Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "leads_opportunity_product_company_mappings",

      },
      oProductCategory_Product_Mapping_Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "leads_productcategory_product_mappings",
      },
      cUniqueOppoLineCode: {
        type: String,
        // required: true
      },
      cClientID: {
        type: String,
        // required: true
      },
      cClientName: {
        type: String,
        // required: true
      },
      cProductCode: {
        type: String,
        // required: true
      },
      oSubClass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "leads_subclasses",
        // required: true,
      },
      cProcessDescription: {
        type: String,
        // required: true
      },
      cDisplayDescription: {
        type: String,
        // required: true
      },
      cBillingType: {
        type: String,
        // required: true
      },
      cReqRollOver: {
        type: String,
        // required: true
      },
      cDisplayZero: {
        type: String,
        // required: true
      },
      cSow: {
        type: String,
        // required: true
      },
      cPO: {
        type: String,
        // required: true
      },
      iQty: {
        type: Number,
        // required: true
      },
      cValue: {
        type: String,
        // required: true
      },
      cSubTotal: {
        type: String
      },
      Comments: [
        {

          dCommentDate: {
            type: Date,
            default: Date.now,
          },
          cComments: {
            type: String,
          },
          cCommentsRollOver: {
            type: Boolean,
            default: true
          },
          oUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "useradmin_mast_users",
          },
        },
      ],
      Files: [
        {

          dUploadedDate: {
            type: Date,
            default: Date.now,
          },
          cFilePath: {
            type: String,
          },
          cFileName: {
            type: String,
          },
          oUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "useradmin_mast_users",
          },
        },
      ],
      dCreatedAt: {
        type: Date,
        default: Date.now,
        immutable: true
      },
      dUpdatedAt: {
        type: Date,
        default: Date.now,
      },
      oUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "useradmin_mast_users",
      },
      isAddedToBillingRowsDraft: {
        type: Boolean,
        default: false,
      },
    }
  ],

  mailTemplateConfig: [
    {
      accountSubClass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "leads_subclasses",
        required: true,
      },
      emailTemplate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "useradmin_mast_mailtemplates",
      },
      subject: {
        type: String,
      },
      body: {
        type: String,
      },
      toRecipients: [
        {
          type: String,
        },
      ],
      ccRecipients: [
        {
          type: String,
        },
      ],
    },
  ],
  escalationNotification: {
    startDate: Date,
    endDate: Date,
    emailNotified: Boolean
  },



  lineItems: [
    {
      oAccountManagerUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "useradmin_mast_users",
      },
      oCompanyId: {
        type: mongoose.Schema.Types.ObjectId
      },
      oOpportunityCode: {
        type: String,
      },
      oOpportunity_Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "leads_opportunity_product_company_mappings",

      },
      oProductCategory_Product_Mapping_Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "leads_productcategory_product_mappings",
      },
      cUniqueOppoLineCode: {
        type: String,
        // required: true
      },
      cClientID: {
        type: String,
        // required: true
      },
      cClientName: {
        type: String,
        // required: true
      },
      cProductCode: {
        type: String,
        // required: true
      },
      oSubClass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "leads_subclasses",
        // required: true,
      },
      cProcessDescription: {
        type: String,
        // required: true
      },
      cDisplayDescription: {
        type: String,
        // required: true
      },
      level: {
        type: String,
      },
      productName: {
        type: String,
      },

      cBillingType: {
        type: String,
        // required: true
      },
      cReqRollOver: {
        type: String,
        // required: true
      },
      cDisplayZero: {
        type: String,
        // required: true
      },
      cSow: {
        type: String,
        // required: true
      },
      cPO: {
        type: String,
        // required: true
      },
      iQty: {
        type: Number,
        // required: true
      },
      cValue: {
        type: String,
        // required: true
      },
      cSubTotal: {
        type: String
      },
      escalationNotification: {
        type: EscalationNotificationSchema,
        default: null,
      },
      Comments: [
        {

          dCommentDate: {
            type: Date,
            default: Date.now,
          },
          cComments: {
            type: String,
          },
          cCommentsRollOver: {
            type: Boolean,
            default: true
          },
          oUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "useradmin_mast_users",
          },
          oUpdatedByName: {
            type: String,
          },
        },
      ],
      Files: [
        {

          dUploadedDate: {
            type: Date,
            default: Date.now,
          },
          cFilePath: {
            type: String,
          },
          cFileName: {
            type: String,
          },
          oUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "useradmin_mast_users",
          },
        },
      ],
      dCreatedAt: {
        type: Date,
        default: Date.now,
        immutable: true,
      },
      dUpdatedAt: {
        type: Date,
        default: Date.now,
      },
      oUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "useradmin_mast_users",
      },
      isAddedToBillingRowsDraft: {
        type: Boolean,
        default: false,
      },
    }
  ],
  isQueue: {
    type: Boolean,
    default: false,
  },
  oParent_DraftId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  // lineItems:{
  //   CrmInsMRCListDataID:[
  //     {

  //       type: mongoose.Schema.Types.ObjectId,
  //   ref: "crm_ins_list_datas",
  //     }
  //   ],
  //   CrmInsMRCMatrixDataID:[
  //     {
  //       type: mongoose.Schema.Types.ObjectId,
  //   ref: "crm_ins_matrices_datas",


  //     }
  //   ],
  //   CrmInsSummaryDataID:[
  //     {
  //       type: mongoose.Schema.Types.ObjectId,
  //       ref: "Crm_Ins_Summary_Datas",
  //     }
  //   ],},

  // {
  //   CustomerName:{
  //     type: String,
  //   },
  //   CarrierName: {
  //     type: String,
  //   },
  //   OrderDate: {
  //     type: Date,
  //   },
  //   CompletedDate: {
  //     type: Date,
  //     default: null,
  //   },    
  //   OrderId: {
  //     type: String,
  //   },
  //   FirstName: {
  //     type: String,
  //   },
  //   LastName: {
  //     type: String,
  //   },
  //   DateOfBirth: {
  //     type: Date,
  //   },
  //   HCPName: {
  //     type: String,
  //   },
  //   ServiceName: {
  //     type: String,
  //   },
  //   CaseSummaryId: {
  //     type: String,
  //   },
  //   Rate: {
  //     type: Number,
  //   },
  //   Value:{
  //     type: Number,
  //   },
  //   Quantity:{
  //     type: Number,
  //   },
  //   SubTotal:{
  //     type: Number,
  //   },
  //   isNewRecord: {
  //     type: Boolean,
  //     default : false
  //   },
  //   isVerifyBtn: {
  //     type: Boolean,
  //     default : false
  //   },
  //   CaseId: {
  //     type:String,
  //     default: null,
  //   },
  //   SubmitDate: {
  //     type: Date,
  //   },
  //   CompletedDate: {
  //     type: Date,
  //     default: null,
  //   },
  //   DocumentName: {
  //     type: String,
  //   },
  //   DocumentId: {
  //     type: String,
  //   },
  //   BillingUniqueNo: {
  //     type: String,
  //   },
  //   ClientRef: {
  //     type: String,
  //   },
  //   CasePriority: {
  //     type: String,
  //   },
  //   ClaimType: {
  //     type: String,
  //   },
  //   Declinable: {
  //     type: String,
  //   },
  //   Billable: {
  //     type: String,
  //   },
  //   Comment: {
  //     type: String,
  //   },
  //   Pages: {
  //     type: Number,
  //   },
  //   BillingPageCount: {
  //     type: Number,
  //   },
  //   Total: {
  //     type: String,
  //   },
  //   verify: {
  //     type: String,
  //     default: "0",
  //   },
  //   Gender: {
  //     type: String,
  //   },
  //   CaseStatus: {
  //     type: String,
  //   },
  //   "MedicationTriage": {
  //     type: Number,
  //   },
  //   "EHRRetrieval": {
  //     type: Number,
  //   },
  //   "e-HIPAA": {
  //     type: Number,
  //   },
  // }

});
CrmDraftInvoicesSchema.plugin(AutoIncrement, { inc_field: "iDraftNo" });

const CrmDraftInvoices = mongoose.model(
  "crm_draft_invoices",
  CrmDraftInvoicesSchema
);
module.exports = CrmDraftInvoices;
