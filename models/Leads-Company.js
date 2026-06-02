const mongoose = require("mongoose");
const trackChangesPlugin = require("../Service/trackChangePulgin");

const phoneSchema = new mongoose.Schema({
  code: { type: String },
  cMobileNo: { type: String },
  flag: { type: String },
});

const LeadCompanyDetailsSchema = new mongoose.Schema(
  {
    cCompanyCode: {
      type: String,
      required: true,
    },
    cCompanyID: {
      type: String,
      unique: true,
    },
    iCompany_id: {
      type: Number,
    },
    // New fields for CRM revamp
    oParentComp_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mast_company_informations",
    },
    IsConvertedtoClient: {
      type: Boolean,
      default: false,
    },
    oAccountClassification_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "crm_account_classifications",
    },
    oAccount_Source_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "crm_account_sources",
    },
    oAccountManagerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "useradmin_mast_users",
    },
    oMasterCompany_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mast_company_informations",
    },
    company_name: {
      type: String,
      required: true,
    },
    company_nickname: {
      type: String,
    },
    cCompany_Name: {
      type: String,
    },
    address: {
      type: String,
    },
    address2: {
      type: String,
    },
    city_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "useradmin_mast_city",
    },
    phone: {
      type: String,
    },
    phoneCode: [phoneSchema],
    faxCode: [phoneSchema],
    fax: {
      type: String,
    },
    email: {
      type: String,
    },
    web: {
      type: String,
    },
    tn_gst_no: {
      type: String,
    },
    cst_no: {
      type: String,
    },
    dl_no: {
      type: String,
    },
    contact_person: {
      type: String,
    },
    designation: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
    cTitle: {
      type: String,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "useradmin_mast_users",
    },
    groupcmp_id: {
      type: String,
      ref: "GroupCompany",
    },
    res_short_name: {
      type: String,
    },
    comp_short_name: {
      type: String,
    },
    comp_prefix: {
      type: String,
      default: "AIPL",
    },
    sign_text: {
      type: String,
    },
    pin_code: {
      type: String,
    },
    company_logo: {
      type: String,
    },
    fileName: {
      type: String,
    },
    pin: {
      type: Number,
    },
    tan_no: {
      type: String,
    },
    serv_tax_reg_no: {
      type: String,
    },
    comp_message: {
      type: String,
      default: "-",
    },
    comp_digital_sign: {
      type: Buffer,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "useradmin_mast_users",
    },
    oCreatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "useradmin_mast_users",
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "useradmin_mast_users",
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    // bEnableQuickBook: {
    //   type: Boolean,
    //   default: false,
    // },
    // bEnableAcceptCash: {
    //   type: Boolean,
    //   default: false,
    // },
    // acceptedLimit: {
    //   type: Number,
    // },
    // bSameAsBillingAddres: {
    //   type: Boolean,
    //   default: true,
    // },
    // oDefaultBillingAddress: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "crm_billing_addresses",
    // },
    cComments: {
      type: String,
    },
    oContactPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "leads_customer_details",
    },
    // oBillingContactPerson: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "crm_billing_addresses",
    // },
    // cPreferredContact: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "leads_customer_details",
    //   },
    // ],
    oStatus_Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "leads_master_statuses",
    },
    oUsercompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mast_company_informations"
    },
    // iQBCompanyId: {
    //   type: Number,
    // },
    insuserv_companyId: {
      type: Number,
    },
    // isMailService: {
    //   type: Boolean,
    //   default: false,
    // },
    cCity: {
      type: String,
    },
    cState: {
      type: String,
    },
    cCountry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mast_countries",
    },
    cAccountantFirstName: {
      type: String,
    },
    cAccountantLastName: {
      type: String,
    },
    cAccountingSoftware: {
      type: String,
    },
    cOtherDetails: {
      public: {
        type: Boolean,
        default: false
      },
      blackstoneEntity: {
        type: Boolean,
        default: false
      },
      erp: [{ type: String }],
      software: [{ type: String }],
      payables: [{ type: String }],
    },
    unifiedCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    // opportunities: [
    //   {
    //     oOpportunityIndustryId: {
    //       type: mongoose.Schema.Types.ObjectId,
    //       ref: "leads_categories",
    //     },
    //     oOpportunityListId: {
    //       type: mongoose.Schema.Types.ObjectId,
    //       ref: "leads_productCategory_product_mapping",
    //     },
    //     cProjectName: { type: String },
    //     oOpportunityTypeId: {
    //       type: mongoose.Schema.Types.ObjectId,
    //       ref: "leads_opportunity_types",
    //     },
    //     cValue: { type: String },
    //     dOpportunityCreatedDate: {
    //       type: Date,
    //       immutable: true,
    //       default: Date.now,
    //     },
    //     dOpportunityUpdatedDate: {
    //       type: Date,
    //       default: Date.now,
    //     },
    //   },
    // ],
    oSalesManagerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "useradmin_mast_users",
    },
    statusChangeLogs: [
      {
        oClientSubStatus: {
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
    // bIsProductBased: { type: Boolean, default: false },
    // bIsCompanyBased: { type: Boolean, default: false },
    Invoice_Approvals: [
      {
        classId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "leads_categories",
        },
        subClassId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "leads_subclasses",
        },
        cUserLevels: [
          {
            level: {
              type: String,
              required: true,
            },
            users: [
              {
                type: mongoose.Schema.Types.ObjectId,
                ref: "useradmin_mast_users",
                required: true,
              },
            ],
            SLA: {
              iCount: {
                type: Number,
                default: 0,
              },
              iSelectedTimeUnit: {
                type: String,
                enum: ["Hours", "Days"],
              },
            },
            // bAllMustApprove: {
            //   type: Boolean,
            //   default: false,
            // },
          },
        ],
      },
    ],
    Billing_Informations: {
      IsConsolidateParent: {
        type: Boolean,
        default: false,
      },
      IsSeparateBySubclass: {
        type: Boolean,
        default: true,
      },
      IsOneInvoicePerEmail: {
        type: Boolean,
        default: false,
      },
      IsAutoCCManager: {
        type: Boolean,
        default: true,
      },
      IsSeparateBySOW: {
        type: Boolean,
        default: true,
      },
      mailTemplateConfig: [
        {
          accountClass: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "leads_categories",
            required: true,
          },
          accountSubClass: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "leads_subclasses",
            required: true,
          },
          emailTemplate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "useradmin_mast_mailtemplates",
            required: true,
          },
          toRecipients: [{ type: String }],
          ccRecipients: [{ type: String }],
        },
      ],
    },
    oTermsId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "crm_mast_terms",
    },
    transition_Approvals: [
      {
        // subClassId: {
        //   type: mongoose.Schema.Types.ObjectId,
        //   ref: "leads_subclasses",
        // },
        cUserLevels: [
          {
            level: {
              type: String,
              required: true,
            },
            users: [
              {
                type: mongoose.Schema.Types.ObjectId,
                ref: "useradmin_mast_users",
                required: true,
              },
            ],
            SLA: {
              iCount: {
                type: Number,
                default: 0,
              },
              iSelectedTimeUnit: {
                type: String,
                enum: ["Hours", "Days"], // restricts to valid units
              },
            },
            // bAllMustApprove: {
            //   type: Boolean,
            //   default: false,
            // },
          },
        ],
      },
    ]
    // oInvoiceEditors: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "useradmin_mast_users",
    //     required: true,
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
  },
  {
    versionKey: false,
    strict: true,
  }
);
// // 🔹 Pre-save hook to generate unique cCompanyCode
// LeadCompanyDetailsSchema.pre("validate", async function (next) {
//   if (!this.isNew || this.cCompanyCode) return next();

