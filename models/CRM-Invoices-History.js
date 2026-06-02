const mongoose = require("mongoose");
const AutoIncrement = require("../utils/autoIncrement")(mongoose);

const CrmInvoicesHistorySchema = new mongoose.Schema({
  iInvoiceNo: {
    type: Number,
    unique: true,
  },
  oPaymentStatus: {
    type: mongoose.Schema.Types.ObjectId,
    // required: true,
    ref: "leads_master_statuses",
  },
  oDraft_Id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "crm_draft_invoices",
  },
  child_draft_id: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "crm_draft_invoices",
  }],
  oCompany_Id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "mast_company_informations",
  },
  //Use line items instead of invoice details
  lineItems: [
    {
      oActivation_Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "leads_customer_product_details",

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
      oOpportunity_Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "leads_opportunity_product_company_mappings",

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
      dUpdatedAt: {
        type: Date,
        default: Date.now,
      },
      oUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "useradmin_mast_users",
      },
    }
  ],
  oUserCompanyId: { type: mongoose.Schema.Types.ObjectId },
  cFilePath: {
    type: String,
  },
  cFileName: {
    type: String,
  },
  cBillingAddress: {
    type: String,
  },
  cEmail: {
    type: String,
  },
  cPhoneNumber: {
    type: String,
  },
  cFirstName: {
    type: String,
  },
  cLastName: {
    type: String,
  },
  bEmailed: {
    type: Boolean,
    default: false,
  },
  invoiceDetails: [
    {
      oActivation_Id: {
        type: mongoose.Schema.Types.ObjectId,
        // required: true,
        ref: "leads_customer_product_details",
      },

      cInvoiceDuration: {
        type: String,
      },
      cClientCompanyName: {
        type: String,
      },

      iQty: {
        type: Number,
        required: true,
      },
      discountAmount: {
        type: Number,
        required: false,
      },
      cValue: {
        type: String, //only allow three decimals .000
        required: true,
      },
      cSubTotal: {
        type: String,
      },
      oTax_Id: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "crm_mast_taxes",
          required: false,
        },
      ],


      cComments: {
        type: String,
      },
      cDescription: {
        type: String,
      },

      iInvoiceRefId: {
        type: Number,
      },
      iOrderOrCaseId: {
        type: Number,
      },
      oDraftRefId: {
        type: Number,
      },
      cDiscount: {
        type: Number,
      },
      cLineDiscount: {
        type: Number,
      },
      cLineDiscountUnit: {
        type: String,
      },
      cInvoice_Date: {
        type: Date,
      },
      type: {
        type: String,
        default: "product"
      },
      serviceName: {
        type: String,
      },
      isFTE: {
        type: Boolean,
        default: false
      },
      isSubscription: {
        type: Boolean,
        default: false
      },
      lineItems: [
        {
          iQty: {
            type: Number,
          },
          cValue: {
            type: String,
          },
          cSubTotal: {
            type: String,
          },
          cLineDiscount: {
            type: Number,
          },
          cLineDiscountUnit: {
            type: String,
          },
          oUserType: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "crm_mast_usertypes"
          },
          cUserTypeName: {
            type: String,
          },
          cDescription: {
            type: String,
          },
          cInvoice_Date: {
            type: Date,
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
        }
      ]
    },
  ],
  oTerms_Id: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "crm_mast_terms",
    },
  ],

  // In your CrmInvoicesHistory schema, update the sharePointFile field:
  sharePointFile: {
    fileName: {
      type: String
    },
    filePath: {  // Add this to store the path returned from SharePoint
      type: String
    },
    fileUrl: {
      type: String
    },
    uploadedAt: {
      type: Date
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "useradmin_mast_users"
    }
  },

  isBilledToClient: {
    type: Boolean,
    default: false,
  },
  isMRC: {
    type: Boolean,
    default: false,
  },
  isSummary: {
    type: Boolean,
    default: false,
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
  cDiscount: {
    type: Number,
  },
  cDiscountUnit: {
    type: String,
  },
  cDiscountType: {
    type: String,
  },
  billDiscountAmount: {
    type: String
  },
  bActive: {
    type: Boolean,
    default: true,
  },
  dCreateAt: {
    type: Date,
    default: Date.now,
  },
  dInvoiceDueAt: {
    type: String,

  },
  iQBInvoiceId: {
    type: Number,
  },
  iQBInvoiceNo: {
    type: Number,
  },
  iQBPaymentNo: {
    type: Number,
  },
  oCreatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "useradmin_mast_users",
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "useradmin_mast_users",
  },
  cBalanceDue: {
    type: String,
    default: "0",
  },

  dPaymentDate: {
    type: Date,
    default: Date.now,
  },
  cAmountPaid: {
    type: String,
    default: "0",
  },
  PaymentDetails: {
    cPaymentMode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "crm_mast_paymentmodes",
    },
    cBankName: { type: String },
    cBankAccountNumber: { type: String },
    cifscCode: { type: String },
    cChequeNumber: { type: String },
    cTransactionId: { type: String },
    cNotes: {
      type: String,
    },
    cFileName: [],
    cFilePath: [],
  },
  recipientName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "useradmin_mast_users",
  },
  cVoidReason: {
    type: String,
  },
  cMessage: {
    type: String
  },
  netSuiteInvoiceNo: {
    type: String
  },
  netSuiteInvoiceId: {
    type: Number,
  },
  oTerms_Id:
  {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: "crm_mast_terms",
  },
  repost: [
    {
      status: { type: String },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "useradmin_mast_users",
      }
    }
  ],
  cMessage: {
    type: String
  },
   isCreditMemo: {
      type: Boolean,
      default: false,
    },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  bIsCompanyBased: {
    type: Boolean,
    default: false,
  },
  bIsProductBased: {
    type: Boolean,
    default: false,
  },
  cInvoiceDuration: {
    type: String,
  },
  cInvoice_Date: {
    type: String,
  },

});
CrmInvoicesHistorySchema.plugin(AutoIncrement, { inc_field: "iInvoiceNo" });

const CrmInvoicesHistory = mongoose.model(
  "crm_invoices_history",
  CrmInvoicesHistorySchema
);
module.exports = CrmInvoicesHistory;
