const mongoose = require("mongoose");
const { Schema } = mongoose;

const trackChangesPlugin = require("../../Service/trackChangePulgin.js");


const TemplateValueSchema = new Schema({
  cTransition_Name: {
    type: String,
    // required: true
  },
  oActivation_Id: {
    type: mongoose.Schema.Types.ObjectId,
  },
  oTask_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "transition_tasks",
  },
  transition_manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "useradmin_mast_users",
  },
  mappedPhaseTemplate_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Phase_Template_Master_Mappings",
  },
  opportunityDetails: [
    {
      opportunityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Phase_Template_Master_Mappings"
      },
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "leads_productcategory_product_mappings"
      },
    }
  ],
  transitionDetails: [
    {
      iSortOrder: {
        type: Number,
        // required: true,
      },
      oTemplateId: {
        type: Schema.Types.ObjectId,
        ref: "form_templates",
        // required: true,
      },
      oPhaseId: {
        type: Schema.Types.ObjectId,
        ref: "Transition_Mast_Phases",
        // required: true,
      },
      componentValues: {
        type: Schema.Types.Mixed,
      },
      KpiValues: {
        type: Schema.Types.Mixed,
      },
      tollgateValues: {
        type: Schema.Types.Mixed,
      },
      // templateData: {
      //   type: Schema.Types.Mixed,
      // },
    },
  ],
  phasesTableValues: {
    transitionPeriod: {
      startDate: { type: String },
      endDate: { type: String },
    },
    plannedGoLiveDate: { type: Date },
    overallComplianceTollGate: { type: Boolean },
    goLiveReadiness: { type: String },
  },
  summary: [
    {
      cPhaseId: {
        type: mongoose.Types.ObjectId,
        ref: "Transition_Mast_Phases"
      },
      checklist_score: {
        type: Number
      },
      kpi_score: {
        type: Number
      },
      tollgate_score: {
        type: Number
      },
    }
  ],
  ktPlanner: {
    type: Schema.Types.Mixed,
  },
  actionTracker: {
    type: Schema.Types.Mixed,
  },
  riskLogs: {
    type: Schema.Types.Mixed,
  },
  matrix: {
    type: Schema.Types.Mixed,
  },
  dCreatedAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  cCreatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "useradmin_mast_users",
  },
  dUpdatedAt: {
    type: Date,
  },
  cUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "useradmin_mast_users",
  },
  oUserCompanyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "mast_company_informations",
    required: true,
  },
  bActive: {
    type: Boolean,
    default: true,
  },
  reason: [
    {
      cNotes: {
        type: String
      },
      dCreatedAt: {
        type: Date,
        default: Date.now,
      },
      cCreatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "useradmin_mast_users",
      },
      statusId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "leads_master_statuses",
      },
      approvalNotes: {
        type: String
      },
      isStandalone: {
        type : Boolean,
        default : false
      }
    },
  ],
  oStatus_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "leads_master_statuses",
  },
  transitionNo: {
    type: String
  },
  actionOwner: [
    {
      actionOwnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "transition_action_owner",
      },
      users: [
        {
          type: mongoose.Schema.Types.ObjectId
        }
      ]
    }
  ],
  transition_logs: [
    {
      actionRequest: {
        type: Schema.Types.Mixed
      },
      groupId: { type: mongoose.Schema.Types.ObjectId },
      approvalId: { type: mongoose.Schema.Types.ObjectId },
      currentLevel: [
        {
          level: {
            type: String,
          },
          user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "useradmin_mast_users"
          },
          isApproved: {
            type: Boolean,
            default: false
          },
          isRejected: {
            type: Boolean,
            default: false
          },
          isCurrentLevel: {
            type: Boolean,
            default: false
          },
          isApproveReqMailSent: {
            type: Boolean,
            default: false
          },
        }
      ],
      statusId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "leads_master_statuses",
      },
      dCreatedAt: {
        type: Date,
        default: Date.now,
      },
      cCreatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "useradmin_mast_users",
      },
      comment: {
        type: String
      },
    },
  ]
});

// Pre-save middleware to ensure dUpdatedAt is updated
TemplateValueSchema.pre('save', function (next) {
  // this.dUpdatedAt = new Date();
  next();
});

// Apply the track changes plugin
TemplateValueSchema.plugin(trackChangesPlugin, {
  fieldsToTrack: [
    'oActivation_Id',
    'oTask_Id',
    'transition_manager',
    'mappedPhaseTemplate_Id',
    'opportunityDetails',
    'transitionDetails',
    'phasesTableValues',
    'summary',
    'cCreatedBy',
    'cUpdatedBy',
    'oUserCompanyId',
    'bActive',
    'reason',
    'oStatus_Id',
    'transitionNo'
  ],
  module: 'transition_phase_template_value_mappings'
});

const TransitionPhaseTemplateValueMappings = mongoose.model(
  "transition_phase_template_value_mappings",
  TemplateValueSchema
);

module.exports = TransitionPhaseTemplateValueMappings;