//   try {
//     let codeNumber = 1;
//     let newCode;

//     // Find max existing code number in the collection
//     const latestDoc = await mongoose
//       .model("leads_company_details")
//       .findOne({ cCompanyCode: /^ABG-\d+$/ })
//       .sort({ cCompanyCode: -1 })
//       .exec();

//     if (latestDoc && latestDoc.cCompanyCode) {
//       // Extract number from code e.g. ABG-117 -> 117
//       const match = latestDoc.cCompanyCode.match(/ABG-(\d+)/);
//       if (match) {
//         codeNumber = parseInt(match[1], 10) + 1;
//       }
//     }

//     while (true) {
//       newCode = `ABG-${String(codeNumber).padStart(3, "0")}`;

//       // Check if code already exists
//       const existing = await mongoose
//         .model("leads_company_details")
//         .findOne({ cCompanyCode: newCode })
//         .exec();

//       if (!existing) {
//         // Not found, assign and break loop
//         this.cCompanyCode = newCode;
//         break;
//       }

//       // If exists, increment and try again
//       codeNumber++;
//     }

//     next();
//   } catch (err) {
//     next(err);
//   }
// });

// Apply audit plugin
LeadCompanyDetailsSchema.plugin(trackChangesPlugin, {
  fieldsToTrack: [
    'company_name',
    'company_nickname',
    'cCompanyCode',
    'cCompanyID',
    'address',
    'address2',
    'city_id',
    'phone',
    'fax',
    'fileName',
    'comp_message',
    'faxCode',
    'phoneCode',
    'pin_code',
    'email',
    'web',
    'active',
    'oAccountClassification_id',
    'oAccount_Source_id',
    'oAccountManagerUserId',
    'oParentComp_id',
    'oMasterCompany_id',
    'oStatus_Id',
    'cCity',
    'cState',
    'cCountry',
    'cAccountantFirstName',
    'cAccountantLastName',
    'cAccountingSoftware',
    'cComments',
    'oSalesManagerUserId',
    'Invoice_Approvals',
    'Billing_Informations',
    'statusChangeLogs'
  ],
  module: 'leads_company_details'
});

const LeadCompanyDetails = mongoose.model(
  "leads_company_details",
  LeadCompanyDetailsSchema
);
module.exports = LeadCompanyDetails;