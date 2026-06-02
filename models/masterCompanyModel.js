const mongoose = require("mongoose");
const trackChangesPlugin = require("../Service/trackChangePulgin");
const phoneSchema = new mongoose.Schema({
  code: { type: String },
  cMobileNo: { type: String },
  flag: { type: String },
});
const CompanySchema = new mongoose.Schema(
  {
    cCompanyCode: {
      type: String,
      required: true,
      // unique: true, // enforce uniqueness at DB level
    },
    cCompanyID: {
      type: String,
      // required: true,
      unique: true, // enforce uniqueness at DB level
    },
    iCompany_id: {
      type: Number,
      // required: true,
    },
    //New fields for crm revamp
    oParentComp_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mast_company_informations",
    },
    oAccountClassification_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "crm_account_classifications",
    },
    oAccount_Source_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "crm_account_sources",
    },
    oAccountManagerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "useradmin_mast_users",
    },
    oMasterCompany_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "mast_company_informations",
    },
    //End
    company_name: {
      type: String,
      required: true,
    },
    company_nickname: {
      type: String,
    },
    cCompany_Name: {
      type: String,
      // required: true,
    },
    address: {
      type: String,
      required: false,
    },
    address2: {
      type: String,
      required: false,
    },
    city_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
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
      required: true,
      default: true,
    },
    cTitle: {
      type: String,
      // required: true,
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
      default: null,
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

    updatedAt: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "useradmin_mast_users",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "useradmin_mast_users",
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "useradmin_mast_users",
    },
    cComments: {
      type: String,
    },
    oContactPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "leads_customer_details",
    },
    oStatus_Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "leads_master_statuses",
    },
    oUsercompanyId: { type: mongoose.Schema.Types.ObjectId },
    insuserv_companyId: {
      type: Number,
    },
    cCity: {
      type: String,
      // required: true,
    },
    cState: {
      type: String,
      // required: true,
    },
    cCountry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mast_countries",
      // required: true,
    },
    cAccountantFirstName: {
      type: String,
      // required: true,
    },
    cAccountantLastName: {
      type: String,
      // required: true,
    },
    cAccountingSoftware: {
      type: String,
      // required: true,
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
      payables: [{ type: String }],
      software: [{ type: String }],
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

// Apply audit plugin
CompanySchema.plugin(trackChangesPlugin, {
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
  module: 'mast_company_informations'
});

// 🔹 Pre-save hook to generate unique cCompanyCode
CompanySchema.pre("validate", async function (next) {
  try {
    if (this.isNew && !this.cCompanyCode) {
      // Count existing docs
      const count = await mongoose.model("mast_company_informations").countDocuments();

      // Generate new code ABG-01, ABG-02, ...
      this.cCompanyCode = `ABG-${String(count + 1).padStart(2, "0")}`;
    }
    next();
  } catch (err) {
    next(err);
  }
});
const masterCompanyModel = mongoose.model("mast_company_informations", CompanySchema);

module.exports = masterCompanyModel;