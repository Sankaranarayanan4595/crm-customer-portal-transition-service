const mongoose = require("mongoose");
const axios = require("axios");

const {
  transitionMastPhasesRepo,
  transitionPhaseTemplateValueMappingsRepo,
  transitionCommentRepo,
  transitionMastTemplatesRepo,
  phaseTemplateMasterMappingsRepo,
  transitionTasksRepo,
  transitionMastActionOwnerRepo,
  mastCSATSurveyTemplatesRepo,
  csatValueMappingsRepo,
} = require("./transition.repository");

// Models (Mapped via repositories)
const TransitionMastPhases = transitionMastPhasesRepo.model;
const TransitionPhaseTemplateValueMappings = transitionPhaseTemplateValueMappingsRepo.model;
const TransitionComment = transitionCommentRepo.model;
const TransitionMastTemplates = transitionMastTemplatesRepo.model;
const PhaseTemplateMasterMappings = phaseTemplateMasterMappingsRepo.model;
const TransitionTasks = transitionTasksRepo.model;
const TransitionMastActionOwner = transitionMastActionOwnerRepo.model;
const MastCSATSurveyTemplates = mastCSATSurveyTemplatesRepo.model;
const CSATValueMappings = csatValueMappingsRepo.model;

// Other Models
const LeadsCustomerProductDetails = require("../../models/Leads-Customer-Products");
const LeadsOpportunityProductCompanyMappings = require("../../models/Leads_Opportunity_Product_Company_mappings");
const Employee = require("../../models/userEmployee");
const LeadsCustomerDetails = require("../../models/Leads-Customers");
const LeadsActivationStatus = require("../../models/Leads-Mast-Activation-Status.js");
const masterCompanyModel = require("../../models/masterCompanyModel");
const LeadCompanyDetails = require("../../models/Leads-Company");
const CRMApprovalSetting = require("../../models/CRM_Approval_Setting.js");
const User = require("../../models/userModel.js");
const RunningNumberSetting = require("../../models/running-number.model");

// Services/Helpers
const emailService = require("../common");
const { getStatusById } = require("../common");
const { auditLogs } = require("../../utils/logger");

// Helper function definitions
function generateGroupId() {
  return new mongoose.Types.ObjectId();
}

async function transitionWebSocketDataRefresh(id, userId) {
  const pipeline = [
    {
      $match: {
        _id: mongoose.Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "leads_customer_product_details",
        localField: "oActivation_Id",
        foreignField: "_id",
        as: "leads_product_mapping",
      },
    },
    {
      $unwind: {
        path: "$leads_product_mapping",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "mast_company_informations",
        localField: "leads_product_mapping.oCompany_Id",
        foreignField: "_id",
        as: "company_details",
      },
    },
    { $unwind: { path: "$company_details", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "leads_productcategory_product_mappings",
        localField: "leads_product_mapping.oProductCategory_Product_Mapping_Id",
        foreignField: "_id",
        as: "product_details",
      },
    },
    { $unwind: { path: "$product_details", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "leads_categories",
        localField: "leads_product_mapping.oCategory_Id",
        foreignField: "_id",
        as: "category_details",
      },
    },
    {
      $unwind: { path: "$category_details", preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: "transition_mast_phases",
        localField: "transitionDetails.oPhaseId",
        foreignField: "_id",
        as: "phase_info",
      },
    },
    {
      $lookup: {
        from: "transition_mast_comments",
        localField: "_id",
        foreignField: "transitionId",
        as: "transition_comments",
      },
    },
    {
      $lookup: {
        from: "useradmin_mast_users",
        localField: "transition_comments.cCreatedBy",
        foreignField: "_id",
        as: "comment_users",
      },
    },
    {
      $lookup: {
        from: "useradmin_mast_users",
        localField: "cUpdatedBy",
        foreignField: "_id",
        as: "latest_updateuser",
      },
    },
    {
      $unwind: { path: "$latest_updateuser", preserveNullAndEmptyArrays: true },
    },
    {
      $project: {
        _id: 1,
        oActivation_Id: 1,
        transition_manager: 1,
        transitionDetails: 1,
        phasesTableValues: 1,
        dCreatedAt: 1,
        cCreatedBy: 1,
        dUpdatedAt: {
          $dateToString: { format: "%d/%m/%Y", date: "$dUpdatedAt" },
        },
        cUpdatedBy: 1,
        oUserCompanyId: 1,
        bActive: 1,
        lastUpdatedBy: "$latest_updateuser.loginName",
        cCompanyName: "$company_details.company_name",
        cProductName: "$product_details.cFeaturesDesc",
        cCategory_Name: "$category_details.cCategory_Name",
        phase_info: {
          $map: {
            input: "$phase_info",
            as: "phase",
            in: {
              _id: "$$phase._id",
              cPhaseName: "$$phase.cPhaseName",
            },
          },
        },
        transition_comments: {
          $map: {
            input: "$transition_comments",
            as: "comment",
            in: {
              type: "$$comment.type",
              key: "$$comment.key",
              cComment: "$$comment.cComment",
              oTemplateId: "$$comment.oTemplateId",
              cCreatedById: "$$comment.cCreatedBy",
              isCurrentUser: {
                $eq: [
                  "$$comment.cCreatedBy",
                  userId ? mongoose.Types.ObjectId(userId) : null
                ]
              },
              cCreatedBy: {
                $let: {
                  vars: {
                    user: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$comment_users",
                            as: "u",
                            cond: {
                              $eq: ["$$u._id", "$$comment.cCreatedBy"]
                            }
                          }
                        },
                        0
                      ]
                    }
                  },
                  in: "$$user.loginName"
                }
              },
              cCreatedAt: "$$comment.dCreatedAt",
            }
          }
        }
      },
    },
  ];

  const [template] = await TransitionPhaseTemplateValueMappings.aggregate(pipeline);
  return template;
}

function applyDynamicKeysAndClasses(component, value, field, phase) {
  if (Array.isArray(component)) {
    return component.map((c) => applyDynamicKeysAndClasses(c, value, field, phase));
  } else if (typeof component === "object" && component !== null) {
    const updated = {};
    for (const key in component) {
      if (typeof component[key] === "object") {
        updated[key] = applyDynamicKeysAndClasses(component[key], value, field, phase);
      } else if (key === "key") {
        if (component[key] === 'commentIconBtn') {
          updated[key] = `${component[key]}_${field}${value} ${phase}`;
        } else {
          updated[key] = `${component[key]}_${field}${value}`;
        }
      } else if (key === "customClass" && component[key] !== "status") {
        updated[key] = `${component[key]} ${component[key]}_${field}${value}`;
      } else {
        updated[key] = component[key];
      }
    }
    return updated;
  }
  return component;
}

function newApplyDynamicKeysAndClasses(component, value, field) {
  if (Array.isArray(component)) {
    return component.map((c) => newApplyDynamicKeysAndClasses(c, value, field));
  } else if (typeof component === "object" && component !== null) {
    const updated = {};
    for (const key in component) {
      if (typeof component[key] === "object") {
        updated[key] = newApplyDynamicKeysAndClasses(component[key], value, field);
      } else if (key === "key") {
        if (["Phases", "portal_action", "kpi_portal_action", "tollgate_portal_action", "outcome", "kpi_outcome"].includes(component[key])) {
          const convert = value?.split(" ");
          if (convert) {
            updated[key] = `${component[key]}_${field}${convert[0]}${convert[1]}`;
          } else {
            updated[key] = `${component[key]}_${field}${value}`;
          }
        } else {
          updated[key] = `${component[key]}_${field}${value}`;
        }
      } else if (key === "customClass" && component[key] !== "status") {
        updated[key] = `${component[key]} ${component[key]}_${field}${value}`;
      } else {
        updated[key] = component[key];
      }
    }
    return updated;
  }
  return component;
}

function calculateIndividualScore(userResponse) {
  if (
    !userResponse.isSubmitted ||
    !userResponse.response ||
    typeof userResponse.response !== "object"
  ) {
    return null;
  }
  let userScore = 0;
  let questionCount = 0;
  Object.keys(userResponse.response).forEach((key) => {
    if (key.startsWith("survey_rating_")) {
      const rating = userResponse.response[key];
      const numericRating = parseInt(rating);
      if (!isNaN(numericRating) && numericRating >= 1 && numericRating <= 5) {
        userScore += numericRating;
        questionCount++;
      }
    }
  });
  if (questionCount === 0) return null;
  return (userScore / (questionCount * 5)) * 100;
}

function calculateScoreFromMapping(surveyMapping) {
  const responses = surveyMapping.recipients_response;
  if (!responses || responses.length === 0) return 0;
  let totalScore = 0;
  let validResponses = 0;
  responses.forEach((userResponse) => {
    if (
      userResponse.isSubmitted &&
      userResponse.response &&
      typeof userResponse.response === "object"
    ) {
      let userScore = 0;
      let questionCount = 0;
      let hasRatings = false;
      Object.keys(userResponse.response).forEach((key) => {
        if (key.startsWith("survey_rating_")) {
          const rating = userResponse.response[key];
          if (rating !== null && rating !== undefined && rating !== "N/A") {
            const numericRating = parseInt(rating);
            if (
              !isNaN(numericRating) &&
              numericRating >= 1 &&
              numericRating <= 5
            ) {
              userScore += numericRating;
              questionCount++;
              hasRatings = true;
            }
          }
        }
      });
      if (hasRatings && questionCount > 0) {
        totalScore += (userScore / (questionCount * 5)) * 100;
        validResponses++;
      }
    }
  });
  return validResponses > 0 ? totalScore / validResponses : 0;
}

class TransitionService {
  // Helpers exposed on class
  async transitionWebSocketDataRefresh(id, userId) {
    return transitionWebSocketDataRefresh(id, userId);
  }

  // --- Phases & Master ---
  async createPhases(body, tokenDetails) {
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const idofuser = tokenDetails.idofuser;
    const Phases = new TransitionMastPhases({
      ...body,
      oUserCompanyId: mongoose.Types.ObjectId(selectedCompanyId),
      cCreatedBy: idofuser,
    });
    await Phases.save();
    return Phases;
  }

  async getAllPhases(tokenDetails) {
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    return TransitionMastPhases.find({ oUserCompanyId: mongoose.Types.ObjectId(selectedCompanyId) });
  }

  async getAllBActivePhases(tokenDetails) {
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    return TransitionMastPhases.find({ oUserCompanyId: mongoose.Types.ObjectId(selectedCompanyId), bActive: true });
  }

  async getPhaseById(id) {
    return TransitionMastPhases.findById(id);
  }

  async updatePhase(id, body, tokenDetails) {
    const idofuser = tokenDetails.idofuser;
    return TransitionMastPhases.findByIdAndUpdate(
      id,
      {
        ...body,
        cModifiedBy: idofuser,
        dModifiedDate: new Date(),
      },
      { new: true }
    );
  }

  async deletePhase(id) {
    return TransitionMastPhases.findByIdAndUpdate(id, { bActive: false }, { new: true });
  }

  async getByIdTemplateMapping(id, tokenDetails) {
    const idofuser = tokenDetails.idofuser;
    const transition_completed = await getStatusById("Transition", "transition_completed");
    const transition_new = await getStatusById("Transition", "transition_new");
    const transition_cancel = await getStatusById("Transition", "transition_cancel");
    const transition_hold = await getStatusById("Transition", "transition_hold");
    const transition_in_progress = await getStatusById("Transition", "transition_in_progress");
    const approval_pending = await getStatusById("Transition", "transition_approval_pending");

    const pipeline = [
      { $match: { _id: mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "leads_customer_product_details",
          localField: "oActivation_Id",
          foreignField: "_id",
          as: "leads_product_mapping",
        },
      },
      { $unwind: { path: "$leads_product_mapping", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "mast_company_informations",
          localField: "leads_product_mapping.oCompany_Id",
          foreignField: "_id",
          as: "lead_company",
        },
      },
      { $unwind: { path: "$lead_company", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_opportunity_product_company_mappings",
          localField: "opportunityDetails.opportunityId",
          foreignField: "_id",
          as: "opp_details",
        },
      },
      { $unwind: { path: "$opp_details", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "mast_company_informations",
          localField: "opp_details.oCompany_Id",
          foreignField: "_id",
          as: "opp_company_details",
        },
      },
      { $unwind: { path: "$opp_company_details", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_company_details",
          localField: "opp_details.oCompany_Id",
          foreignField: "_id",
          as: "opp_leads_company_details",
        },
      },
      { $unwind: { path: "$opp_leads_company_details", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_productcategory_product_mappings",
          localField: "leads_product_mapping.oProductCategory_Product_Mapping_Id",
          foreignField: "_id",
          as: "product_details",
        },
      },
      { $unwind: { path: "$product_details", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_productcategory_product_mappings",
          localField: "opportunityDetails.productId",
          foreignField: "_id",
          as: "opp_product_details",
        },
      },
      { $unwind: { path: "$opp_product_details", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_categories",
          localField: "leads_product_mapping.oCategory_Id",
          foreignField: "_id",
          as: "category_details",
        },
      },
      { $unwind: { path: "$category_details", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "transition_tasks",
          localField: "oTask_Id",
          foreignField: "_id",
          as: "task_details",
        },
      },
      { $unwind: { path: "$task_details", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "transition_mast_phases",
          localField: "transitionDetails.oPhaseId",
          foreignField: "_id",
          as: "phase_info",
        },
      },
      {
        $lookup: {
          from: "transition_mast_comments",
          localField: "_id",
          foreignField: "transitionId",
          as: "transition_comments",
        },
      },
      {
        $lookup: {
          from: "useradmin_mast_users",
          localField: "transition_comments.cCreatedBy",
          foreignField: "_id",
          as: "comment_users",
        },
      },
      {
        $lookup: {
          from: "useradmin_mast_users",
          localField: "cUpdatedBy",
          foreignField: "_id",
          as: "latest_updateuser",
        },
      },
      { $unwind: { path: "$latest_updateuser", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          root: { $first: "$$ROOT" },
          oppProductNames: { $addToSet: "$opp_product_details.cFeaturesDesc" },
        },
      },
      {
        $addFields: {
          "root.oppProductNames": {
            $filter: {
              input: "$oppProductNames",
              as: "name",
              cond: { $ne: ["$$name", null] },
            },
          },
        },
      },
      { $replaceRoot: { newRoot: "$root" } },
      {
        $set: {
          cProductName: {
            $cond: [
              { $gt: [{ $size: "$oppProductNames" }, 0] },
              {
                $reduce: {
                  input: "$oppProductNames",
                  initialValue: "",
                  in: {
                    $concat: [
                      "$$value",
                      { $cond: [{ $eq: ["$$value", ""] }, "", ", "] },
                      "$$this"
                    ]
                  }
                }
              },
              { $ifNull: ["$product_details.cFeaturesDesc", ""] }
            ]
          }
        }
      },
      {
        $lookup: {
          from: "leads_master_statuses",
          localField: "reason.statusId",
          foreignField: "_id",
          as: "statusDetails"
        }
      },
      {
        $lookup: {
          from: "useradmin_mast_users",
          localField: "reason.cCreatedBy",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $addFields: {
          reason: {
            $map: {
              input: "$reason",
              as: "r",
              in: {
                cNotes: "$$r.cNotes",
                approvalNotes: "$$r.approvalNotes",
                isStandalone: "$$r.isStandalone",
                dCreatedAt: "$$r.dCreatedAt",
                statusId: "$$r.statusId",
                statusName: {
                  $let: {
                    vars: {
                      status: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$statusDetails",
                              as: "s",
                              cond: { $eq: ["$$s._id", "$$r.statusId"] }
                            }
                          },
                          0
                        ]
                      }
                    },
                    in: "$$status.cStatus_Name"
                  }
                },
                cCreatedBy: "$$r.cCreatedBy",
                userName: {
                  $let: {
                    vars: {
                      user: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$userDetails",
                              as: "u",
                              cond: { $eq: ["$$u._id", "$$r.cCreatedBy"] }
                            }
                          },
                          0
                        ]
                      }
                    },
                    in: "$$user.loginName"
                  }
                }
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: "form_templates",
          localField: "transitionDetails.oTemplateId",
          foreignField: "_id",
          as: "template_info",
        },
      },
      {
        $addFields: {
          isAdminEdit: {
            $in: [
              mongoose.Types.ObjectId(idofuser),
              {
                $cond: [
                  { $isArray: "$transition_manager" },
                  "$transition_manager",
                  {
                    $cond: [
                      { $ne: ["$transition_manager", null] },
                      ["$transition_manager"],
                      []
                    ]
                  }
                ]
              }
            ]
          }
        },
      },
      {
        $project: {
          _id: 1,
          isAdminEdit: 1,
          oActivation_Id: 1,
          actionOwner: 1,
          oTask_Id: 1,
          transition_manager: 1,
          reason: "$reason",
          transitionDetails: 1,
          ktPlanner: 1,
          actionTracker: 1,
          riskLogs: 1,
          matrix: 1,
          phasesTableValues: 1,
          cTransition_Name: 1,
          dCreatedAt: 1,
          cCreatedBy: 1,
          dUpdatedAt: { $dateToString: { format: "%d/%m/%Y", date: "$dUpdatedAt" } },
          cUpdatedBy: 1,
          lastUpdatedBy: "$latest_updateuser.loginName",
          oUserCompanyId: 1,
          bActive: 1,
          transitionNo: 1,
          cCompanyName: {
            $ifNull: [
              "$opp_company_details.company_name",
              {
                $ifNull: [
                  "$opp_leads_company_details.company_name",
                  "$lead_company.company_name"
                ]
              }
            ]
          },
          cCompany_Id: {
            $ifNull: [
              "$opp_company_details._id",
              {
                $ifNull: [
                  "$opp_leads_company_details._id",
                  "$lead_company._id"
                ]
              }
            ]
          },
          cProductName: "$cProductName",
          cCategory_Name: "$category_details.cCategory_Name",
          phase_info: "$phase_info",
          task_details: "$task_details",
          template_info: "$template_info",
          transition_comments: {
            $map: {
              input: "$transition_comments",
              as: "comment",
              in: {
                type: "$$comment.type",
                key: "$$comment.key",
                cComment: "$$comment.cComment",
                oTemplateId: "$$comment.oTemplateId",
                cCreatedById: "$$comment.cCreatedBy",
                isCurrentUser: {
                  $eq: ["$$comment.cCreatedBy", mongoose.Types.ObjectId(idofuser)]
                },
                cCreatedBy: {
                  $let: {
                    vars: {
                      user: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$comment_users",
                              as: "u",
                              cond: { $eq: ["$$u._id", "$$comment.cCreatedBy"] }
                            }
                          },
                          0
                        ]
                      }
                    },
                    in: "$$user.loginName"
                  }
                },
                cCreatedAt: "$$comment.dCreatedAt",
              }
            }
          },
          transition_completed: {
            $cond: {
              if: { $in: ["$oStatus_Id", [mongoose.Types.ObjectId(transition_completed)]] },
              then: true,
              else: false
            }
          },
          isHold: {
            $cond: {
              if: { $in: ["$oStatus_Id", [mongoose.Types.ObjectId(transition_hold)]] },
              then: true,
              else: false
            }
          },
          isCancel: {
            $cond: {
              if: { $in: ["$oStatus_Id", [mongoose.Types.ObjectId(transition_cancel)]] },
              then: true,
              else: false
            }
          },
          isNew: {
            $cond: {
              if: { $in: ["$oStatus_Id", [mongoose.Types.ObjectId(transition_new)]] },
              then: true,
              else: false
            }
          },
          isInProgress: {
            $cond: {
              if: { $in: ["$oStatus_Id", [mongoose.Types.ObjectId(transition_in_progress)]] },
              then: true,
              else: false
            }
          },
          isActiveTransition: {
            $cond: {
              if: {
                $in: [
                  "$oStatus_Id",
                  [
                    mongoose.Types.ObjectId(transition_completed),
                    mongoose.Types.ObjectId(transition_cancel),
                    mongoose.Types.ObjectId(transition_hold),
                    mongoose.Types.ObjectId(transition_new),
                  ]
                ]
              },
              then: true,
              else: false
            }
          },
          isApprovalPending: {
            $cond: {
              if: { $in: ["$oStatus_Id", [mongoose.Types.ObjectId(approval_pending)]] },
              then: true,
              else: false
            }
          },
        },
      },
    ];
    const [template] = await TransitionPhaseTemplateValueMappings.aggregate(pipeline);
    return template;
  }

  async getByIdTransitionComments(body, tokenDetails, io) {
    const { transitionId, key, type, templateId } = body;
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const idofuser = tokenDetails.idofuser;
    let match = {
      key,
      transitionId: mongoose.Types.ObjectId(transitionId),
    };
    if (templateId) {
      match.oTemplateId = mongoose.Types.ObjectId(templateId);
    } else {
      match.type = type;
    }

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: "useradmin_mast_users",
          localField: "cCreatedBy",
          foreignField: "_id",
          as: "createdByDetails",
        },
      },
      { $unwind: { path: "$createdByDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          cComment: 1,
          key: 1,
          userName: "$createdByDetails.loginName",
          dCreatedAt: 1,
          dUpdatedAt: 1,
          isCurrentUser: {
            $eq: ["$createdByDetails._id", mongoose.Types.ObjectId(idofuser)],
          },
        },
      },
    ];

    const comments = await TransitionComment.aggregate(pipeline);
    const template = await transitionWebSocketDataRefresh(transitionId, idofuser);
    if (io) {
      io.emit('template-updated', template);
    }
    return comments;
  }

  async createTransitionComment(body, tokenDetails) {
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const idofuser = tokenDetails.idofuser;
    const comment = new TransitionComment({
      ...body,
      cCreatedBy: mongoose.Types.ObjectId(idofuser),
      oUserCompanyId: mongoose.Types.ObjectId(selectedCompanyId),
    });
    return comment.save();
  }

  async updateTransitionComment(id, body, tokenDetails) {
    const idofuser = tokenDetails.idofuser;
    const newComment = body.cComment;
    const existingComment = await TransitionComment.findById(id);
    if (!existingComment) {
      throw new Error("Comment not found");
    }
    if (existingComment.cCreatedBy.toString() !== idofuser.toString()) {
      throw new Error("Unauthorized to update comment");
    }
    existingComment.cComment = newComment;
    existingComment.dUpdatedAt = new Date();
    existingComment.cUpdatedBy = idofuser;
    return existingComment.save();
  }

  async deleteTransitionComment(id, tokenDetails) {
    const idofuser = tokenDetails.idofuser;
    const existingComment = await TransitionComment.findById(id);
    if (!existingComment) {
      throw new Error("Comment not found");
    }
    if (existingComment.cCreatedBy.toString() !== idofuser.toString()) {
      throw new Error("Unauthorized to delete comment");
    }
    await TransitionComment.deleteOne({ _id: id });
    return true;
  }

  async getAllTransitionTemplates() {
    const all_templates = await TransitionMastTemplates.find();
    return all_templates
      ?.filter((val) => val.components?.some((comp) => comp.key?.startsWith('phases_')))
      ?.map((item) => ({
        templateName: item?.templateName,
        _id: item?._id,
      }));
  }

  async getAllPhasesTemplatesMasterMapped() {
    return PhaseTemplateMasterMappings.find();
  }

  async getAllPhasesTemplatesBActiveMasterMapped() {
    return PhaseTemplateMasterMappings.find({ bActive: true });
  }

  async savePhasesTemplateMasterMapping(body, tokenDetails) {
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const idofuser = tokenDetails.idofuser;
    const { isEdited, editedID, ...restBody } = body;
    let result = null;

    if (isEdited === true && editedID) {
      result = await PhaseTemplateMasterMappings.findByIdAndUpdate(
        editedID,
        {
          ...restBody,
          oUserCompanyId: mongoose.Types.ObjectId(selectedCompanyId),
          cUpdatedBy: idofuser,
          dUpdatedAt: new Date(),
        },
        { new: true }
      );

      const getAllMappedTransition = await TransitionPhaseTemplateValueMappings.find({
        mappedPhaseTemplate_Id: mongoose.Types.ObjectId(editedID),
      });

      for (let transition of getAllMappedTransition) {
        const updatedTransitionDetails = result.transitionDetails.map((mappedItem) => {
          const existingItem = transition.transitionDetails?.find(
            (item) => item.oTemplateId.toString() === mappedItem.oTemplateId
          );
          return {
            _id: existingItem?._id || new mongoose.Types.ObjectId(),
            iSortOrder: mappedItem.iSortOrder || 1,
            oTemplateId: new mongoose.Types.ObjectId(mappedItem.oTemplateId),
            cTemplateName: mappedItem.cTemplateName,
            oPhaseId: new mongoose.Types.ObjectId(mappedItem.oPhaseId),
            cPhaseName: mappedItem.cPhaseName,
            componentValues: existingItem?.componentValues || {},
            KpiValues: existingItem?.KpiValues || {},
            tollgateValues: existingItem?.tollgateValues || {},
          };
        });

        await TransitionPhaseTemplateValueMappings.findByIdAndUpdate(
          transition._id,
          { transitionDetails: updatedTransitionDetails },
          { new: true }
        );
      }
    } else {
      const transition = new PhaseTemplateMasterMappings({
        ...restBody,
        oUserCompanyId: mongoose.Types.ObjectId(selectedCompanyId),
        cCreatedBy: idofuser,
      });
      result = await transition.save();
    }
    return result;
  }

  async deletePhasesTemplateMasterMapping(id) {
    return PhaseTemplateMasterMappings.findByIdAndUpdate(id, { bActive: false }, { new: true });
  }

  async getProductMappedtoTransition(mappedID) {
    const transitionMappings = await TransitionPhaseTemplateValueMappings.find({
      mappedPhaseTemplate_Id: { $in: mappedID },
    });
    return {
      isMapped: transitionMappings.length > 0,
      transitionCount: transitionMappings.length,
    };
  }

  // --- Tasks ---
  async createTransitionTask(body, tokenDetails) {
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const idofuser = tokenDetails.idofuser;
    const task = new TransitionTasks({
      ...body,
      dCreatedAt: new Date(),
      cCreatedBy: idofuser,
      oUserCompanyId: selectedCompanyId,
      oTaskStatus: process.env.INVOICE_NEW,
    });
    return task.save();
  }

  async getAllTransitionTasks(tokenDetails) {
    const ObjectId = mongoose.Types.ObjectId;
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const transition_completed = await getStatusById("Transition", "transition_completed");
    const transition_new = await getStatusById("Transition", "transition_new");
    const transition_cancel = await getStatusById("Transition", "transition_cancel");
    const transition_hold = await getStatusById("Transition", "transition_hold");
    const transition_in_progress = await getStatusById("Transition", "transition_in_progress");

    const pipeline = [
      { $match: { oUserCompanyId: new ObjectId(selectedCompanyId) } },
      {
        $lookup: {
          from: "leads_master_statuses",
          localField: "oTaskStatus",
          foreignField: "_id",
          as: "statusDetails",
        },
      },
      { $unwind: { path: "$statusDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "useradmin_mast_users",
          localField: "cCreatedBy",
          foreignField: "_id",
          as: "createdByDetails",
        },
      },
      { $unwind: { path: "$createdByDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "transition_phase_template_value_mappings",
          localField: "_id",
          foreignField: "oTask_Id",
          as: "transition_details",
        },
      },
      {
        $lookup: {
          from: "transition_company_survey_mappings",
          localField: "_id",
          foreignField: "oTask_Id",
          as: "survey_details",
        },
      },
      {
        $addFields: {
          formattedCreateDate: { $dateToString: { format: "%m/%d/%Y", date: "$dCreatedAt" } },
          formattedUpdateDate: { $dateToString: { format: "%m/%d/%Y %H:%M", date: "$dUpdatedAt" } },
        },
      },
      {
        $project: {
          _id: 1,
          cTaskName: 1,
          cTaskDescription: 1,
          dCreatedAt: 1,
          cCreatedBy: 1,
          dUpdatedAt: 1,
          cUpdatedBy: 1,
          oUserCompanyId: 1,
          formattedCreateDate: 1,
          formattedUpdateDate: 1,
          bActive: 1,
          cssClass: "$iconDetails.cssClass",
          status: "$statusDetails.cStatus_Name",
          className: "$statusDetails.className",
          loginName: { $ifNull: ["$createdByDetails.loginName", ""] },
          surveyMappedId: { $arrayElemAt: ["$survey_details._id", 0] },
          isSurvey: { $gt: [{ $size: "$survey_details" }, 0] },
          isTransition: { $gt: [{ $size: "$transition_details" }, 0] },
          summary: { $arrayElemAt: ["$transition_details.summary", 0] },
          surveyResponse: {
            $map: {
              input: "$survey_details",
              as: "survey",
              in: "$$survey.recipients_response",
            },
          },
          transitionId: { $arrayElemAt: ["$transition_details._id", 0] },
          transition_completed: { $in: ["$oTaskStatus", [mongoose.Types.ObjectId(transition_completed)]] },
          isHold: { $in: ["$oTaskStatus", [mongoose.Types.ObjectId(transition_hold)]] },
          isCancel: { $in: ["$oTaskStatus", [mongoose.Types.ObjectId(transition_cancel)]] },
          isNew: { $in: ["$oTaskStatus", [mongoose.Types.ObjectId(transition_new)]] },
          isInProgress: { $in: ["$oTaskStatus", [mongoose.Types.ObjectId(transition_in_progress)]] }
        },
      },
    ];

    return TransitionTasks.aggregate(pipeline);
  }

  async getTransitionTaskById(id) {
    return TransitionTasks.findById(id)
      .populate("cCreatedBy", "username email")
      .populate("cUpdatedBy", "username email")
      .populate("oUserCompanyId", "companyName");
  }

  async updateTransitionTask(id, body) {
    return TransitionTasks.findByIdAndUpdate(
      id,
      { ...body, dUpdatedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  async deleteTransitionTask(id) {
    return TransitionTasks.findByIdAndDelete(id);
  }

  // --- Load Opportunity/Transitions ---
  async loadOpportunityForTransition(tokenDetails) {
    const ObjectId = mongoose.Types.ObjectId;
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const opportunity_Leads = await getStatusById("Opportunity", "opportunity_Leads");
    const opportunity_Inactive = await getStatusById("Opportunity", "opportunity_Inactive");

    const pipeline = [
      {
        $match: {
          oUserCompany_Id: ObjectId(selectedCompanyId),
          "stageChangeLogs.oOpportunityStage": {
            $nin: [
              mongoose.Types.ObjectId(opportunity_Leads),
              mongoose.Types.ObjectId(opportunity_Inactive)
            ]
          },
          bActive: true,
          isTransition: false,
        }
      },
      {
        $lookup: {
          from: "leads_company_details",
          localField: "oCompany_Id",
          foreignField: "_id",
          as: "lead_company"
        }
      },
      { $unwind: { path: "$lead_company", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "mast_company_informations",
          localField: "oCompany_Id",
          foreignField: "_id",
          as: "mast_company"
        }
      },
      { $unwind: { path: "$mast_company", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_productcategory_product_mappings",
          localField: "ProductDetails.oProductCategory_Product_Mapping_Id",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $lookup: {
          from: "leads_categories",
          let: { categoryIds: "$product.oCategoryID" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$categoryIds"] } } }
          ],
          as: "class"
        }
      },
      {
        $lookup: {
          from: "leads_subclasses",
          let: { subClassIds: "$product.oSubClass" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$subClassIds"] } } }
          ],
          as: "subClass"
        }
      },
      {
        $addFields: {
          latestStageLog: {
            $arrayElemAt: [
              {
                $sortArray: {
                  input: "$stageChangeLogs",
                  sortBy: { dStageChangeDate: -1 }
                }
              },
              0
            ]
          }
        }
      },
      {
        $lookup: {
          from: "leads_master_statuses",
          localField: "latestStageLog.oOpportunityStage",
          foreignField: "_id",
          as: "company_status"
        }
      },
      { $unwind: { path: "$company_status", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "useradmin_mast_users",
          localField: "oOpportunity_Owner",
          foreignField: "_id",
          as: "opp_owner_details"
        }
      },
      { $unwind: { path: "$opp_owner_details", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "useradmin_mast_users",
          localField: "cCreatedBy",
          foreignField: "_id",
          as: "createdByDetails"
        }
      },
      { $unwind: { path: "$createdByDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "transition_phase_template_value_mappings",
          let: { opportunityId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: [
                    "$$opportunityId",
                    {
                      $map: {
                        input: { $ifNull: ["$opportunityDetails", []] },
                        as: "od",
                        in: "$$od.opportunityId"
                      }
                    }
                  ]
                }
              }
            }
          ],
          as: "transition_details"
        }
      },
      { $lookup: { from: "leads_billing_units", pipeline: [], as: "billingUnits" } },
      { $lookup: { from: "crm_mast_levels", pipeline: [], as: "levels" } },
      {
        $addFields: {
          productDetails: {
            $map: {
              input: { $ifNull: ["$product", []] },
              as: "prod",
              in: {
                productId: "$$prod._id",
                cDisplayName: "$$prod.cDisplayName",
                cFeaturesDesc: "$$prod.cFeaturesDesc",
                isTransition: {
                  $gt: [
                    {
                      $size: {
                        $filter: {
                          input: {
                            $reduce: {
                              input: { $ifNull: ["$transition_details", []] },
                              initialValue: [],
                              in: {
                                $concatArrays: [
                                  "$$value",
                                  { $ifNull: ["$$this.opportunityDetails", []] }
                                ]
                              }
                            }
                          },
                          as: "td",
                          cond: { $eq: ["$$td.productId", "$$prod._id"] }
                        }
                      }
                    },
                    0
                  ]
                },
                oBilling_Unit: {
                  $let: {
                    vars: {
                      orig: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: { $ifNull: ["$ProductDetails", []] },
                              as: "pd",
                              cond: {
                                $eq: [
                                  "$$pd.oProductCategory_Product_Mapping_Id",
                                  "$$prod._id"
                                ]
                              }
                            }
                          },
                          0
                        ]
                      }
                    },
                    in: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$billingUnits",
                            as: "bu",
                            cond: { $eq: ["$$bu._id", "$$orig.oBilling_Unit"] }
                          }
                        },
                        0
                      ]
                    }
                  }
                },
                oProduct_Level: {
                  $let: {
                    vars: {
                      orig: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: { $ifNull: ["$ProductDetails", []] },
                              as: "pd",
                              cond: {
                                $eq: [
                                  "$$pd.oProductCategory_Product_Mapping_Id",
                                  "$$prod._id"
                                ]
                              }
                            }
                          },
                          0
                        ]
                      }
                    },
                    in: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$levels",
                            as: "lvl",
                            cond: { $eq: ["$$lvl._id", "$$orig.oLevel"] }
                          }
                        },
                        0
                      ]
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: "leads_master_statuses",
          let: { statusIds: "$transition_details.oStatus_Id" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$statusIds"] } } }
          ],
          as: "transition_status"
        }
      },
      { $unwind: { path: "$transition_status", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          cOpportunityName: { $first: "$cOpportunityName" },
          cDescription: { $first: "$cDescription" },
          productNames: {
            $addToSet: {
              $reduce: {
                input: "$product.cDisplayName",
                initialValue: "",
                in: {
                  $cond: [
                    { $eq: ["$$value", ""] },
                    "$$this",
                    { $concat: ["$$value", ", ", "$$this"] }
                  ]
                }
              }
            }
          },
          productDetails: { $first: "$productDetails" },
          cate_className: { $first: "$class.cCategory_Name" },
          subClassName: { $first: "$subClass.cSubClassName" },
          opportunityStatus: { $first: "$company_status.cStatus_Name" },
          opportunityStatusId: { $first: "$company_status._id" },
          opportunityClassName: { $first: "$company_status.className" },
          accountOwner: { $first: "$opp_owner_details.loginName" },
          accountOwnerId: { $first: "$opp_owner_details._id" },
          transitionStatus: { $first: "$transition_status.cStatus_Name" },
          transitionClassName: { $first: "$transition_status.className" },
          AccountName: {
            $first: { $ifNull: ["$mast_company.company_name", "$lead_company.company_name"] }
          },
          AccountId: {
            $first: { $ifNull: ["$mast_company._id", "$lead_company._id"] }
          },
          transitionId: { $first: { $arrayElemAt: ["$transition_details._id", 0] } },
          dCreateDateAt: { $first: "$dCreateDateAt" },
          createdBy: { $first: "$createdByDetails.loginName" },
          createdById: { $first: "$createdByDetails._id" }
        }
      },
      { $sort: { dCreateDateAt: -1 } }
    ];

    return LeadsOpportunityProductCompanyMappings.aggregate(pipeline);
  }

  async loadExistingTransition(tokenDetails) {
    const ObjectId = mongoose.Types.ObjectId;
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const transition_completed = await getStatusById("Transition", "transition_completed");
    const transition_new = await getStatusById("Transition", "transition_new");
    const transition_cancel = await getStatusById("Transition", "transition_cancel");
    const transition_hold = await getStatusById("Transition", "transition_hold");
    const transition_in_progress = await getStatusById("Transition", "transition_in_progress");
    const approval_pending = await getStatusById("Transition", "transition_approval_pending");

    const pipeline = [
      {
        $match: {
          oUserCompanyId: new ObjectId(selectedCompanyId),
        },
      },
      { $unwind: "$opportunityDetails" },
      {
        $lookup: {
          from: "leads_opportunity_product_company_mappings",
          localField: "opportunityDetails.opportunityId",
          foreignField: "_id",
          as: "opportunity"
        }
      },
      { $unwind: { path: "$opportunity", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "phase_template_master_mappings",
          localField: "mappedPhaseTemplate_Id",
          foreignField: "_id",
          as: "mappedProcess"
        }
      },
      { $unwind: { path: "$mappedProcess", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_company_details",
          localField: "opportunity.oCompany_Id",
          foreignField: "_id",
          as: "lead_company"
        }
      },
      { $unwind: { path: "$lead_company", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "mast_company_informations",
          localField: "opportunity.oCompany_Id",
          foreignField: "_id",
          as: "mast_company",
        },
      },
      { $unwind: { path: "$mast_company", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_productcategory_product_mappings",
          localField: "opportunityDetails.productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_categories",
          localField: "product.oCategoryID",
          foreignField: "_id",
          as: "class"
        }
      },
      { $unwind: { path: "$class", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_subclasses",
          localField: "product.oSubClass",
          foreignField: "_id",
          as: "subClass"
        }
      },
      { $unwind: { path: "$subClass", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_billing_units",
          localField: "product.cBillingUnit",
          foreignField: "_id",
          as: "billingUnit"
        }
      },
      { $unwind: { path: "$billingUnit", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "crm_mast_levels",
          localField: "product.oProductLevel",
          foreignField: "_id",
          as: "crm_mast_levels"
        }
      },
      { $unwind: { path: "$crm_mast_levels", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_master_statuses",
          localField: "oStatus_Id",
          foreignField: "_id",
          as: "transition_status",
        },
      },
      { $unwind: { path: "$transition_status", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "transition_company_survey_mappings",
          localField: "_id",
          foreignField: "transitionId",
          as: "survey_details",
        },
      },
      { $unwind: { path: "$survey_details", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "useradmin_mast_users",
          localField: "transition_manager",
          foreignField: "_id",
          as: "transition_manager_details",
        },
      },
      { $unwind: { path: "$transition_manager_details", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "useradmin_mast_users",
          localField: "cCreatedBy",
          foreignField: "_id",
          as: "createdByDetails",
        },
      },
      { $unwind: { path: "$createdByDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "useradmin_mast_users",
          localField: "cUpdatedBy",
          foreignField: "_id",
          as: "updatedByDetails",
        },
      },
      { $unwind: { path: "$updatedByDetails", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          currentApprovalLog: {
            $cond: {
              if: { $eq: ["$oStatus_Id", mongoose.Types.ObjectId(approval_pending)] },
              then: {
                $first: {
                  $filter: {
                    input: "$transition_logs",
                    as: "log",
                    cond: {
                      $gt: [
                        {
                          $size: {
                            $filter: {
                              input: "$$log.currentLevel",
                              as: "lvl",
                              cond: { $eq: ["$$lvl.isCurrentLevel", true] },
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
              },
              else: null,
            },
          },
        },
      },
      {
        $addFields: {
          currentApprover: {
            $first: {
              $filter: {
                input: "$currentApprovalLog.currentLevel",
                as: "lvl",
                cond: { $eq: ["$$lvl.isCurrentLevel", true] },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          opportunityId: { $first: "$opportunityDetails.opportunityId" },
          opportunityName: { $first: "$opportunity.cOpportunityName" },
          accountName: {
            $first: { $ifNull: ["$mast_company.company_name", "$lead_company.company_name"] }
          },
          currentApprovalLog: { $first: "$currentApprovalLog" },
          currentApprover: { $first: "$currentApprover" },
          cCompanyCode: {
            $first: { $ifNull: ["$mast_company.cCompanyCode", "$lead_company.cCompanyCode"] }
          },
          AccountId: {
            $first: { $ifNull: ["$mast_company._id", "$lead_company._id"] }
          },
          companyId: {
            $first: { $ifNull: ["$mast_company._id", "$lead_company._id"] }
          },
          createdByName: { $first: "$createdByDetails.loginName" },
          updatedByName: { $first: "$updatedByDetails.loginName" },
          products: {
            $push: {
              productId: "$opportunityDetails.productId",
              productName: "$product.cDisplayName",
              cFeaturesDesc: "$product.cFeaturesDesc",
              categoryName: "$class.cCategory_Name",
              subClassName: "$subClass.cSubClassName",
              subClassId: "$subClass._id",
              billingUnitName: "$billingUnit.cBillingUnit",
              levelName: "$crm_mast_levels.cLevels",
            }
          },
          transitionStatus: { $first: "$transition_status.cStatus_Name" },
          transitionClassName: { $first: "$transition_status.className" },
          transitionStatusId: { $first: "$transition_status._id" },
          surveyMappedId: { $first: "$survey_details._id" },
          survey_details: { $push: "$survey_details" },
          surveyResponse: { $push: "$survey_details.recipients_response" },
          dCreatedAt: { $first: "$dCreatedAt" },
          cTransition_Name: { $first: "$cTransition_Name" },
          dUpdatedAt: { $first: "$dUpdatedAt" },
          cUpdatedBy: { $first: "$cUpdatedBy" },
          cCreatedBy: { $first: "$cCreatedBy" },
          summary: { $first: "$summary" },
          transitionNo: { $first: "$transitionNo" },
          transition_manager_name: { $first: "$transition_manager_details.loginName" },
          transition_manager_id: { $first: "$transition_manager_details._id" },
          mappedProcess: { $first: "$mappedProcess.cGroupName" },
          mappedProcessId: { $first: "$mappedProcess._id" },
        }
      },
      {
        $addFields: {
          isSurvey: { $gt: [{ $size: { $ifNull: ["$survey_details", []] } }, 0] }
        }
      },
      {
        $project: {
          _id: 1,
          opportunityId: 1,
          opportunityName: 1,
          currentApprovalLog: 1,
          currentApprover: 1,
          cTransition_Name: 1,
          accountName: 1,
          AccountId: 1,
          cCompanyCode: 1,
          cUpdatedBy: 1,
          products: 1,
          transitionStatus: 1,
          transitionClassName: 1,
          transitionStatusId: 1,
          surveyMappedId: 1,
          isSurvey: 1,
          createdByName: 1,
          updatedByName: 1,
          surveyResponse: 1,
          cCreatedBy: 1,
          dUpdatedAt: 1,
          dCreatedAt: 1,
          transition_manager_name: 1,
          transition_manager_id: 1,
          summary: 1,
          mappedProcess: 1,
          mappedProcessId: 1,
          transitionNo: 1,
          transition_completed: {
            $cond: {
              if: { $in: ["$transitionStatusId", [mongoose.Types.ObjectId(transition_completed)]] },
              then: true,
              else: false
            }
          },
          isHold: {
            $cond: {
              if: { $in: ["$transitionStatusId", [mongoose.Types.ObjectId(transition_hold)]] },
              then: true,
              else: false
            }
          },
          isCancel: {
            $cond: {
              if: { $in: ["$transitionStatusId", [mongoose.Types.ObjectId(transition_cancel)]] },
              then: true,
              else: false
            }
          },
          isNew: {
            $cond: {
              if: { $in: ["$transitionStatusId", [mongoose.Types.ObjectId(transition_new)]] },
              then: true,
              else: false
            }
          },
          isInProgress: {
            $cond: {
              if: { $in: ["$transitionStatusId", [mongoose.Types.ObjectId(transition_in_progress)]] },
              then: true,
              else: false
            }
          },
          isActiveTransition: {
            $cond: {
              if: {
                $in: [
                  "$transitionStatusId",
                  [
                    mongoose.Types.ObjectId(transition_completed),
                    mongoose.Types.ObjectId(transition_cancel),
                    mongoose.Types.ObjectId(transition_hold),
                    mongoose.Types.ObjectId(transition_new),
                  ]
                ]
              },
              then: true,
              else: false
            }
          },
          isApprovalPending: {
            $cond: {
              if: { $in: ["$oStatus_Id", [mongoose.Types.ObjectId(approval_pending)]] },
              then: true,
              else: false
            }
          },
        }
      },
      { $sort: { dCreatedAt: -1 } },
    ];

    const transitionList = await TransitionPhaseTemplateValueMappings.aggregate(pipeline);
    return transitionList?.map((val) => {
      const overallscore = val?.summary?.length > 0 ? val?.summary?.reduce(
        (sum, acc) => sum + (acc?.tollgate_score || 0),
        0
      ) / val?.summary?.length : null;
      let csatScore = 0;
      let ratingCount = 0;

      if (Array.isArray(val?.surveyResponse) && val.surveyResponse.length > 0) {
        val.surveyResponse.forEach((surveyArr) => {
          if (Array.isArray(surveyArr)) {
            surveyArr.forEach((item) => {
              Object.keys(item?.response || {}).forEach((key) => {
                const value = item?.response?.[key];
                if (
                  key.startsWith("survey_rating_") &&
                  value !== "N/A" &&
                  !isNaN(Number(value))
                ) {
                  csatScore += Number(value);
                  ratingCount++;
                }
              });
            });
          }
        });
        csatScore = ratingCount > 0 ? (csatScore / (ratingCount * 5)) * 100 : null;
      } else {
        csatScore = null;
      }

      return {
        ...val,
        originaloverallscore: overallscore,
        originalcsatScore: csatScore,
        overallscore: overallscore ? `${overallscore}%` : null,
        csatStatus: csatScore ? `${csatScore}%` : null,
      };
    });
  }

  async getTransitionByOpportunityId(opportunityId, tokenDetails) {
    const ObjectId = mongoose.Types.ObjectId;
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const transition_completed = await getStatusById("Transition", "transition_completed");
    const transition_new = await getStatusById("Transition", "transition_new");
    const transition_cancel = await getStatusById("Transition", "transition_cancel");
    const transition_hold = await getStatusById("Transition", "transition_hold");
    const transition_in_progress = await getStatusById("Transition", "transition_in_progress");
    const approval_pending = await getStatusById("Transition", "transition_approval_pending");

    const pipeline = [
      { $unwind: "$opportunityDetails" },
      {
        $match: {
          "opportunityDetails.opportunityId": new ObjectId(opportunityId),
          oUserCompanyId: new ObjectId(selectedCompanyId)
        }
      },
      {
        $lookup: {
          from: "leads_opportunity_product_company_mappings",
          localField: "opportunityDetails.opportunityId",
          foreignField: "_id",
          as: "opportunity"
        }
      },
      { $unwind: { path: "$opportunity", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "phase_template_master_mappings",
          localField: "mappedPhaseTemplate_Id",
          foreignField: "_id",
          as: "mappedProcess"
        }
      },
      { $unwind: { path: "$mappedProcess", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_company_details",
          localField: "opportunity.oCompany_Id",
          foreignField: "_id",
          as: "lead_company"
        }
      },
      { $unwind: { path: "$lead_company", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "mast_company_informations",
          localField: "opportunity.oCompany_Id",
          foreignField: "_id",
          as: "mast_company",
        },
      },
      { $unwind: { path: "$mast_company", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_productcategory_product_mappings",
          localField: "opportunityDetails.productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_categories",
          localField: "product.oCategoryID",
          foreignField: "_id",
          as: "class"
        }
      },
      { $unwind: { path: "$class", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_subclasses",
          localField: "product.oSubClass",
          foreignField: "_id",
          as: "subClass"
        }
      },
      { $unwind: { path: "$subClass", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_billing_units",
          localField: "product.cBillingUnit",
          foreignField: "_id",
          as: "billingUnit"
        }
      },
      { $unwind: { path: "$billingUnit", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "crm_mast_levels",
          localField: "product.oProductLevel",
          foreignField: "_id",
          as: "crm_mast_levels"
        }
      },
      { $unwind: { path: "$crm_mast_levels", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_master_statuses",
          localField: "oStatus_Id",
          foreignField: "_id",
          as: "transition_status",
        },
      },
      { $unwind: { path: "$transition_status", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "transition_company_survey_mappings",
          localField: "_id",
          foreignField: "transitionId",
          as: "survey_details",
        },
      },
      { $unwind: { path: "$survey_details", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "useradmin_mast_users",
          localField: "transition_manager",
          foreignField: "_id",
          as: "transition_manager_details",
        },
      },
      { $unwind: { path: "$transition_manager_details", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "useradmin_mast_users",
          localField: "cCreatedBy",
          foreignField: "_id",
          as: "createdByDetails",
        },
      },
      { $unwind: { path: "$createdByDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "useradmin_mast_users",
          localField: "cUpdatedBy",
          foreignField: "_id",
          as: "updatedByDetails",
        },
      },
      { $unwind: { path: "$updatedByDetails", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          currentApprovalLog: {
            $cond: {
              if: { $eq: ["$oStatus_Id", mongoose.Types.ObjectId(approval_pending)] },
              then: {
                $first: {
                  $filter: {
                    input: "$transition_logs",
                    as: "log",
                    cond: {
                      $gt: [
                        {
                          $size: {
                            $filter: {
                              input: "$$log.currentLevel",
                              as: "lvl",
                              cond: { $eq: ["$$lvl.isCurrentLevel", true] },
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
              },
              else: null,
            },
          },
        },
      },
      {
        $addFields: {
          currentApprover: {
            $first: {
              $filter: {
                input: "$currentApprovalLog.currentLevel",
                as: "lvl",
                cond: { $eq: ["$$lvl.isCurrentLevel", true] },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          opportunityId: { $first: "$opportunityDetails.opportunityId" },
          opportunityName: { $first: "$opportunity.cOpportunityName" },
          accountName: {
            $first: { $ifNull: ["$mast_company.company_name", "$lead_company.company_name"] }
          },
          currentApprovalLog: { $first: "$currentApprovalLog" },
          currentApprover: { $first: "$currentApprover" },
          cCompanyCode: {
            $first: { $ifNull: ["$mast_company.cCompanyCode", "$lead_company.cCompanyCode"] }
          },
          AccountId: {
            $first: { $ifNull: ["$mast_company._id", "$lead_company._id"] }
          },
          companyId: {
            $first: { $ifNull: ["$mast_company._id", "$lead_company._id"] }
          },
          createdByName: { $first: "$createdByDetails.loginName" },
          updatedByName: { $first: "$updatedByDetails.loginName" },
          products: {
            $push: {
              productId: "$opportunityDetails.productId",
              productName: "$product.cDisplayName",
              cFeaturesDesc: "$product.cFeaturesDesc",
              categoryName: "$class.cCategory_Name",
              subClassName: "$subClass.cSubClassName",
              subClassId: "$subClass._id",
              billingUnitName: "$billingUnit.cBillingUnit",
              levelName: "$crm_mast_levels.cLevels",
            }
          },
          transitionStatus: { $first: "$transition_status.cStatus_Name" },
          transitionClassName: { $first: "$transition_status.className" },
          transitionStatusId: { $first: "$transition_status._id" },
          surveyMappedId: { $first: "$survey_details._id" },
          survey_details: { $push: "$survey_details" },
          surveyResponse: { $push: "$survey_details.recipients_response" },
          dCreatedAt: { $first: "$dCreatedAt" },
          cTransition_Name: { $first: "$cTransition_Name" },
          dUpdatedAt: { $first: "$dUpdatedAt" },
          cUpdatedBy: { $first: "$cUpdatedBy" },
          cCreatedBy: { $first: "$cCreatedBy" },
          summary: { $first: "$summary" },
          transitionNo: { $first: "$transitionNo" },
          transition_manager_name: { $first: "$transition_manager_details.loginName" },
          transition_manager_id: { $first: "$transition_manager_details._id" },
          mappedProcess: { $first: "$mappedProcess.cGroupName" },
          mappedProcessId: { $first: "$mappedProcess._id" },
        }
      },
      {
        $addFields: {
          isSurvey: { $gt: [{ $size: { $ifNull: ["$survey_details", []] } }, 0] }
        }
      },
      {
        $project: {
          _id: 1,
          opportunityId: 1,
          opportunityName: 1,
          currentApprovalLog: 1,
          currentApprover: 1,
          cTransition_Name: 1,
          accountName: 1,
          AccountId: 1,
          cCompanyCode: 1,
          cUpdatedBy: 1,
          products: 1,
          transitionStatus: 1,
          transitionClassName: 1,
          transitionStatusId: 1,
          surveyMappedId: 1,
          isSurvey: 1,
          createdByName: 1,
          updatedByName: 1,
          surveyResponse: 1,
          cCreatedBy: 1,
          dUpdatedAt: 1,
          dCreatedAt: 1,
          transition_manager_name: 1,
          transition_manager_id: 1,
          summary: 1,
          mappedProcess: 1,
          mappedProcessId: 1,
          transitionNo: 1,
          transition_completed: {
            $cond: {
              if: { $in: ["$transitionStatusId", [mongoose.Types.ObjectId(transition_completed)]] },
              then: true,
              else: false
            }
          },
          isHold: {
            $cond: {
              if: { $in: ["$transitionStatusId", [mongoose.Types.ObjectId(transition_hold)]] },
              then: true,
              else: false
            }
          },
          isCancel: {
            $cond: {
              if: { $in: ["$transitionStatusId", [mongoose.Types.ObjectId(transition_cancel)]] },
              then: true,
              else: false
            }
          },
          isNew: {
            $cond: {
              if: { $in: ["$transitionStatusId", [mongoose.Types.ObjectId(transition_new)]] },
              then: true,
              else: false
            }
          },
          isInProgress: {
            $cond: {
              if: { $in: ["$transitionStatusId", [mongoose.Types.ObjectId(transition_in_progress)]] },
              then: true,
              else: false
            }
          },
          isActiveTransition: {
            $cond: {
              if: {
                $in: [
                  "$transitionStatusId",
                  [
                    mongoose.Types.ObjectId(transition_completed),
                    mongoose.Types.ObjectId(transition_cancel),
                    mongoose.Types.ObjectId(transition_hold),
                    mongoose.Types.ObjectId(transition_new),
                  ]
                ]
              },
              then: true,
              else: false
            }
          },
          isApprovalPending: {
            $cond: {
              if: { $in: ["$oStatus_Id", [mongoose.Types.ObjectId(approval_pending)]] },
              then: true,
              else: false
            }
          },
        }
      }
    ];

    const transitionData = await TransitionPhaseTemplateValueMappings.aggregate(pipeline);
    if (!transitionData || transitionData.length === 0) {
      return [];
    }

    const processedData = transitionData.map((val) => {
      const overallscore = val?.summary?.length > 0
        ? val?.summary?.reduce((sum, acc) => sum + (acc?.tollgate_score || 0), 0) / val?.summary?.length
        : null;
      let csatScore = 0;
      let ratingCount = 0;

      if (Array.isArray(val?.surveyResponse) && val.surveyResponse.length > 0) {
        val.surveyResponse.forEach((surveyArr) => {
          if (Array.isArray(surveyArr)) {
            surveyArr.forEach((item) => {
              Object.keys(item?.response || {}).forEach((key) => {
                const value = item?.response?.[key];
                if (
                  key.startsWith("survey_rating_") &&
                  value !== "N/A" &&
                  !isNaN(Number(value))
                ) {
                  csatScore += Number(value);
                  ratingCount++;
                }
              });
            });
          }
        });
        csatScore = ratingCount > 0 ? (csatScore / (ratingCount * 5)) * 100 : null;
      } else {
        csatScore = null;
      }

      return {
        ...val,
        originaloverallscore: overallscore,
        originalcsatScore: csatScore,
        overallscore: overallscore ? `${overallscore}%` : null,
        csatStatus: csatScore ? `${csatScore}%` : null,
      };
    });

    return processedData;
  }

  async getEmpUserNames(tokenDetails, headers) {
    const selectedCompanyId = tokenDetails?.centralCompanyId || tokenDetails?.selectedCompanyId;
    if (!selectedCompanyId) {
      throw new Error("Company not found in token");
    }
    const timestamp = Date.now().toString();
    const response = await axios.get(
      `${process.env.AUTH_URL}/users/getUserEmployee?provider=false&companyId=${selectedCompanyId}&timestamp=${timestamp}`,
      {
        headers: {
          "is-from": "App",
          "x-access-token": headers["x-access-token"],
          "access-token": headers["access-token"],
          "session-id": headers["session-id"],
        }
      }
    );
    return response.data?.Data?.filter((val) => val.hrEmpId) || [];
  }

  // --- Action Owner ---
  async createActionOwner(body, tokenDetails) {
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const idofuser = tokenDetails.idofuser;
    const { cActionOwner } = body;
    if (!cActionOwner) {
      throw new Error("Missing required field: cActionOwner");
    }

    const existingOwner = await TransitionMastActionOwner.findOne({
      cActionOwner: cActionOwner.trim(),
      oUserCompanyId: selectedCompanyId
    });
    if (existingOwner) {
      return { success: false, message: "Action owner with this name already exists for this company" };
    }

    const actionOwnerData = {
      ...body,
      cCreatedBy: idofuser,
      oUserCompanyId: selectedCompanyId,
      cUpdatedBy: idofuser
    };

    const actionOwner = new TransitionMastActionOwner(actionOwnerData);
    await actionOwner.save();
    return { success: true, data: actionOwner };
  }

  async getAllActionOwners() {
    return TransitionMastActionOwner.find({ bActive: true }).sort({ dCreatedAt: 1 });
  }

  async getActionOwnerById(id) {
    return TransitionMastActionOwner.findById(id)
      .populate('cCreatedBy', 'cFirstName cLastName cEmail')
      .populate('cUpdatedBy', 'cFirstName cLastName cEmail')
      .populate('oUserCompanyId', 'cCompanyName');
  }

  async updateActionOwner(id, body, tokenDetails) {
    const idofuser = tokenDetails.idofuser;
    const existingOwner = await TransitionMastActionOwner.findById(id);
    if (!existingOwner) {
      throw new Error("Action owner not found");
    }

    if (body.cActionOwner && body.cActionOwner !== existingOwner.cActionOwner) {
      const duplicate = await TransitionMastActionOwner.findOne({
        cActionOwner: body.cActionOwner.trim(),
        oUserCompanyId: existingOwner.oUserCompanyId,
        _id: { $ne: id }
      });
      if (duplicate) {
        throw new Error("Action owner with this name already exists for this company");
      }
    }

    const updateFields = {
      ...body,
      dUpdatedAt: Date.now()
    };
    if (idofuser && mongoose.Types.ObjectId.isValid(idofuser)) {
      updateFields.cUpdatedBy = idofuser;
    }

    return TransitionMastActionOwner.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    ).populate('cCreatedBy', 'cFirstName cLastName cEmail')
      .populate('cUpdatedBy', 'cFirstName cLastName cEmail')
      .populate('oUserCompanyId', 'cCompanyName');
  }

  async deleteActionOwner(id, body) {
    const { cUpdatedBy } = body;
    const actionOwner = await TransitionMastActionOwner.findById(id);
    if (!actionOwner) {
      throw new Error("Action owner not found");
    }

    const updateData = {
      bActive: false,
      dUpdatedAt: Date.now()
    };
    if (cUpdatedBy && mongoose.Types.ObjectId.isValid(cUpdatedBy)) {
      updateData.cUpdatedBy = cUpdatedBy;
    }

    return TransitionMastActionOwner.findByIdAndUpdate(id, updateData, { new: true });
  }

  // --- Approvals ---
  async loadApprovalTransitionRequest(tokenDetails) {
    const ObjectId = mongoose.Types.ObjectId;
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const userId = tokenDetails.idofuser;
    const approval_pending = await getStatusById("Transition", "transition_approval_pending");

    const pipeline = [
      {
        $match: {
          oUserCompanyId: new ObjectId(selectedCompanyId),
          oStatus_Id: mongoose.Types.ObjectId(approval_pending)
        },
      },
      { $unwind: "$opportunityDetails" },
      {
        $lookup: {
          from: "leads_opportunity_product_company_mappings",
          localField: "opportunityDetails.opportunityId",
          foreignField: "_id",
          as: "opportunity"
        }
      },
      { $unwind: { path: "$opportunity", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "phase_template_master_mappings",
          localField: "mappedPhaseTemplate_Id",
          foreignField: "_id",
          as: "mappedProcess"
        }
      },
      { $unwind: { path: "$mappedProcess", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_company_details",
          localField: "opportunity.oCompany_Id",
          foreignField: "_id",
          as: "lead_company"
        }
      },
      { $unwind: { path: "$lead_company", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "mast_company_informations",
          localField: "opportunity.oCompany_Id",
          foreignField: "_id",
          as: "mast_company",
        },
      },
      { $unwind: { path: "$mast_company", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_productcategory_product_mappings",
          localField: "opportunityDetails.productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_categories",
          localField: "product.oCategoryID",
          foreignField: "_id",
          as: "class"
        }
      },
      { $unwind: { path: "$class", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_subclasses",
          localField: "product.oSubClass",
          foreignField: "_id",
          as: "subClass"
        }
      },
      { $unwind: { path: "$subClass", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_billing_units",
          localField: "product.cBillingUnit",
          foreignField: "_id",
          as: "billingUnit"
        }
      },
      { $unwind: { path: "$billingUnit", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "crm_mast_levels",
          localField: "product.oProductLevel",
          foreignField: "_id",
          as: "crm_mast_levels"
        }
      },
      { $unwind: { path: "$crm_mast_levels", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_master_statuses",
          localField: "oStatus_Id",
          foreignField: "_id",
          as: "transition_status",
        },
      },
      { $unwind: { path: "$transition_status", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "transition_company_survey_mappings",
          localField: "_id",
          foreignField: "transitionId",
          as: "survey_details",
        },
      },
      { $unwind: { path: "$survey_details", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "useradmin_mast_users",
          localField: "transition_manager",
          foreignField: "_id",
          as: "transition_manager_details",
        },
      },
      { $unwind: { path: "$transition_manager_details", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          opportunityId: { $first: "$opportunityDetails.opportunityId" },
          opportunityName: { $first: "$opportunity.cOpportunityName" },
          accountName: {
            $first: { $ifNull: ["$mast_company.company_name", "$lead_company.company_name"] }
          },
          cCompanyCode: {
            $first: { $ifNull: ["$mast_company.cCompanyCode", "$lead_company.cCompanyCode"] }
          },
          AccountId: {
            $first: { $ifNull: ["$mast_company._id", "$lead_company._id"] }
          },
          companyId: {
            $first: { $ifNull: ["$mast_company._id", "$lead_company._id"] }
          },
          products: {
            $push: {
              productId: "$opportunityDetails.productId",
              productName: "$product.cDisplayName",
              cFeaturesDesc: "$product.cFeaturesDesc",
              categoryName: "$class.cCategory_Name",
              subClassName: "$subClass.cSubClassName",
              subClassId: "$subClass._id",
              billingUnitName: "$billingUnit.cBillingUnit",
              levelName: "$crm_mast_levels.cLevels",
            }
          },
          transitionStatus: { $first: "$transition_status.cStatus_Name" },
          transitionClassName: { $first: "$transition_status.className" },
          transitionStatusId: { $first: "$transition_status._id" },
          surveyMappedId: { $first: "$survey_details._id" },
          survey_details: { $push: "$survey_details" },
          surveyResponse: { $push: "$survey_details.recipients_response" },
          dCreatedAt: { $first: "$dCreatedAt" },
          cCreatedBy: { $first: "$cCreatedBy" },
          summary: { $first: "$summary" },
          transition_logs: { $first: "$transition_logs" },
          transitionNo: { $first: "$transitionNo" },
          transition_manager_name: { $first: "$transition_manager_details.loginName" },
          transition_manager_id: { $first: "$transition_manager_details._id" },
          mappedProcess: { $first: "$mappedProcess.cGroupName" },
          mappedProcessId: { $first: "$mappedProcess._id" },
        }
      },
      {
        $lookup: {
          from: "useradmin_mast_users",
          localField: "transition_logs.cCreatedBy",
          foreignField: "_id",
          as: "logUserDetails"
        }
      },
      {
        $lookup: {
          from: "useradmin_mast_users",
          localField: "transition_logs.currentLevel.user_id",
          foreignField: "_id",
          as: "approverDetails"
        }
      },
      {
        $addFields: {
          transition_logs: {
            $filter: {
              input: {
                $map: {
                  input: { $ifNull: ["$transition_logs", []] },
                  as: "log",
                  in: {
                    actionRequest: "$$log.actionRequest",
                    groupId: "$$log.groupId",
                    statusId: "$$log.statusId",
                    dCreatedAt: "$$log.dCreatedAt",
                    cCreatedBy: "$$log.cCreatedBy",
                    comment: "$$log.comment",
                    createdBy: {
                      $let: {
                        vars: {
                          user: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: "$logUserDetails",
                                  as: "u",
                                  cond: { $eq: ["$$u._id", "$$log.cCreatedBy"] }
                                }
                              },
                              0
                            ]
                          }
                        },
                        in: "$$user.loginName"
                      }
                    },
                    currentLevel: {
                      $filter: {
                        input: { $ifNull: ["$$log.currentLevel", []] },
                        as: "level",
                        cond: {
                          $and: [
                            { $eq: ["$$level.isCurrentLevel", true] },
                            { $eq: ["$$level.user_id", mongoose.Types.ObjectId(userId)] }
                          ]
                        }
                      }
                    },
                    approverNames: {
                      $let: {
                        vars: {
                          currentLevelUser: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: { $ifNull: ["$$log.currentLevel", []] },
                                  as: "lvl",
                                  cond: { $eq: ["$$lvl.isCurrentLevel", true] }
                                }
                              },
                              0
                            ]
                          }
                        },
                        in: {
                          $let: {
                            vars: {
                              approver: {
                                $arrayElemAt: [
                                  {
                                    $filter: {
                                      input: "$approverDetails",
                                      as: "u",
                                      cond: { $eq: ["$$u._id", "$$currentLevelUser.user_id"] }
                                    }
                                  },
                                  0
                                ]
                              }
                            },
                            in: "$$approver.loginName"
                          }
                        }
                      }
                    }
                  }
                }
              },
              as: "filteredLog",
              cond: { $gt: [{ $size: "$$filteredLog.currentLevel" }, 0] }
            }
          },
          isSurvey: { $gt: [{ $size: { $ifNull: ["$survey_details", []] } }, 0] }
        }
      },
      {
        $match: {
          $expr: { $gt: [{ $size: { $ifNull: ["$transition_logs", []] } }, 0] }
        }
      },
      {
        $project: {
          _id: 1,
          opportunityId: 1,
          opportunityName: 1,
          transition_logs: 1,
          accountName: 1,
          AccountId: 1,
          cCompanyCode: 1,
          products: 1,
          transitionStatus: 1,
          transitionClassName: 1,
          transitionStatusId: 1,
          surveyMappedId: 1,
          isSurvey: 1,
          surveyResponse: 1,
          cCreatedBy: 1,
          dCreatedAt: 1,
          transition_manager_name: 1,
          transition_manager_id: 1,
          summary: 1,
          mappedProcess: 1,
          mappedProcessId: 1,
          transitionNo: 1
        }
      },
      { $sort: { dCreatedAt: -1 } },
    ];

    const transitionList = await TransitionPhaseTemplateValueMappings.aggregate(pipeline);
    return transitionList?.map((val) => {
      const overallscore = val?.summary?.length > 0 ? val?.summary?.reduce(
        (sum, acc) => sum + (acc?.tollgate_score || 0),
        0
      ) / val?.summary?.length : null;
      let csatScore = 0;
      let ratingCount = 0;

      if (Array.isArray(val?.surveyResponse) && val.surveyResponse.length > 0) {
        val.surveyResponse.forEach((surveyArr) => {
          if (Array.isArray(surveyArr)) {
            surveyArr.forEach((item) => {
              Object.keys(item?.response || {}).forEach((key) => {
                const value = item?.response?.[key];
                if (
                  key.startsWith("survey_rating_") &&
                  value !== "N/A" &&
                  !isNaN(Number(value))
                ) {
                  csatScore += Number(value);
                  ratingCount++;
                }
              });
            });
          }
        });
        csatScore = ratingCount > 0 ? (csatScore / (ratingCount * 5)) * 100 : null;
      } else {
        csatScore = null;
      }

      return {
        ...val,
        originaloverallscore: overallscore,
        originalcsatScore: csatScore,
        overallscore: overallscore ? `${overallscore}%` : null,
        csatStatus: csatScore ? `${csatScore}%` : null,
      };
    });
  }

  async loadExitingApprovalTransitionRequest(tokenDetails) {
    const ObjectId = mongoose.Types.ObjectId;
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const userId = tokenDetails.idofuser;
    const approval_pending = await getStatusById("Transition", "transition_approval_pending");

    const pipeline = [
      {
        $match: {
          oUserCompanyId: new ObjectId(selectedCompanyId),
          oStatus_Id: mongoose.Types.ObjectId(approval_pending)
        },
      },
      { $unwind: "$opportunityDetails" },
      {
        $lookup: {
          from: "leads_opportunity_product_company_mappings",
          localField: "opportunityDetails.opportunityId",
          foreignField: "_id",
          as: "opportunity"
        }
      },
      { $unwind: { path: "$opportunity", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "phase_template_master_mappings",
          localField: "mappedPhaseTemplate_Id",
          foreignField: "_id",
          as: "mappedProcess"
        }
      },
      { $unwind: { path: "$mappedProcess", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_company_details",
          localField: "opportunity.oCompany_Id",
          foreignField: "_id",
          as: "lead_company"
        }
      },
      { $unwind: { path: "$lead_company", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "mast_company_informations",
          localField: "opportunity.oCompany_Id",
          foreignField: "_id",
          as: "mast_company",
        },
      },
      { $unwind: { path: "$mast_company", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_productcategory_product_mappings",
          localField: "opportunityDetails.productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_categories",
          localField: "product.oCategoryID",
          foreignField: "_id",
          as: "class"
        }
      },
      { $unwind: { path: "$class", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_subclasses",
          localField: "product.oSubClass",
          foreignField: "_id",
          as: "subClass"
        }
      },
      { $unwind: { path: "$subClass", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_billing_units",
          localField: "product.cBillingUnit",
          foreignField: "_id",
          as: "billingUnit"
        }
      },
      { $unwind: { path: "$billingUnit", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "crm_mast_levels",
          localField: "product.oProductLevel",
          foreignField: "_id",
          as: "crm_mast_levels"
        }
      },
      { $unwind: { path: "$crm_mast_levels", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_master_statuses",
          localField: "oStatus_Id",
          foreignField: "_id",
          as: "transition_status",
        },
      },
      { $unwind: { path: "$transition_status", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "transition_company_survey_mappings",
          localField: "_id",
          foreignField: "transitionId",
          as: "survey_details",
        },
      },
      { $unwind: { path: "$survey_details", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "useradmin_mast_users",
          localField: "transition_manager",
          foreignField: "_id",
          as: "transition_manager_details",
        },
      },
      { $unwind: { path: "$transition_manager_details", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          opportunityId: { $first: "$opportunityDetails.opportunityId" },
          opportunityName: { $first: "$opportunity.cOpportunityName" },
          accountName: {
            $first: { $ifNull: ["$mast_company.company_name", "$lead_company.company_name"] }
          },
          cCompanyCode: {
            $first: { $ifNull: ["$mast_company.cCompanyCode", "$lead_company.cCompanyCode"] }
          },
          AccountId: {
            $first: { $ifNull: ["$mast_company._id", "$lead_company._id"] }
          },
          companyId: {
            $first: { $ifNull: ["$mast_company._id", "$lead_company._id"] }
          },
          products: {
            $push: {
              productId: "$opportunityDetails.productId",
              productName: "$product.cDisplayName",
              cFeaturesDesc: "$product.cFeaturesDesc",
              categoryName: "$class.cCategory_Name",
              subClassName: "$subClass.cSubClassName",
              subClassId: "$subClass._id",
              billingUnitName: "$billingUnit.cBillingUnit",
              levelName: "$crm_mast_levels.cLevels",
            }
          },
          transitionStatus: { $first: "$transition_status.cStatus_Name" },
          transitionClassName: { $first: "$transition_status.className" },
          transitionStatusId: { $first: "$transition_status._id" },
          surveyMappedId: { $first: "$survey_details._id" },
          survey_details: { $push: "$survey_details" },
          surveyResponse: { $push: "$survey_details.recipients_response" },
          dCreatedAt: { $first: "$dCreatedAt" },
          cCreatedBy: { $first: "$cCreatedBy" },
          summary: { $first: "$summary" },
          transition_logs: { $first: "$transition_logs" },
          transitionNo: { $first: "$transitionNo" },
          transition_manager_name: { $first: "$transition_manager_details.loginName" },
          transition_manager_id: { $first: "$transition_manager_details._id" },
          mappedProcess: { $first: "$mappedProcess.cGroupName" },
          mappedProcessId: { $first: "$mappedProcess._id" },
        }
      },
      {
        $lookup: {
          from: "useradmin_mast_users",
          localField: "transition_logs.cCreatedBy",
          foreignField: "_id",
          as: "logUserDetails"
        }
      },
      {
        $lookup: {
          from: "useradmin_mast_users",
          localField: "transition_logs.currentLevel.user_id",
          foreignField: "_id",
          as: "approverDetails"
        }
      },
      {
        $addFields: {
          transition_logs: {
            $filter: {
              input: {
                $map: {
                  input: { $ifNull: ["$transition_logs", []] },
                  as: "log",
                  in: {
                    actionRequest: "$$log.actionRequest",
                    groupId: "$$log.groupId",
                    statusId: "$$log.statusId",
                    dCreatedAt: "$$log.dCreatedAt",
                    cCreatedBy: "$$log.cCreatedBy",
                    comment: "$$log.comment",
                    createdBy: {
                      $let: {
                        vars: {
                          user: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: "$logUserDetails",
                                  as: "u",
                                  cond: { $eq: ["$$u._id", "$$log.cCreatedBy"] }
                                }
                              },
                              0
                            ]
                          }
                        },
                        in: "$$user.loginName"
                      }
                    },
                    currentLevel: {
                      $filter: {
                        input: { $ifNull: ["$$log.currentLevel", []] },
                        as: "level",
                        cond: { $eq: ["$$level.isCurrentLevel", true] }
                      }
                    },
                    approverNames: {
                      $let: {
                        vars: {
                          currentLevelUser: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: { $ifNull: ["$$log.currentLevel", []] },
                                  as: "lvl",
                                  cond: { $eq: ["$$lvl.isCurrentLevel", true] }
                                }
                              },
                              0
                            ]
                          }
                        },
                        in: {
                          $let: {
                            vars: {
                              approver: {
                                $arrayElemAt: [
                                  {
                                    $filter: {
                                      input: "$approverDetails",
                                      as: "u",
                                      cond: { $eq: ["$$u._id", "$$currentLevelUser.user_id"] }
                                    }
                                  },
                                  0
                                ]
                              }
                            },
                            in: "$$approver.loginName"
                          }
                        }
                      }
                    }
                  }
                }
              },
              as: "filteredLog",
              cond: { $gt: [{ $size: "$$filteredLog.currentLevel" }, 0] }
            }
          },
          isSurvey: { $gt: [{ $size: { $ifNull: ["$survey_details", []] } }, 0] }
        }
      },
      {
        $match: {
          $expr: { $gt: [{ $size: { $ifNull: ["$transition_logs", []] } }, 0] }
        }
      },
      {
        $project: {
          _id: 1,
          opportunityId: 1,
          opportunityName: 1,
          transition_logs: 1,
          accountName: 1,
          AccountId: 1,
          cCompanyCode: 1,
          products: 1,
          transitionStatus: 1,
          transitionClassName: 1,
          transitionStatusId: 1,
          surveyMappedId: 1,
          isSurvey: 1,
          surveyResponse: 1,
          cCreatedBy: 1,
          dCreatedAt: 1,
          transition_manager_name: 1,
          transition_manager_id: 1,
          summary: 1,
          mappedProcess: 1,
          mappedProcessId: 1,
          transitionNo: 1
        }
      },
      { $sort: { dCreatedAt: -1 } },
    ];

    const transitionList = await TransitionPhaseTemplateValueMappings.aggregate(pipeline);
    return transitionList?.map((val) => {
      const overallscore = val?.summary?.length > 0 ? val?.summary?.reduce(
        (sum, acc) => sum + (acc?.tollgate_score || 0),
        0
      ) / val?.summary?.length : null;
      let csatScore = 0;
      let ratingCount = 0;

      if (Array.isArray(val?.surveyResponse) && val.surveyResponse.length > 0) {
        val.surveyResponse.forEach((surveyArr) => {
          if (Array.isArray(surveyArr)) {
            surveyArr.forEach((item) => {
              Object.keys(item?.response || {}).forEach((key) => {
                const value = item?.response?.[key];
                if (
                  key.startsWith("survey_rating_") &&
                  value !== "N/A" &&
                  !isNaN(Number(value))
                ) {
                  csatScore += Number(value);
                  ratingCount++;
                }
              });
            });
          }
        });
        csatScore = ratingCount > 0 ? (csatScore / (ratingCount * 5)) * 100 : null;
      } else {
        csatScore = null;
      }

      return {
        ...val,
        originaloverallscore: overallscore,
        originalcsatScore: csatScore,
        overallscore: overallscore ? `${overallscore}%` : null,
        csatStatus: csatScore ? `${csatScore}%` : null,
      };
    });
  }

  async loadContactListAgainstAccount(id) {
    return LeadsCustomerDetails.find({ oCompany_Id: mongoose.Types.ObjectId(id) });
  }

  // --- Begin & Process Transition ---
  async beginTransitionMapWithProduct(body, tokenDetails) {
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const idofuser = tokenDetails.idofuser;
    const transition_new = await getStatusById("Transition", "transition_new");

    let isexists = false;
    if (body.opportunityDetails) {
      for (const item of body.opportunityDetails) {
        const { opportunityId, productId } = item;
        const exists = await TransitionPhaseTemplateValueMappings.findOne({
          opportunityDetails: {
            $elemMatch: {
              opportunityId: opportunityId,
              productId: productId
            }
          }
        });
        if (exists) {
          isexists = true;
        }
      }
    }
    if (isexists) {
      return { success: false, message: "Transition already exists for this opportunity product." };
    }

    let runNo;
    let prefix = "TRN";
    const runDoc = await RunningNumberSetting.findOne({
      cModuleName: "Transition Number",
      oCompanyId: selectedCompanyId,
    });

    if (!runDoc) {
      const newDoc = await RunningNumberSetting.create({
        cModuleName: "Transition Number",
        cPrefix: "TRN",
        iNumberLength: 10,
        oCompanyId: selectedCompanyId,
        runningNumbers: [
          {
            iModuleLastNumber: 1,
            dUpdatedAt: new Date(),
            bActive: true,
            _id: new mongoose.Types.ObjectId(),
          },
        ],
      });
      prefix = newDoc.cPrefix;
      runNo = 1;
    } else {
      const activeIdx = runDoc.runningNumbers.findIndex(n => n.bActive);
      const active = runDoc.runningNumbers[activeIdx];
      const updateField = `runningNumbers.${activeIdx}.iModuleLastNumber`;
      const updateDateField = `runningNumbers.${activeIdx}.dUpdatedAt`;

      await RunningNumberSetting.updateOne(
        { _id: runDoc._id },
        { $inc: { [updateField]: 1 }, $set: { [updateDateField]: new Date() } }
      );
      runNo = active.iModuleLastNumber + 1;
      prefix = runDoc.cPrefix;
    }

    const paddedRunNo = runNo.toString().padStart(2, "0");
    const TRNNumber = `${prefix}${paddedRunNo}`;

    const mappedPhases = await PhaseTemplateMasterMappings.findById(body.mappedPhaseTemplate_Id);
    const transitionDetails = await Promise.all(
      (mappedPhases.transitionDetails || []).map(async (value) => {
        const templateDetails = await TransitionMastTemplates.findById(value?.oTemplateId);
        const data = {
          componentValues: {},
          tollgateValues: {},
          KpiValues: {}
        };

        if (templateDetails?.components?.length) {
          templateDetails.components.forEach(item => {
            item?.rows?.forEach((row) => {
              row?.forEach((column) => {
                if (Array.isArray(column?.components)) {
                  column.components.forEach((component) => {
                    const key = component?.key;
                    if (!key) return;
                    if (item.key?.startsWith('phases_')) {
                      data.componentValues[key] = component.defaultValue;
                    } else if (item.key?.startsWith('kpi_')) {
                      data.KpiValues[key] = component.defaultValue;
                    } else if (item.key?.startsWith('tollgates_')) {
                      data.tollgateValues[key] = component.defaultValue;
                    }
                  });
                }
              });
            });
          });
        }

        return {
          iSortOrder: value?.iSortOrder,
          oTemplateId: value?.oTemplateId,
          oPhaseId: value?.oPhaseId,
          ...data
        };
      })
    );

    const transition = new TransitionPhaseTemplateValueMappings({
      ...body,
      reason: [{
        cNotes: "Transition process initiated",
        dCreatedAt: new Date(),
        cCreatedBy: idofuser,
        statusId: transition_new,
      }],
      transitionDetails,
      oUserCompanyId: mongoose.Types.ObjectId(selectedCompanyId),
      cCreatedBy: idofuser,
      oStatus_Id: mongoose.Types.ObjectId(transition_new),
      transitionNo: TRNNumber,
      actionOwner: body.actionOwner || [],
    });

    const savedTransition = await transition.save();
    if (savedTransition) {
      if (body.oActivation_Id) {
        await LeadsCustomerProductDetails.findByIdAndUpdate(body.oActivation_Id, { oStatus_Id: mongoose.Types.ObjectId(transition_new) }, { new: true });
      } else if (body.oTask_Id) {
        await TransitionTasks.findByIdAndUpdate(body.oTask_Id, { oTaskStatus: mongoose.Types.ObjectId(transition_new) }, { new: true });
      }
    }
    return { success: true, data: savedTransition };
  }

  async updateBeginTransitionMapWithProduct(body, tokenDetails) {
    const userId = tokenDetails?.idofuser;
    const { _id, actionOwner } = body;
    if (!_id) {
      throw new Error("Transition mapping id is required");
    }
    return TransitionPhaseTemplateValueMappings.findByIdAndUpdate(
      _id,
      {
        actionOwner,
        dUpdatedAt: new Date(),
        cUpdatedBy: userId
      },
      { new: true, runValidators: true }
    );
  }

  async transitionTemplateJSON(body) {
    const sampleHeader = [
      "ID",
      "Milestones",
      "Outcome",
      "Action Owner",
      "Target Start Date",
      "Actual Start Date",
      "Target End Date",
      "Actual End Date",
      "Compliance Status",
      "Compliance Score",
      "Activity",
    ];

    const sampleContent = [
      { components: [{ label: "", key: "Id", type: "content", html: "", input: false, customClass: "task-id-cell", tableView: false }] },
      { components: [{ label: "", key: "Phases", type: "content", html: "", input: false, customClass: "task-description-cell", tableView: false }] },
      {
        components: [{
          label: "Select", widget: "choicesjs", customClass: "custom-select-dropdown", hideLabel: true,
          style: { "margin-bottom": "15px" }, tableView: true, multiple: true,
          data: {
            values: [
              { label: "Drafted Submission (Internal)", value: "Drafted Submission (Internal)" },
              { label: "Master Service Agreement Approval (Internal)", value: "Master Service Agreement Approval (Internal)" },
              { label: "Master Service Agreement Exection", value: "Master Service Agreement Exection" },
            ]
          },
          key: "outcome", type: "select", input: true
        }]
      },
      {
        components: [{
          label: "Select", widget: "choicesjs", customClass: "custom-select-dropdown", hideLabel: true,
          style: { "margin-bottom": "15px" }, tableView: true, multiple: true,
          data: {
            values: [
              { label: "Delivery Team", value: "Delivery Team" },
              { label: "Transition Team", value: "Transition Team" },
              { label: "Client", value: "Client" },
            ]
          },
          key: "owner", type: "select", input: true
        }]
      },
      {
        components: [{
          label: "Date / Time", hideLabel: true, customClass: "form-control-no-label", tableView: false,
          key: "targetStartDate", type: "datetime", input: true,
          widget: { type: "calendar", displayInTimezone: "viewer", locale: "en", useLocaleSettings: false, allowInput: true, mode: "single", enableTime: true, noCalendar: false, format: "yyyy-MM-dd hh:mm a", hourIncrement: 1, minuteIncrement: 1, time_24hr: false, minDate: null, maxDate: null }
        }]
      },
      {
        components: [{
          label: "Date / Time", hideLabel: true, customClass: "form-control-no-label", tableView: false,
          key: "actualStartDate", type: "datetime", input: true,
          widget: { type: "calendar", displayInTimezone: "viewer", locale: "en", useLocaleSettings: false, allowInput: true, mode: "single", enableTime: true, noCalendar: false, format: "yyyy-MM-dd hh:mm a", hourIncrement: 1, minuteIncrement: 1, time_24hr: false, minDate: null, maxDate: null }
        }]
      },
      {
        components: [{
          key: "targetEndDate", type: "datetime", input: true, label: "Date / Time", hideLabel: true, customClass: "form-control-no-label", tableView: false,
          widget: { type: "calendar", displayInTimezone: "viewer", locale: "en", useLocaleSettings: false, allowInput: true, mode: "single", enableTime: true, noCalendar: false, format: "yyyy-MM-dd hh:mm a", hourIncrement: 1, minuteIncrement: 1, time_24hr: false, minDate: null, maxDate: null }
        }]
      },
      {
        components: [{
          key: "actualEndDate", type: "datetime", input: true, label: "Date / Time", hideLabel: true, customClass: "form-control-no-label", tableView: false,
          widget: { type: "calendar", displayInTimezone: "viewer", locale: "en", useLocaleSettings: false, allowInput: true, mode: "single", enableTime: true, noCalendar: false, format: "yyyy-MM-dd hh:mm a", hourIncrement: 1, minuteIncrement: 1, time_24hr: false, minDate: null, maxDate: null }
        }]
      },
      { components: [{ key: "status", label: "YET TO START", type: "content", html: "YET TO START", input: false, customClass: "status", tableView: false }] },
      { components: [{ key: "score", type: "textfield", input: true, tableView: true, label: "Text Field", hideLabel: true, customClass: "text-box-center" }] },
      {
        components: [{
          type: "button", label: "<div class='badge-count'>0</div>", key: "commentIconBtn", leftIcon: "bi bi-chat-left-dots", customClass: "icon-only-btn with-badge", action: "event", event: "openCommentModal", input: true, tableView: false, labelPosition: "right",
          attrs: [{ attr: "style", value: "position: relative;" }]
        }]
      }
    ];

    const mileStoneContent = [
      { components: [{ label: "1", key: "ID", type: "content", html: "1", input: false, customClass: "id-cell", tableView: false }] },
      { components: [{ label: "1", key: "subheading_milestone_", type: "content", html: "1", input: false, customClass: "id-cell", tableView: false }] },
      { components: [{ key: "score_status", label: "0%", html: "0%", customClass: "score_status", type: "content", input: false, tableView: true, hideLabel: true, disabled: true }] },
      { components: [{ key: "status", label: "YET TO START", type: "content", html: "YET TO START", input: false, customClass: "status-ash", tableView: false }] },
      { components: [{ key: "targetStartDate", label: "", type: "content", html: "", input: false, customClass: "table-row-cell", tableView: false }] },
      { components: [{ key: "actualStartDate", label: "", type: "content", html: "", input: false, customClass: "table-row-cell", tableView: false }] },
      { components: [{ key: "targetEndDate", label: "", type: "content", html: "", input: false, customClass: "table-row-cell", tableView: false }] },
      { components: [{ key: "actualEndDate", label: "", type: "content", html: "", input: false, customClass: "table-row-cell", tableView: false }] },
      { components: [{ label: "", key: "duration", type: "content", html: "", input: false, customClass: "table-row-cell", tableView: true, hideLabel: true, disabled: true }] },
      {
        components: [{
          type: "button", label: "<div class='badge-count'>0</div>", key: "commentIconBtn", leftIcon: "bi bi-chat-left-dots", customClass: "icon-only-btn with-badge", action: "event", event: "openCommentModal", input: true, tableView: false, labelPosition: "right",
          attrs: [{ attr: "style", value: "position: relative;" }]
        }]
      }
    ];

    const {
      header,
      title = "transitionPhase",
      updatedContent = [],
      sampleContentRow = sampleContent,
    } = body;

    const rows = [
      header
        ? header
        : sampleHeader.map((label) => ({
          components: [
            {
              label,
              key: label.replace(/\s+/g, "").toLowerCase(),
              type: "content",
              html: label,
              input: false,
              customClass: "table-header-cell",
              tableView: false,
            },
          ],
        })),
    ];

    updatedContent.forEach((item, index) => {
      const value = index + 1;
      const phaseRow = JSON.parse(JSON.stringify(sampleContentRow)).map((cell) => {
        return {
          components: applyDynamicKeysAndClasses(cell.components, value, "", item?.phaseName),
        };
      });

      const phaseMilestoneCell = phaseRow.find((cell) => cell.components?.[0]?.key?.startsWith("Phases"));
      if (phaseMilestoneCell) {
        phaseMilestoneCell.components[0].label = item?.phaseName ?? item;
        phaseMilestoneCell.components[0].html = item?.phaseName ?? item;
        phaseMilestoneCell.components[0].key = `${phaseMilestoneCell.components[0].key} ${item?._id ?? ""}`;
      }

      const phaseIDCell = phaseRow.find((cell) => cell.components?.[0]?.key?.startsWith("ID"));
      if (phaseIDCell) {
        phaseIDCell.components[0].label = `P${value}`;
        phaseIDCell.components[0].html = `P${value}`;
      }

      phaseRow.forEach((cell) => {
        const comp = cell.components?.[0];
        if (!comp?.key) return;
        if (item.milestone?.length > 0) {
          comp.customClass = `${comp.customClass} milestone-header-cell`;
        }
        if (Object.prototype.hasOwnProperty.call(item, comp.key)) {
          comp.html = item[comp.key];
          comp.label = item[comp.key];
          if (comp.key.startsWith("status_")) {
            const val = item[comp.key];
            if (["COMPLETED", "COMPLETED ON TIME"].includes(val)) {
              comp.customClass = `status-green`;
            } else if (["COMPLETED WITH DELAY", "OVERDUE"].includes(val)) {
              comp.customClass = `status-red`;
            } else if (val === "IN PROGRESS") {
              comp.customClass = `status-orange`;
            } else if (val === "YET TO START") {
              comp.customClass = `status-ash`;
            }
          }
        }
      });
      rows.push(phaseRow);

      if (Array.isArray(item.milestone) && item.milestone.length > 0) {
        item.milestone.forEach((mile, idx) => {
          const mileValue = idx + 1;
          const milestoneRow = JSON.parse(JSON.stringify(mileStoneContent)).map((cell) => ({
            components: applyDynamicKeysAndClasses(
              cell.components,
              mileValue,
              "M",
              item?.phaseName
            ),
          }));

          const milestoneTitleCell = milestoneRow.find((cell) => cell.components?.[0]?.key?.startsWith("subheading_milestone_"));
          if (milestoneTitleCell) {
            milestoneTitleCell.components[0].html = mile;
            milestoneTitleCell.components[0].label = mile;
            milestoneTitleCell.components[0].key = `subheading_milestone_M${mileValue}`;
          }

          milestoneRow.forEach((cell) => {
            const comp = cell.components?.[0];
            if (!comp?.key) return;
            if (Object.prototype.hasOwnProperty.call(item, comp.key)) {
              comp.html = item[comp.key];
              comp.label = item[comp.key];
              if (comp.key.startsWith("status_")) {
                const val = item[comp.key];
                if (["COMPLETED", "COMPLETED ON TIME"].includes(val)) {
                  comp.customClass = `status-green`;
                } else if (["COMPLETED WITH DELAY", "OVERDUE"].includes(val)) {
                  comp.customClass = `status-red`;
                } else if (val === "IN PROGRESS") {
                  comp.customClass = `status-orange`;
                } else if (val === "YET TO START") {
                  comp.customClass = `status-ash`;
                }
              }
            }
          });

          const milestoneIDCell = milestoneRow.find((cell) => cell.components?.[0]?.key?.startsWith("ID"));
          if (milestoneIDCell) {
            milestoneIDCell.components[0].label = `M${mileValue}`;
            milestoneIDCell.components[0].html = `M${mileValue}`;
          }
          rows.push(milestoneRow);
        });
      }
    });

    return {
      components: [
        {
          cellAlignment: "left",
          bordered: true,
          key: title,
          type: "table",
          numRows: rows.length,
          numCols: Array.isArray(header) ? header.length : 0,
          input: false,
          tableView: false,
          customClass: "transition-phase-table",
          rows,
        },
      ],
    };
  }

  async updateTransitionTemplate(body, tokenDetails) {
    const { id, templateId, type, updatedData } = body;
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const userId = tokenDetails.idofuser;

    const existingTemplate = await TransitionPhaseTemplateValueMappings.findById(id);
    if (!existingTemplate) {
      throw new Error("Template mapping not found");
    }

    const updatedTransitionDetails = existingTemplate?.transitionDetails.map((item) => {
      if (item.oTemplateId.toString() === templateId && type === "checklist") {
        item.componentValues = updatedData;
      } else if (type === "kpiTransition") {
        const tempId = item.oTemplateId.toString();
        if (updatedData.hasOwnProperty(tempId)) {
          item.KpiValues = updatedData[tempId];
        }
      } else if (item.oTemplateId.toString() === templateId && type === "tollgate") {
        const tempId = item.oTemplateId.toString();
        if (updatedData.hasOwnProperty(tempId)) {
          item.tollgateValues = updatedData[tempId];
        }
      } else if (type === "ktplanner") {
        item.ktPlanner = updatedData;
      }
      return item;
    });

    if (type === "phases_table") {
      existingTemplate.phasesTableValues = updatedData;
    }

    existingTemplate.transitionDetails = updatedTransitionDetails;
    existingTemplate.cUpdatedBy = userId;
    existingTemplate.dUpdatedAt = new Date();

    await auditLogs(
      selectedCompanyId,
      "Transition_Phase_Template_Value_Mappings",
      existingTemplate._id,
      existingTemplate,
      { transitionDetails: updatedTransitionDetails, cUpdatedBy: userId },
      userId,
      "Transition mapping updated"
    );
    await existingTemplate.save();
    return existingTemplate;
  }

  async checkAlreadyBeginTransition(id) {
    return TransitionPhaseTemplateValueMappings.findOne({
      $or: [
        { oActivation_Id: id },
        { oTask_Id: id }
      ]
    });
  }

  async createTransitionTemplateJSON(body) {
    const {
      header,
      title = "transitionPhase",
      updatedContent = [],
      sampleContentRow = [],
      mileStoneContent = [],
    } = body;

    const rows = [header];
    updatedContent.forEach((item, index) => {
      if (item?.milestone) {
        const mileValue = index + 1;
        const milestoneRow = JSON.parse(JSON.stringify(mileStoneContent)).map((cell) => ({
          components: applyDynamicKeysAndClasses(cell.components, mileValue, "M"),
        }));

        const milestoneCell = milestoneRow.find((cell) => cell.components?.[0]?.key?.includes("subheading_milestone"));
        if (milestoneCell) {
          milestoneCell.components[0].label = item.milestone;
          milestoneCell.components[0].html = item.milestone;
        }

        const milestoneIDCell = milestoneRow.find((cell) => cell.components?.[0]?.key?.startsWith("ID"));
        if (milestoneIDCell) {
          milestoneIDCell.components[0].label = `M${mileValue}`;
          milestoneIDCell.components[0].html = `M${mileValue}`;
        }
        rows.push(milestoneRow);
      }

      if (Array.isArray(item?.items) && item.items.length) {
        item.items.forEach((subItem, idx) => {
          const value = idx + 1;
          const unique = item?.milestone ? `${idx + 1} M${index + 1}` : `${idx + 1} ${subItem}`;
          const phaseRow = JSON.parse(JSON.stringify(sampleContentRow)).map((cell) => ({
            components: applyDynamicKeysAndClasses(cell.components, unique, "", ""),
          }));

          const phaseMilestoneCell = phaseRow.find((cell) => cell.components?.[0]?.key?.includes("Phases"));
          if (phaseMilestoneCell) {
            phaseMilestoneCell.components[0].label = subItem;
            phaseMilestoneCell.components[0].html = subItem;
          }

          const phaseIDCell = phaseRow.find((cell) => cell.components?.[0]?.key?.startsWith("ID"));
          if (phaseIDCell) {
            phaseIDCell.components[0].label = `${value}`;
            phaseIDCell.components[0].html = `${value}`;
          }
          rows.push(phaseRow);
        });
      }
    });

    return {
      cellAlignment: "left",
      bordered: true,
      key: title,
      type: "table",
      numRows: rows.length,
      numCols: header.length,
      input: false,
      tableView: false,
      customClass: "transition-phase-table",
      rows,
    };
  }

  async createTransitionTemplateJSONWithOptions(body) {
    const {
      header,
      title = "transitionPhase",
      updatedContent = [],
      sampleContentRow = [],
      mileStoneContent = [],
    } = body;

    const rows = [header];
    const getAlphabet = (index) => String.fromCharCode(65 + index);

    updatedContent.forEach((item, index) => {
      if (item?.milestone) {
        const mileValue = index + 1;
        const milestoneRow = JSON.parse(JSON.stringify(mileStoneContent)).map((cell) => ({
          components: newApplyDynamicKeysAndClasses(cell.components, mileValue, "M"),
        }));

        const milestoneCell = milestoneRow.find((cell) => cell.components?.[0]?.key?.includes("subheading_milestone"));
        if (milestoneCell) {
          milestoneCell.components[0].label = item.milestone;
          milestoneCell.components[0].html = item.milestone;
        }

        const milestoneIDCell = milestoneRow.find((cell) => cell.components?.[0]?.key?.startsWith("ID"));
        if (milestoneIDCell) {
          milestoneIDCell.components[0].label = `M${mileValue}`;
          milestoneIDCell.components[0].html = `M${mileValue}`;
        }
        rows.push(milestoneRow);
      }

      if (Array.isArray(item?.items) && item.items.length) {
        item.items.forEach((subItem, idx) => {
          const value = idx + 1;
          const alphabets = getAlphabet(idx);
          const unique = item?.milestone ? `${idx + 1} M${index + 1}` : subItem?.value ? `${idx + 1} ${subItem?.value}` : `${idx + 1}`;
          const phaseRow = JSON.parse(JSON.stringify(sampleContentRow)).map((cell) => ({
            components: newApplyDynamicKeysAndClasses(cell.components, unique, ""),
          }));

          const phaseMilestoneCell = phaseRow.find((cell) => cell.components?.[0]?.key?.includes("Phases"));
          if (phaseMilestoneCell) {
            phaseMilestoneCell.components[0].label = subItem?.value ?? subItem;
            phaseMilestoneCell.components[0].html = subItem?.value ?? subItem;
          }

          const phaseIDCell = phaseRow.find((cell) => cell.components?.[0]?.key?.startsWith("ID"));
          if (phaseIDCell) {
            phaseIDCell.components[0].label = `${alphabets.toLowerCase()}`;
            phaseIDCell.components[0].html = `${alphabets.toLowerCase()}`;
          }

          const outcomes = phaseRow.find((cell) => cell.components?.[0]?.key?.startsWith("outcome"));
          if (outcomes && subItem.option?.length > 0) {
            const outcomesOptions = subItem.option?.map((val) => ({
              label: val,
              value: val,
            })) || [];
            outcomes.components[0].data = {
              ...outcomes.components[0].data,
              values: outcomesOptions
            };
          }
          rows.push(phaseRow);
        });
      }
    });

    return {
      cellAlignment: "left",
      bordered: true,
      key: title,
      type: "table",
      numRows: rows.length,
      numCols: header.length,
      input: false,
      tableView: false,
      customClass: "transition-phase-table",
      rows,
    };
  }

  async checkTransitionComplete(id) {
    const transition_completed = await getStatusById("Transition", "transition_completed");
    const transition = await TransitionPhaseTemplateValueMappings.findById(id);
    let isTranstion = false;
    if (transition) {
      isTranstion = transition?.oStatus_Id.toString() === transition_completed;
    }
    return isTranstion;
  }

  async actionTransitionProcess(body, tokenDetails) {
    const { id, action, mapped_phases, reason, users, AccountId } = body;
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const userId = tokenDetails.idofuser;

    const existingTransition = await TransitionPhaseTemplateValueMappings.findById(id);
    let approval = await CRMApprovalSetting.findOne({
      accountId: mongoose.Types.ObjectId(AccountId),
      approvalType: 'Transition',
      opportunityId: existingTransition.opportunityDetails[0].opportunityId,
      bActive: true
    });

    if (!approval) {
      approval = await CRMApprovalSetting.findOne({
        accountId: mongoose.Types.ObjectId(AccountId),
        approvalType: 'Transition',
        bActive: true
      });
    }
    if (!approval) {
      approval = await CRMApprovalSetting.findOne({
        accountId: mongoose.Types.ObjectId(selectedCompanyId),
        approvalType: 'Transition',
        bActive: true
      });
    }

    if (!approval && ![1, 4, 6].includes(action)) {
      return {
        success: false,
        message: "Transition approvers are not configured for the account. Please configure approvers to proceed.",
        isTransitionInitiated: true,
      };
    }

    const actionComments = { 2: "On Hold", 3: "Cancel", 5: "Reinitiate", 7: "Clone" };

    const [
      transition_completed,
      transition_cancel,
      transition_hold,
      transition_in_progress,
      transition_new,
      approval_pending,
    ] = await Promise.all([
      getStatusById("Transition", "transition_completed"),
      getStatusById("Transition", "transition_cancel"),
      getStatusById("Transition", "transition_hold"),
      getStatusById("Transition", "transition_in_progress"),
      getStatusById("Transition", "transition_new"),
      getStatusById("Transition", "transition_approval_pending"),
    ]);

    const statusMap = {
      2: transition_hold,
      3: transition_cancel,
      4: transition_completed,
      5: transition_in_progress,
      6: transition_in_progress,
      7: transition_new,
    };
    const status = statusMap[action] || transition_in_progress;

    if ([4, 6].includes(action)) {
      await TransitionPhaseTemplateValueMappings.findByIdAndUpdate(
        id,
        {
          $set: { oStatus_Id: status, dUpdatedAt: new Date(), cUpdatedBy: userId },
          $push: {
            reason: { cNotes: reason, dCreatedAt: new Date(), cCreatedBy: userId, statusId: status }
          },
        },
        { new: true, runValidators: true }
      );
      return {
        success: true,
        message: action === 6 ? "The transition has been started successfully." : "The transition has been completed successfully.",
        data: { isTransitionManagement: true },
      };
    }

    if (action === 1) {
      const process = await PhaseTemplateMasterMappings.findById(mapped_phases);
      const transition = await TransitionPhaseTemplateValueMappings.findById(id);

      if (process && transition) {
        transition.transitionDetails = await Promise.all(
          (process.transitionDetails || []).map(async (v) => {
            const templateDetails = await TransitionMastTemplates.findById(v?.oTemplateId);
            const data = { componentValues: {}, tollgateValues: {}, KpiValues: {} };

            if (templateDetails?.components?.length) {
              templateDetails.components.forEach((item) => {
                item?.rows?.forEach((row) => {
                  row?.forEach((column) => {
                    if (!Array.isArray(column?.components)) return;
                    column.components.forEach((component) => {
                      const key = component?.key;
                      if (!key) return;
                      if (item?.key?.startsWith("phases_")) {
                        data.componentValues[key] = component?.defaultValue;
                      } else if (item?.key?.startsWith("kpi_")) {
                        data.KpiValues[key] = component?.defaultValue;
                      } else if (item?.key?.startsWith("tollgates_")) {
                        data.tollgateValues[key] = component?.defaultValue;
                      }
                    });
                  });
                });
              });
            }

            return {
              iSortOrder: v?.iSortOrder,
              oTemplateId: v?.oTemplateId,
              oPhaseId: v?.oPhaseId,
              ...data,
            };
          })
        );
        transition.oStatus_Id = transition_in_progress;
        transition.mappedPhaseTemplate_Id = mapped_phases;
        transition.cUpdatedBy = userId;
        transition.dUpdatedAt = new Date();
        transition.summary = process.transitionDetails?.map((v) => ({ cPhaseId: v.oPhaseId.toString() })) || [];
        transition.phasesTableValues = {};
        transition.reason.push({
          cNotes: reason,
          dCreatedAt: new Date(),
          cCreatedBy: userId,
          statusId: transition_in_progress,
        });

        await transition.save();
        await TransitionComment.deleteMany({ transitionId: id });
      }

      return {
        success: true,
        message: "Transition template updated successfully.",
        data: { isTransitionManagement: true },
      };
    }

    const updateQuery = {
      oStatus_Id: status,
      dUpdatedAt: new Date(),
      cUpdatedBy: userId,
    };
    const updateOperation = { $set: updateQuery };

    if (approval?.cUserLevels?.length) {
      const groupId = new mongoose.Types.ObjectId();
      let opportunity = await LeadsOpportunityProductCompanyMappings.findById(approval.opportunityId?.toString());
      if (!opportunity) {
        opportunity = await LeadsOpportunityProductCompanyMappings.findById(existingTransition.opportunityDetails[0].opportunityId.toString());
      }
      let account;
      if (approval.accountId.toString() === selectedCompanyId) {
        account = await masterCompanyModel.findById(opportunity.oCompany_Id.toString()) ||
          await LeadCompanyDetails.findById(opportunity.oCompany_Id?.toString());
      } else {
        account = await masterCompanyModel.findById(approval.accountId?.toString()) ||
          await LeadCompanyDetails.findById(approval.accountId?.toString());
      }

      const currentLevels = await Promise.all(
        approval.cUserLevels.flatMap((levelItem, index) =>
          levelItem.users.map(async (user) => {
            let resolvedUserId = null;
            if (user === "Opportunity Account Manager") {
              resolvedUserId = opportunity?.oOpportunity_Owner || null;
            } else if (user === "Account Accounts Manager") {
              resolvedUserId = account?.oAccountManagerUserId || null;
            } else if (user === "Parent Account Manager") {
              if (account?.oParentComp_id) {
                const parentAccount = await masterCompanyModel.findById(account.oParentComp_id) ||
                  await LeadCompanyDetails.findById(account.oParentComp_id);
                if (parentAccount?.oAccountManagerUserId) {
                  resolvedUserId = parentAccount?.oAccountManagerUserId || null;
                } else if (approval.cUserLevels?.length === 1) {
                  resolvedUserId = account?.oAccountManagerUserId || null;
                }
              } else if (approval.cUserLevels?.length === 1) {
                resolvedUserId = account?.oAccountManagerUserId || null;
              }
            } else {
              resolvedUserId = user || null;
            }
            if (!resolvedUserId) return null;

            return {
              level: levelItem.level,
              user_id: resolvedUserId,
              isApproved: false,
              isRejected: false,
              isCurrentLevel: index === 0,
              isApproveReqMailSent: false,
            };
          })
        )
      );

      const filteredLevels = currentLevels.filter(Boolean);

      updateOperation.$push = {
        transition_logs: {
          groupId,
          approvalId: approval._id,
          actionRequest: {
            cNotes: reason,
            dCreatedAt: new Date(),
            cCreatedBy: userId,
            statusId: status,
            transition_manager: action === 5 ? users : null,
            oldStatusId: existingTransition.oStatus_Id.toString(),
            isClone: action === 7,
          },
          currentLevel: filteredLevels,
          statusId: approval_pending,
          dCreatedAt: new Date(),
          cCreatedBy: userId,
          comment: actionComments[action] || "Requested Complete"
        },
        reason: {
          cNotes: "Level-1 Approval Pending",
          dCreatedAt: new Date(),
          cCreatedBy: userId,
          statusId: approval_pending,
          approvalNotes: "Level-1 Approval Pending"
        },
      };
      updateOperation.$set.oStatus_Id = approval_pending;
    }

    const updatedTransition = await TransitionPhaseTemplateValueMappings.findByIdAndUpdate(
      id,
      updateOperation,
      { new: true, runValidators: true }
    );

    return {
      success: true,
      message: "Transition approval processed successfully.",
      data: { isTransitionManagement: !!updatedTransition },
    };
  }

  async existingTransitionNumber(tokenDetails) {
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const transitionList = await TransitionPhaseTemplateValueMappings.find();

    for (const transition of transitionList) {
      let runNo;
      let prefix = "TRN";
      let runDoc = await RunningNumberSetting.findOne({
        cModuleName: "Transition Number",
        oCompanyId: selectedCompanyId,
      });

      if (!runDoc) {
        runDoc = await RunningNumberSetting.create({
          cModuleName: "Transition Number",
          cPrefix: prefix,
          iNumberLength: 10,
          oCompanyId: selectedCompanyId,
          runningNumbers: [
            {
              iModuleLastNumber: 1,
              dUpdatedAt: new Date(),
              bActive: true,
              _id: new mongoose.Types.ObjectId(),
            },
          ],
        });
        prefix = runDoc.cPrefix;
        runNo = 1;
      } else {
        const activeIdx = runDoc.runningNumbers.findIndex((n) => n.bActive === true);
        if (activeIdx === -1) {
          throw new Error("No active running number configuration found");
        }
        const active = runDoc.runningNumbers[activeIdx];
        runNo = active.iModuleLastNumber + 1;
        prefix = runDoc.cPrefix;

        const updateField = `runningNumbers.${activeIdx}.iModuleLastNumber`;
        const updateDateField = `runningNumbers.${activeIdx}.dUpdatedAt`;

        await RunningNumberSetting.updateOne(
          { _id: runDoc._id },
          {
            $inc: { [updateField]: 1 },
            $set: { [updateDateField]: new Date() },
          }
        );
      }

      const paddedRunNo = runNo.toString().padStart(2, "0");
      transition.transitionNo = `${prefix}${paddedRunNo}`;
      await transition.save();
    }
    return true;
  }

  async existingTransitionTemplateStore(body, tokenDetails) {
    const selectedCompanyId = tokenDetails?.selectedCompanyId;
    const { isUpdateAccountOwner, id, isUpdateTemplate } = body;

    const transitionList = await TransitionPhaseTemplateValueMappings.find({ oUserCompanyId: mongoose.Types.ObjectId(selectedCompanyId) });
    const ownerList = await TransitionMastActionOwner.find({ bActive: true }).sort({ dCreatedAt: 1 });
    const actionOwnerMapping = ownerList.slice(0, 5).map((val) => ({ actionOwnerId: val._id }));

    for (const transition of transitionList) {
      if (!transition?.cTransition_Name) {
        const pipeline = [
          { $match: { _id: new mongoose.Types.ObjectId(transition._id) } },
          {
            $lookup: {
              from: "leads_opportunity_product_company_mappings",
              localField: "opportunityDetails.opportunityId",
              foreignField: "_id",
              as: "opp_details",
            },
          },
          { $unwind: { path: "$opp_details", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "mast_company_informations",
              localField: "opp_details.oCompany_Id",
              foreignField: "_id",
              as: "mast_company",
            },
          },
          { $unwind: { path: "$mast_company", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "leads_company_details",
              localField: "opp_details.oCompany_Id",
              foreignField: "_id",
              as: "lead_company",
            },
          },
          { $unwind: { path: "$lead_company", preserveNullAndEmptyArrays: true } },
          {
            $addFields: { companyDetails: { $ifNull: ["$mast_company", "$lead_company"] } },
          },
        ];
        const tr = await TransitionPhaseTemplateValueMappings.aggregate(pipeline);
        if (tr.length > 0 && tr[0]?.companyDetails?.company_name) {
          transition.cTransition_Name = `${tr[0].companyDetails.company_name} ${transition.transitionNo || ""}`;
        }
      }

      if (isUpdateAccountOwner) {
        if (!Array.isArray(transition.actionOwner) || transition.actionOwner.length === 0) {
          transition.actionOwner = actionOwnerMapping;
        }
      }

      if (isUpdateTemplate && Array.isArray(transition.transitionDetails)) {
        transition.transitionDetails = await Promise.all(
          transition.transitionDetails.map(async (detail) => {
            if (!detail?.oTemplateId) return detail;
            const formTemplate = await TransitionMastTemplates.findById(detail.oTemplateId);
            return {
              ...(detail.toObject ? detail.toObject() : detail),
              templateData: formTemplate || null,
            };
          })
        );
      }
      await transition.save();
    }

    if (id) {
      const transition = await TransitionPhaseTemplateValueMappings.findById(id);
      if (transition) {
        if (isUpdateAccountOwner) {
          transition.actionOwner = actionOwnerMapping;
        }
        await transition.save();
      }
    }
    return true;
  }

  async clientDashboardReports(tokenDetails) {
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const pipeline = [
      {
        $match: { oUserCompanyId: new mongoose.Types.ObjectId(selectedCompanyId) },
      },
      {
        $lookup: {
          from: "leads_opportunity_product_company_mappings",
          localField: "opportunityDetails.opportunityId",
          foreignField: "_id",
          as: "opp_details",
        },
      },
      { $unwind: { path: "$opp_details", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "mast_company_informations",
          localField: "opp_details.oCompany_Id",
          foreignField: "_id",
          as: "mast_company",
        },
      },
      { $unwind: { path: "$mast_company", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_company_details",
          localField: "opp_details.oCompany_Id",
          foreignField: "_id",
          as: "lead_company",
        },
      },
      { $unwind: { path: "$lead_company", preserveNullAndEmptyArrays: true } },
      {
        $addFields: { companyDetails: { $ifNull: ["$mast_company", "$lead_company"] } },
      },
      {
        $lookup: {
          from: "useradmin_mast_users",
          localField: "transition_manager",
          foreignField: "_id",
          as: "transition_user_list",
        },
      },
      { $unwind: { path: "$transition_user_list", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "useradmin_mast_users",
          localField: "companyDetails.oAccountManagerUserId",
          foreignField: "_id",
          as: "company_user_list",
        },
      },
      { $unwind: { path: "$company_user_list", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_master_statuses",
          localField: "oStatus_Id",
          foreignField: "_id",
          as: "status_details",
        },
      },
      { $unwind: { path: "$status_details", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "transition_company_survey_mappings",
          localField: "_id",
          foreignField: "transitionId",
          as: "survey_details",
        },
      },
      { $unwind: { path: "$survey_details", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          Company: "$companyDetails.company_name",
          FTEs: { $literal: "" },
          "ABG Lead": "$transition_user_list.loginName",
          Status: "$status_details.cStatus_Name",
          "Delayed/On Track": { $literal: "" },
          "Transition Start": { $literal: "" },
          "Go-Live": { $literal: "" },
          "Transition Complete": { $literal: "" },
          Comments: { $literal: "" },
          "Transition Score(CSAT)": "$survey_details.overAllCSATScore",
          "US_Account Manager": "$company_user_list.loginName",
          "India_Operation Head": { $literal: "" },
        },
      },
    ];

    return TransitionPhaseTemplateValueMappings.aggregate(pipeline);
  }

  async clientDashboardReportsYear(tokenDetails) {
    return this.clientDashboardReports(tokenDetails);
  }

  async approveOrRejectTransition(body, tokenDetails) {
    const userId = tokenDetails.idofuser;
    const approval_pending = await getStatusById("Transition", "transition_approval_pending");
    const rejectedStatus = await getStatusById("InvoiceDraft", "draft_reject");
    const approvedStatus = await getStatusById("InvoiceDraft", "draft_approved");
    const transition_completed = await getStatusById("Transition", "transition_completed");

    const { id, appRej, reason, isLastLevelApproval, approvalRequest } = body;

    const transition = await TransitionPhaseTemplateValueMappings.findById(id);
    if (!transition) {
      throw new Error("Transition not found");
    }

    transition.reason = transition.reason || [];
    transition.transition_logs = transition.transition_logs || [];

    const lastLog = transition.transition_logs[transition.transition_logs.length - 1];
    const actionRequest = lastLog?.actionRequest;
    const OldStatus = actionRequest?.oldStatusId;

    const currentLog = transition.transition_logs.find(log =>
      Array.isArray(log.currentLevel) &&
      log.currentLevel.some(level => level?.isCurrentLevel)
    );

    if (!currentLog) {
      throw new Error("No active approval level found");
    }

    const validLevels = currentLog.currentLevel.filter(level => level && level.user_id);
    const currentUserLevel = validLevels.find(level =>
      level.user_id.toString() === userId.toString() &&
      level.isCurrentLevel
    );

    if (!currentUserLevel) {
      throw new Error("You are not authorized for this approval level");
    }

    if (appRej === "reject") {
      let rejectedLevelName = "";
      validLevels.forEach(level => {
        if (level.isCurrentLevel) {
          level.isCurrentLevel = false;
          rejectedLevelName = level.level;
          if (level.user_id.toString() === userId.toString()) {
            level.isRejected = true;
          }
        }
      });

      transition.reason.push({
        cNotes: reason || "Rejected",
        dCreatedAt: new Date(),
        cCreatedBy: userId,
        statusId: rejectedStatus,
        approvalNotes: `${rejectedLevelName} Rejected`,
      });

      transition.oStatus_Id = OldStatus;
      transition.reason.push({
        cNotes: "Transition rejected. Status reverted.",
        dCreatedAt: new Date(),
        cCreatedBy: userId,
        statusId: OldStatus,
      });

      await transition.save();
      return transition;
    }

    if (currentUserLevel.isApproved) {
      throw new Error("You have already approved this level");
    }

    currentUserLevel.isApproved = true;
    currentUserLevel.isCurrentLevel = false;

    transition.reason.push({
      cNotes: reason || "Approved",
      dCreatedAt: new Date(),
      cCreatedBy: userId,
      statusId: approvedStatus,
      approvalNotes: `${currentUserLevel.level} Approved`,
    });

    const allApproved = validLevels.every(level => level.isApproved && !level.isRejected);
    const nextLevel = validLevels.find(level => !level.isApproved && !level.isRejected);

    if (nextLevel) {
      nextLevel.isCurrentLevel = true;
      transition.reason.push({
        cNotes: `${nextLevel.level} Approval Pending`,
        dCreatedAt: new Date(),
        cCreatedBy: userId,
        statusId: approval_pending,
        approvalNotes: `${nextLevel.level} Approval Pending`,
      });
    }

    if (allApproved && isLastLevelApproval) {
      transition.oStatus_Id = actionRequest?.isClone ? transition_completed : approvalRequest;
      transition.transition_manager = actionRequest?.transition_manager ?? transition.transition_manager;
      transition.reason.push({
        cNotes: actionRequest?.cNotes || "Final Approval Completed",
        dCreatedAt: new Date(),
        cCreatedBy: userId,
        statusId: approvalRequest,
      });
    }

    await transition.save();
    return transition;
  }

  async checkAccountTransitionInitiated(companyId, tokenDetails) {
    const selectedCompanyId = tokenDetails?.selectedCompanyId;
    let approval = await CRMApprovalSetting.findOne({
      accountId: mongoose.Types.ObjectId(companyId),
      approvalType: 'Transition',
      bActive: true
    });
    if (!approval) {
      approval = await CRMApprovalSetting.findOne({
        accountId: mongoose.Types.ObjectId(selectedCompanyId),
        approvalType: 'Transition',
        bActive: true
      });
    }
    if (!approval) {
      return { success: false, message: "Approval not configured", isTransitionInitiated: true };
    }
    return { success: true, isTransitionInitiated: approval?.cUserLevels?.length === 0 };
  }

  async getTransitonApprovalAccountList(tokenDetails) {
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const objectCompanyId = new mongoose.Types.ObjectId(selectedCompanyId);

    const pipeline = [
      {
        $match: {
          oUsercompanyId: objectCompanyId,
          transition_Approvals: { $exists: true, $ne: [] }
        }
      },
      {
        $project: {
          _id: 1,
          company_name: 1,
          transition_Approvals: 1
        }
      }
    ];

    const mastCompany = await masterCompanyModel.aggregate(pipeline);
    const leadCompany = await LeadCompanyDetails.aggregate(pipeline);
    return [...mastCompany, ...leadCompany];
  }

  async checkAccountTransitionIsApprovalLevel(id) {
    const pipeline = [
      {
        $lookup: {
          from: "leads_opportunity_product_company_mappings",
          localField: "opportunityDetails.opportunityId",
          foreignField: "_id",
          as: "opp_details",
        },
      },
      { $unwind: { path: "$opp_details", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "mast_company_informations",
          localField: "opp_details.oCompany_Id",
          foreignField: "_id",
          as: "mast_company",
        },
      },
      { $unwind: { path: "$mast_company", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_company_details",
          localField: "opp_details.oCompany_Id",
          foreignField: "_id",
          as: "lead_company",
        },
      },
      { $unwind: { path: "$lead_company", preserveNullAndEmptyArrays: true } },
      {
        $addFields: { companyDetails: { $ifNull: ["$mast_company", "$lead_company"] } },
      },
      {
        $match: {
          "companyDetails._id": new mongoose.Types.ObjectId(id),
          transition_logs: {
            $elemMatch: {
              currentLevel: {
                $elemMatch: { isCurrentLevel: true }
              }
            }
          }
        },
      },
      { $project: { _id: 1 } }
    ];

    const transition = await TransitionPhaseTemplateValueMappings.aggregate(pipeline);
    return transition?.length > 0;
  }

  async cloneTransitionProcess(body, tokenDetails) {
    const userId = tokenDetails.idofuser;
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const transition_new = await getStatusById("Transition", "transition_new");
    const transition_cloned = await LeadsActivationStatus.findOne({ cStatus_Code: "transition_cloned", cStatus_Type: "Transition" });

    const { id, users, comments, transitionName } = body;
    const transition = await TransitionPhaseTemplateValueMappings.findById(id);
    if (!transition) {
      throw new Error("Transition process not found");
    }

    let runNo;
    let prefix = "TRN";
    const runDoc = await RunningNumberSetting.findOne({
      cModuleName: "Transition Number",
      oCompanyId: selectedCompanyId,
    });

    if (!runDoc) {
      const newDoc = await RunningNumberSetting.create({
        cModuleName: "Transition Number",
        cPrefix: "TRN",
        iNumberLength: 10,
        oCompanyId: selectedCompanyId,
        runningNumbers: [
          {
            iModuleLastNumber: 1,
            dUpdatedAt: new Date(),
            bActive: true,
            _id: new mongoose.Types.ObjectId(),
          },
        ],
      });
      prefix = newDoc.cPrefix;
      runNo = 1;
    } else {
      const activeIdx = runDoc.runningNumbers.findIndex(n => n.bActive);
      const active = runDoc.runningNumbers[activeIdx];
      const updateField = `runningNumbers.${activeIdx}.iModuleLastNumber`;
      const updateDateField = `runningNumbers.${activeIdx}.dUpdatedAt`;

      await RunningNumberSetting.updateOne(
        { _id: runDoc._id },
        { $inc: { [updateField]: 1 }, $set: { [updateDateField]: new Date() } }
      );
      runNo = active.iModuleLastNumber + 1;
      prefix = runDoc.cPrefix;
    }

    const paddedRunNo = runNo.toString().padStart(2, "0");
    const TRNNumber = `${prefix}${paddedRunNo}`;

    const reason = {
      cNotes: `New transition ID created successfully from Transition ID ${transition.transitionNo}. Comments: ${comments}`,
      dCreatedAt: new Date(),
      cCreatedBy: userId,
      statusId: transition_new
    };

    const transitionObj = transition.toObject();
    delete transitionObj._id;
    delete transitionObj.__v;
    delete transitionObj.phasesTableValues;
    delete transitionObj.summary;
    delete transitionObj.ktPlanner;
    delete transitionObj.actionTracker;
    delete transitionObj.riskLogs;
    delete transitionObj.matrix;
    delete transitionObj.transition_logs;
    delete transitionObj.transitionDetails;
    delete transitionObj.cUpdatedBy;
    delete transitionObj.dUpdatedAt;

    const mappedPhases = await PhaseTemplateMasterMappings.findById(transitionObj.mappedPhaseTemplate_Id.toString());
    const transitionDetails = await Promise.all(
      (mappedPhases.transitionDetails || []).map(async (value) => {
        const templateDetails = await TransitionMastTemplates.findById(value?.oTemplateId);
        const data = { componentValues: {}, tollgateValues: {}, KpiValues: {} };

        if (templateDetails?.components?.length) {
          templateDetails.components.forEach(item => {
            item?.rows?.forEach((row) => {
              row?.forEach((column) => {
                if (Array.isArray(column?.components)) {
                  column.components.forEach((component) => {
                    const key = component?.key;
                    if (!key) return;
                    if (item.key?.startsWith('phases_')) {
                      data.componentValues[key] = component.defaultValue;
                    } else if (item.key?.startsWith('kpi_')) {
                      data.KpiValues[key] = component.defaultValue;
                    } else if (item.key?.startsWith('tollgates_')) {
                      data.tollgateValues[key] = component.defaultValue;
                    }
                  });
                }
              });
            });
          });
        }

        return {
          iSortOrder: value?.iSortOrder,
          oTemplateId: value?.oTemplateId,
          oPhaseId: value?.oPhaseId,
          ...data
        };
      })
    );

    const clonedData = {
      ...transitionObj,
      cTransition_Name: transitionName,
      transitionNo: TRNNumber,
      cCreatedBy: userId,
      dCreatedAt: new Date(),
      reason: [reason],
      transition_logs: [],
      oStatus_Id: transition_new,
      transition_manager: users,
      transitionDetails
    };

    const createdRecord = await TransitionPhaseTemplateValueMappings.create(clonedData);
    if (createdRecord) {
      transition.reason = transition.reason || [];
      const note = {
        cNotes: `New transition has been added successfully. Transition ID: ${createdRecord.transitionNo}. Comments: ${comments}`,
        dCreatedAt: new Date(),
        cCreatedBy: userId,
        statusId: transition_cloned,
        isStandalone: true
      };
      transition.reason.push(note);
      await transition.save();
    }
    return createdRecord;
  }

  async opportunityListByTransition(tokenDetails) {
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    return LeadsOpportunityProductCompanyMappings.find({
      bActive: true,
      oUserCompany_Id: mongoose.Types.ObjectId(selectedCompanyId)
    });
  }

  async checkTransitionName(name, tokenDetails) {
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const existingTransition = await TransitionPhaseTemplateValueMappings.findOne({
      cTransition_Name: { $regex: `^${name.trim()}$`, $options: "i" },
      oUserCompanyId: new mongoose.Types.ObjectId(selectedCompanyId)
    });
    return !!existingTransition;
  }

  // --- Survey Logic ---
  async getAllSurveyTemplates() {
    const allTemplates = await TransitionMastTemplates.find({}).lean();
    return allTemplates?.filter((val) => val.active).filter((template) =>
      template.components?.some((component) =>
        component?.key?.toLowerCase().includes("survey_")
      )
    );
  }

  async getAllSavedSurveyTemplates(transitionId) {
    return MastCSATSurveyTemplates.aggregate([
      {
        $match: {
          transitionId: mongoose.Types.ObjectId(transitionId),
          bActive: true
        },
      },
      {
        $lookup: {
          from: "form_templates",
          localField: "oTemplateId",
          foreignField: "_id",
          as: "templateDetails",
        },
      },
      {
        $unwind: {
          path: "$templateDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "leads_subclasses",
          localField: "subClassId",
          foreignField: "_id",
          as: "subClassDetails",
        },
      },
      {
        $unwind: {
          path: "$subClassDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          components: "$templateDetails.components",
        },
      },
      {
        $project: {
          templateDetails: 0,
        },
      },
      { $sort: { dCreatedAt: -1 } },
    ]);
  }

  async getValueMappedSurveybyId(id) {
    const surveyMappedId = new mongoose.Types.ObjectId(id);
    const surveyMapping = await CSATValueMappings.aggregate([
      { $match: { _id: surveyMappedId } },
      {
        $lookup: {
          from: "form_templates",
          localField: "SurveyDetails.oTemplateId",
          foreignField: "_id",
          as: "SurveyTemplateDetails",
        },
      },
      { $unwind: "$SurveyTemplateDetails" },
      {
        $lookup: {
          from: "transition_phase_template_value_mappings",
          localField: "transitionId",
          foreignField: "_id",
          as: "transitionDetails",
        },
      },
      { $unwind: "$transitionDetails" },
      {
        $lookup: {
          from: "leads_opportunity_product_company_mappings",
          localField: "transitionDetails.opportunityDetails.opportunityId",
          foreignField: "_id",
          as: "oppDetails",
        },
      },
      { $unwind: "$oppDetails" },
      {
        $lookup: {
          from: "mast_company_informations",
          localField: "oppDetails.oCompany_Id",
          foreignField: "_id",
          as: "mast_companyDetails",
        },
      },
      { $unwind: { path: "$mast_companyDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_company_details",
          localField: "oppDetails.oCompany_Id",
          foreignField: "_id",
          as: "leads_companyDetails",
        },
      },
      { $unwind: { path: "$leads_companyDetails", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          companyDetails: {
            $cond: {
              if: {
                $and: [
                  { $ne: ["$leads_companyDetails", null] },
                  { $eq: ["$leads_companyDetails.IsConvertedtoClient", false] },
                ],
              },
              then: "$leads_companyDetails",
              else: "$mast_companyDetails",
            },
          },
        },
      },
      {
        $project: {
          oActivation_Id: 1,
          oUserCompanyId: 1,
          recipients_response: 1,
          bActive: 1,
          isMailsent: 1,
          dCreatedAt: 1,
          dUpdatedAt: 1,
          companyDetails: 1,
          SurveyDetails: {
            $map: {
              input: "$SurveyDetails",
              as: "sd",
              in: {
                oTemplateId: "$$sd.oTemplateId",
                cSurveyName: "$$sd.cSurveyName",
                SurveyValues: "$SurveyTemplateDetails.components",
                cSurveyTemplateId: "$$sd.cSurveyTemplateId"
              },
            },
          },
          "SurveyTemplateDetails._id": 1,
          "SurveyTemplateDetails.templateName": 1,
          "SurveyTemplateDetails.templateDescription": 1,
          "SurveyTemplateDetails.publish": 1,
          "SurveyTemplateDetails.active": 1,
        },
      },
    ]);
    return surveyMapping[0];
  }

  async saveSurveyTemplates(body, tokenDetails) {
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const idofuser = tokenDetails.idofuser;
    const {
      cSurveyName,
      oTemplateId,
      iSurveyOrder,
      bActive = false,
      publish = false,
      transitionId,
      oActivation_Id, oTask_Id, subClassId
    } = body;

    if (!cSurveyName || !oTemplateId || !iSurveyOrder) {
      throw new Error("Missing required fields: cSurveyName, oTemplateId, or iSurveyOrder");
    }

    const newSurveyTemplate = new MastCSATSurveyTemplates({
      cSurveyName,
      oTemplateId,
      publish,
      iSurveyOrder,
      cCreatedBy: idofuser,
      cUpdatedBy: idofuser,
      oUserCompanyId: selectedCompanyId,
      bActive,
      transitionId,
      oActivation_Id, oTask_Id, subClassId
    });

    return newSurveyTemplate.save();
  }

  async deleteSurveyTemplate(id, tokenDetails) {
    const idofuser = tokenDetails.idofuser;
    const existingTemplate = await MastCSATSurveyTemplates.findById(id);
    if (!existingTemplate) {
      throw new Error("Template not found");
    }

    const checkAlreadySent = await CSATValueMappings.findOne({
      "SurveyDetails.cSurveyTemplateId": mongoose.Types.ObjectId(id),
      transitionId: existingTemplate.transitionId.toString()
    });
    if (checkAlreadySent) {
      return { success: false, message: "You cannot delete a survey that has already been sent to the client." };
    }

    if (existingTemplate.cCreatedBy.toString() !== idofuser.toString()) {
      throw new Error("You are not authorized to delete this Template");
    }

    await MastCSATSurveyTemplates.findByIdAndUpdate({ _id: id }, { bActive: false }, { new: true });
    return { success: true };
  }

  async sendSurveyMailTemplate(body, tokenDetails) {
    const userId = tokenDetails.idofuser;
    const {
      recipients_response,
      SurveyDetails,
      oActivation_Id,
      oUserCompanyId,
      bActive,
      isMailsent,
      oTask_Id,
      transitionId,
      reSendMail, subClassId
    } = body;

    if (!recipients_response || !Array.isArray(recipients_response)) {
      throw new Error("recipients_response is required and must be an array");
    }
    if (!SurveyDetails || !Array.isArray(SurveyDetails) || SurveyDetails.length === 0) {
      throw new Error("SurveyDetails is required and must be a non-empty array");
    }
    if (!oUserCompanyId) {
      throw new Error("oUserCompanyId is required");
    }

    const processedRecipients = recipients_response.map((item) => {
      if (typeof item === "object" && item.email) {
        return {
          email: item.email,
          isSubmitted: item.isSubmitted || false,
          response: item.response || null,
          cSurveyTemplateId: item.cSurveyTemplateId
        };
      } else if (typeof item === "string") {
        return {
          email: item,
          isSubmitted: false,
          response: null,
          cSurveyTemplateId: SurveyDetails[0].cSurveyTemplateId
        };
      }
      throw new Error("Invalid recipient format");
    });

    let existingMapping;
    let newEmails = [];
    let existingEmails = [];

    if (transitionId) {
      existingMapping = await CSATValueMappings.findOne({
        transitionId: new mongoose.Types.ObjectId(transitionId),
        oUserCompanyId: new mongoose.Types.ObjectId(oUserCompanyId),
      });
    }

    if (existingMapping) {
      let toCheckEmail = true;
      if (subClassId) {
        const oTemplateId = existingMapping.SurveyDetails.find((item) => item.cSurveyTemplateId.toString() === SurveyDetails[0].cSurveyTemplateId)?.cSurveyTemplateId ?? null;
        if (!oTemplateId) {
          toCheckEmail = false;
          newEmails = processedRecipients.map((r) => r.email);
          existingMapping.SurveyDetails = [
            ...existingMapping.SurveyDetails,
            ...SurveyDetails,
          ];
        }
      }

      if (toCheckEmail) {
        existingEmails = existingMapping.recipients_response.map((r) => r.email);
        newEmails = processedRecipients.map((r) => r.email);

        const duplicateEmails = newEmails.filter((email) => existingEmails.includes(email));
        if (duplicateEmails.length > 0) {
          return {
            success: false,
            message: "Cannot send survey. Users with these email IDs have already been sent survey emails: " + duplicateEmails.join(", "),
            duplicateEmails
          };
        }
      }

      const emailsToSend = newEmails.filter((email) => !existingEmails.includes(email));
      if (emailsToSend.length === 0) {
        return { success: false, message: "No new email addresses to send surveys to" };
      }

      existingMapping.recipients_response = [
        ...existingMapping.recipients_response,
        ...processedRecipients,
      ];
      existingMapping.cUpdatedBy = new mongoose.Types.ObjectId(userId);
      existingMapping.dUpdatedAt = new Date();
      await existingMapping.save();

      await emailService.surveyMailNotification({
        emailIds: emailsToSend,
        surveyTemplateId: SurveyDetails[0].oTemplateId,
        surveyMappedId: existingMapping._id,
      });

      return { success: true, data: existingMapping, emailsSent: emailsToSend };
    }

    const emailArray = processedRecipients.map((recipient) => recipient.email);
    const newMapping = new CSATValueMappings({
      oCompanyId: new mongoose.Types.ObjectId(oUserCompanyId),
      SurveyDetails: SurveyDetails.map((detail) => ({
        oTemplateId: new mongoose.Types.ObjectId(detail.oTemplateId),
        cSurveyName: detail.cSurveyName,
        cSurveyTemplateId: detail.cSurveyTemplateId
      })),
      recipients_response: processedRecipients,
      cCreatedBy: new mongoose.Types.ObjectId(userId),
      cUpdatedBy: new mongoose.Types.ObjectId(userId),
      oUserCompanyId: new mongoose.Types.ObjectId(oUserCompanyId),
      bActive,
      isMailsent,
      transitionId: transitionId ? new mongoose.Types.ObjectId(transitionId) : null,
    });

    await newMapping.save();

    await emailService.surveyMailNotification({
      emailIds: emailArray,
      surveyTemplateId: SurveyDetails[0].oTemplateId,
      surveyMappedId: newMapping._id,
    });

    return { success: true, data: newMapping };
  }

  async submitSurveyResponse(body) {
    const {
      surveyMappingId,
      templateId,
      responses,
      recipientEmail,
      startTime,
      endTime,
      cSurveyTemplateId,
    } = body;

    if (!surveyMappingId || !templateId || !responses || !recipientEmail || !cSurveyTemplateId) {
      throw new Error("Missing required fields");
    }

    const found = await CSATValueMappings.findOne({
      _id: mongoose.Types.ObjectId(surveyMappingId),
      "recipients_response.email": recipientEmail,
      "recipients_response.cSurveyTemplateId": mongoose.Types.ObjectId(cSurveyTemplateId),
    }).lean();

    if (!found) {
      throw new Error("Survey mapping or recipient not found");
    }

    const validRatings = Object.entries(responses)
      .filter(([key, val]) => key.startsWith("survey_rating_") && val !== "N/A")
      .map(([, val]) => Number(val));

    const totalScore = validRatings.reduce((sum, val) => sum + val, 0);
    const percentage = validRatings.length
      ? Number(((totalScore / (validRatings.length * 5)) * 100).toFixed(2))
      : 0;

    const updatedRecipients_response = found.recipients_response.map((val) => {
      if (
        val.email === recipientEmail &&
        val.cSurveyTemplateId.toString() === cSurveyTemplateId
      ) {
        return {
          ...val,
          isSubmitted: true,
          response: responses,
          csatScore: percentage,
          surveyStartTime: startTime,
          surveyEndTime: endTime,
          dUpdatedAt: new Date(),
        };
      }
      return val;
    });

    const submittedResponses = updatedRecipients_response.filter((val) => val.isSubmitted === true);
    const totalScoreResponse = submittedResponses.reduce((sum, acc) => sum + (acc.csatScore || 0), 0);
    const overAllCSATScore = submittedResponses.length > 0
      ? Number((totalScoreResponse / submittedResponses.length).toFixed(2))
      : 0;

    return CSATValueMappings.findOneAndUpdate(
      { _id: mongoose.Types.ObjectId(surveyMappingId) },
      { $set: { recipients_response: updatedRecipients_response, overAllCSATScore } },
      { new: true }
    );
  }

  async getCSATScoreById(id, tokenDetails) {
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const surveyMappedId = new mongoose.Types.ObjectId(id);
    const surveyMapping = await CSATValueMappings.findById(surveyMappedId)
      .populate({
        path: 'recipients_response.cSurveyTemplateId',
        model: 'survey_templates',
        populate: {
          path: 'subClassId',
          model: 'leads_subclasses',
        }
      });

    if (!surveyMapping) {
      throw new Error("Survey mapping not found");
    }

    const company_product_details = await LeadsCustomerProductDetails.aggregate([
      { $match: { _id: surveyMapping.oActivation_Id } },
      {
        $lookup: {
          from: "mast_company_informations",
          localField: "oUserCompany_Id",
          foreignField: "_id",
          as: "parentCompanyDetails",
        },
      },
      { $unwind: { path: "$parentCompanyDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "mast_company_informations",
          localField: "oCompany_Id",
          foreignField: "_id",
          as: "companyDetails",
        },
      },
      { $unwind: { path: "$companyDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_productcategory_product_mappings",
          localField: "oProductCategory_Product_Mapping_Id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          parentCompanyName: "$parentCompanyDetails.company_name",
          companyName: "$companyDetails.company_name",
          productName: "$productDetails.cDisplayName",
        },
      },
    ]);

    const oUserCompanyName = await masterCompanyModel.findById(selectedCompanyId);
    const TemplateId = surveyMapping?.SurveyDetails[0]?.oTemplateId;
    const surveytemplate = await TransitionMastTemplates.findById(TemplateId);

    const extractAllFieldLabels = (template) => {
      const labels = {};
      if (!template || !template.components) return labels;
      const searchComponents = (components) => {
        if (!Array.isArray(components)) return;
        components.forEach((component) => {
          if (
            component.key &&
            (component.key.startsWith("survey_") || component.key === "submit")
          ) {
            labels[component.key] = component.label || component.key;
          }
          if (component.components) {
            searchComponents(component.components);
          }
          if (component.rows && Array.isArray(component.rows)) {
            component.rows.forEach((row) => {
              if (Array.isArray(row)) {
                row.forEach((cell) => {
                  if (cell && cell.components) {
                    searchComponents(cell.components);
                  }
                });
              }
            });
          }
        });
      };
      searchComponents(template.components);
      return labels;
    };

    const allFieldLabels = extractAllFieldLabels(surveytemplate);

    const processedResponses = surveyMapping.recipients_response.map((recipient) => {
      const responseData = { ...recipient.toObject() };
      responseData.formattedResponses = {};
      responseData.cSurveyTemplateId = recipient.cSurveyTemplateId;
      responseData.surveyStartTime = recipient.surveyStartTime;
      responseData.surveyEndTime = recipient.surveyEndTime;

      if (responseData.response && typeof responseData.response === "object") {
        Object.keys(responseData.response).forEach((key) => {
          const label = allFieldLabels[key] || key.replace("survey_", "").replace(/_/g, " ") || key;
          if (label.toLowerCase() === "survey_form") {
            return;
          }
          const processedLabel = label.includes(". ") ? label.split(". ").slice(1).join(". ") : label;
          responseData.formattedResponses[processedLabel] = responseData.response[key];
          responseData.individualScore = calculateIndividualScore(recipient);
        });
      } else {
        Object.entries(allFieldLabels).forEach(([key, label]) => {
          if (!key.startsWith("survey_")) return;
          if (label.toLowerCase() === "survey_form") return;
          const processedLabel = label.includes(". ") ? label.split(". ").slice(1).join(". ") : label;
          responseData.formattedResponses[processedLabel] = "";
        });
      }
      return responseData;
    });

    const csatScore = calculateScoreFromMapping(surveyMapping);

    const companyDetails = {
      parentCompanyName: company_product_details[0]?.parentCompanyName || oUserCompanyName.company_name,
      companyName: company_product_details[0]?.companyName || null,
      productName: company_product_details[0]?.productName || null,
    };

    return {
      surveyMappedId: surveyMapping._id,
      activationId: surveyMapping.oActivation_Id,
      score: csatScore,
      totalRespondents: surveyMapping.recipients_response.length,
      submittedResponses: surveyMapping.recipients_response.filter((r) => r.isSubmitted).length,
      recipients_response: processedResponses,
      surveyDetails: surveyMapping.SurveyDetails,
      companyProductDetails: companyDetails || {},
    };
  }

  async resendSurvey(body, tokenDetails) {
    const { surveyMappedId, email } = body;
    const userId = tokenDetails.idofuser;
    const existingMapping = await CSATValueMappings.findById(surveyMappedId);
    if (!existingMapping) {
      throw new Error("Survey mapping not found");
    }

    const recipientIndex = existingMapping.recipients_response.findIndex((recipient) => recipient.email === email);
    if (recipientIndex === -1) {
      throw new Error("Email not found in survey recipients");
    }

    existingMapping.recipients_response[recipientIndex].isSubmitted = false;
    existingMapping.recipients_response[recipientIndex].response = null;
    existingMapping.cUpdatedBy = new mongoose.Types.ObjectId(userId);
    existingMapping.dUpdatedAt = new Date();
    await existingMapping.save();

    await emailService.surveyMailNotification({
      emailIds: [email],
      surveyTemplateId: existingMapping.SurveyDetails[0].oTemplateId,
      surveyMappedId: existingMapping._id,
      isResend: true,
    });
    return existingMapping;
  }

  async updateScoreExitingSurvey() {
    const existingRecords = await CSATValueMappings.find();
    for (const record of existingRecords) {
      if (!record.recipients_response?.length) continue;

      const updatedResponse = record.recipients_response.map((val) => {
        const plainVal = val.toObject();
        if (!plainVal.response) {
          return {
            ...plainVal,
            csatScore: 0,
          };
        }

        const validRatings = Object.entries(plainVal.response)
          .filter(([key, value]) => key.startsWith("survey_rating_") && value !== "N/A")
          .map(([, value]) => Number(value));

        const totalScore = validRatings.reduce((sum, v) => sum + v, 0);
        const percentage = validRatings.length
          ? Number(((totalScore / (validRatings.length * 5)) * 100).toFixed(2))
          : 0;

        return {
          ...plainVal,
          csatScore: percentage,
        };
      });

      const submittedResponses = updatedResponse.filter((val) => val.isSubmitted === true);
      const totalScoreResponse = submittedResponses.reduce((sum, acc) => sum + acc.csatScore, 0);
      const overallPercentage = submittedResponses.length > 0
        ? Number((totalScoreResponse / submittedResponses.length).toFixed(2))
        : 0;

      record.recipients_response = updatedResponse;
      record.overAllCSATScore = overallPercentage;
      await record.save();
    }
  }

  // --- External Shared Logic Helpers ---
  async updateExistingTransitionApproval(selectedCompanyId, updatedData) {
    try {
      const approvalId = mongoose.Types.ObjectId(updatedData._id);
      const pipeline = [
        {
          $match: {
            oUserCompanyId: mongoose.Types.ObjectId(selectedCompanyId),
            "transition_logs.approvalId": approvalId,
          },
        },
        { $unwind: "$transition_logs" },
        {
          $match: {
            "transition_logs.approvalId": approvalId,
          },
        },
        {
          $lookup: {
            from: "leads_opportunity_product_company_mappings",
            localField: "opportunityDetails.opportunityId",
            foreignField: "_id",
            as: "opp_details",
          },
        },
        { $unwind: { path: "$opp_details", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "mast_company_informations",
            localField: "opp_details.oCompany_Id",
            foreignField: "_id",
            as: "mast_company",
          },
        },
        { $unwind: { path: "$mast_company", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "leads_company_details",
            localField: "opp_details.oCompany_Id",
            foreignField: "_id",
            as: "lead_company",
          },
        },
        { $unwind: { path: "$lead_company", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            companyDetails: { $ifNull: ["$mast_company", "$lead_company"] },
          },
        },
      ];

      const results = await TransitionPhaseTemplateValueMappings.aggregate(pipeline);
      if (!results.length) return;

      for (const item of results) {
        const existingLevels = item.transition_logs?.currentLevel || [];
        const companyDetails = item.companyDetails;
        const oppDetails = item.opp_details;

        const currentIndex = existingLevels.findIndex((lvl) => lvl.isCurrentLevel === true);
        let parentAccount = null;
        if (companyDetails?.oParentComp_id) {
          parentAccount = await masterCompanyModel.findById(companyDetails.oParentComp_id) ||
            await LeadCompanyDetails.findById(companyDetails.oParentComp_id);
        }

        const newLevels = [];
        for (const levelItem of updatedData.cUserLevels || []) {
          for (const user of levelItem.users || []) {
            let resolvedUserId = null;
            if (user === "Opportunity Account Manager") {
              resolvedUserId = oppDetails?.oOpportunity_Owner || null;
            } else if (user === "Account Accounts Manager") {
              resolvedUserId = companyDetails?.oAccountManagerUserId || null;
            } else if (user === "Parent Account Manager") {
              resolvedUserId = parentAccount?.oAccountManagerUserId ||
                (updatedData.cUserLevels.length === 1 ? companyDetails?.oAccountManagerUserId : null);
            } else {
              resolvedUserId = user;
            }
            if (!resolvedUserId) continue;

            newLevels.push({
              level: levelItem.level,
              user_id: resolvedUserId,
              isApproved: false,
              isRejected: false,
              isCurrentLevel: false,
              isApproveReqMailSent: false,
            });
          }
        }

        if (newLevels.length > 0) {
          newLevels[0].isCurrentLevel = true;
        }

        let updatedLevels = [];
        if (currentIndex !== -1) {
          updatedLevels = existingLevels.slice(0, currentIndex);
        }
        updatedLevels = [...updatedLevels, ...newLevels];

        await TransitionPhaseTemplateValueMappings.updateOne(
          { _id: item._id },
          {
            $set: {
              "transition_logs.$[elem].currentLevel": updatedLevels,
            },
          },
          {
            arrayFilters: [{ "elem.approvalId": approvalId }],
          }
        );
      }
    } catch (error) {
      console.error("Error in updateExistingTransitionApproval:", error);
    }
  }

  async updateExistingTransitionApprovalAccountAndOpportunity(id, updatedData, type) {
    try {
      const objectId = mongoose.Types.ObjectId(id);

      const buildLevels = async ({
        approval,
        existingLevels,
        companyDetails,
        oppDetails,
      }) => {
        const currentIndex = existingLevels.findIndex((lvl) => lvl.isCurrentLevel === true);
        let parentAccount = null;
        if (companyDetails?.oParentComp_id) {
          parentAccount = await masterCompanyModel.findById(companyDetails.oParentComp_id) ||
            await LeadCompanyDetails.findById(companyDetails.oParentComp_id);
        }

        const newLevels = [];
        for (const levelItem of approval.cUserLevels || []) {
          for (const user of levelItem.users || []) {
            let resolvedUserId = null;
            if (user === "Opportunity Account Manager") {
              resolvedUserId = oppDetails?.oOpportunity_Owner || null;
            } else if (user === "Account Accounts Manager") {
              resolvedUserId = companyDetails?.oAccountManagerUserId || null;
            } else if (user === "Parent Account Manager") {
              resolvedUserId = parentAccount?.oAccountManagerUserId ||
                (approval.cUserLevels.length === 1 ? companyDetails?.oAccountManagerUserId : null);
            } else {
              resolvedUserId = user;
            }
            if (!resolvedUserId) continue;

            newLevels.push({
              level: levelItem.level,
              user_id: resolvedUserId,
              isApproved: false,
              isRejected: false,
              isCurrentLevel: false,
              isApproveReqMailSent: false,
            });
          }
        }

        if (newLevels.length) {
          newLevels[0].isCurrentLevel = true;
        }

        return currentIndex !== -1
          ? [...existingLevels.slice(0, currentIndex), ...newLevels]
          : newLevels;
      };

      const approval = await CRMApprovalSetting.findOne({
        ...(type === "Opportunity" ? { opportunityId: objectId } : { accountId: objectId }),
        approvalType: 'Transition',
        bActive: true,
      });

      if (!approval) return;
      const approvalId = mongoose.Types.ObjectId(approval._id);

      const pipeline = [
        { $match: { "transition_logs.approvalId": approvalId } },
        { $unwind: "$transition_logs" },
        { $match: { "transition_logs.approvalId": approvalId } },
        {
          $lookup: {
            from: "leads_opportunity_product_company_mappings",
            localField: "opportunityDetails.opportunityId",
            foreignField: "_id",
            as: "opp_details",
          },
        },
        { $unwind: { path: "$opp_details", preserveNullAndEmptyArrays: true } },
        {
          $match: type === "Opportunity"
            ? { "opp_details._id": objectId }
            : { "opp_details.oCompany_Id": objectId },
        },
        {
          $lookup: {
            from: "mast_company_informations",
            localField: "opp_details.oCompany_Id",
            foreignField: "_id",
            as: "mast_company",
          },
        },
        { $unwind: { path: "$mast_company", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "leads_company_details",
            localField: "opp_details.oCompany_Id",
            foreignField: "_id",
            as: "lead_company",
          },
        },
        { $unwind: { path: "$lead_company", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            companyDetails: { $ifNull: ["$mast_company", "$lead_company"] },
          },
        },
      ];

      const results = await TransitionPhaseTemplateValueMappings.aggregate(pipeline);

      for (const item of results) {
        const updatedLevels = await buildLevels({
          approval,
          existingLevels: item.transition_logs?.currentLevel || [],
          companyDetails: item.companyDetails,
          oppDetails: item.opp_details,
        });

        await TransitionPhaseTemplateValueMappings.updateOne(
          { _id: item._id },
          {
            $set: {
              "transition_logs.$[elem].currentLevel": updatedLevels,
            },
          },
          {
            arrayFilters: [{ "elem.approvalId": approvalId }],
          }
        );
      }

      if (updatedData?.oParentComp_id && type === "Account") {
        const parentApproval = await CRMApprovalSetting.findOne({
          accountId: updatedData.oUsercompanyId,
          bActive: true,
          approvalType: 'Transition',
        });

        if (!parentApproval) return;
        const parentApprovalId = mongoose.Types.ObjectId(parentApproval._id);

        const parentResults = await TransitionPhaseTemplateValueMappings.aggregate([
          {
            $match: {
              "transition_logs.approvalId": parentApprovalId,
              accountId: mongoose.Types.ObjectId(updatedData.oUsercompanyId),
            },
          },
          { $unwind: "$transition_logs" },
          {
            $match: {
              "transition_logs.approvalId": parentApprovalId,
            },
          },
        ]);

        for (const item of parentResults) {
          const updatedLevels = await buildLevels({
            approval: parentApproval,
            existingLevels: item.transition_logs?.currentLevel || [],
            companyDetails: item.companyDetails,
            oppDetails: item.opp_details,
          });

          await TransitionPhaseTemplateValueMappings.updateOne(
            { _id: item._id },
            {
              $set: {
                "transition_logs.$[elem].currentLevel": updatedLevels,
              },
            },
            {
              arrayFilters: [{ "elem.approvalId": parentApprovalId }],
            }
          );
        }
      }
    } catch (error) {
      console.error("Error in updateExistingTransitionApprovalAccountAndOpportunity:", error);
    }
  }
}

module.exports = new TransitionService();
