const mongoose = require("mongoose");
const sanitize = require("mongo-sanitize");
const TransitionPhaseTemplateValueMappings = require("../models/Transition/Transition_Phase_Template_Value_Mapping");
const { ManualTrackPlugin } = require("./logger");
const mongoSanitize = require('express-mongo-sanitize');
const { getStatusById } = require("../modules/common/common.repository");


const transitionWebSocketDataRefresh = async (id, userId) => {
  const pipeline = [
    {
      $match: {
        _id: mongoose.Types.ObjectId(id),
      },
    },

    // 1️⃣ Leads → Product Mapping
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

    // 2️⃣ Product Mapping → Company Details
    {
      $lookup: {
        from: "mast_company_informations",
        localField: "leads_product_mapping.oCompany_Id",
        foreignField: "_id",
        as: "lead_company_details",
      },
    },
    {
      $unwind: {
        path: "$lead_company_details",
        preserveNullAndEmptyArrays: true,
      },
    },

    // 3️⃣ Opportunity Product → Company Mapping
    {
      $lookup: {
        from: "leads_opportunity_product_company_mappings",
        localField: "opportunityDetails.opportunityId",
        foreignField: "_id",
        as: "opp_details",
      },
    },
    {
      $unwind: {
        path: "$opp_details",
        preserveNullAndEmptyArrays: true,
      },
    },

    // 4️⃣ Opportunity Company Details
    {
      $lookup: {
        from: "mast_company_informations",
        localField: "opp_details.oCompany_Id",
        foreignField: "_id",
        as: "opp_company_details",
      },
    },
    {
      $unwind: {
        path: "$opp_company_details",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "leads_company_details",
        localField: "opp_details.oCompany_Id",
        foreignField: "_id",
        as: "opp_leads_company_details",
      },
    },
    {
      $unwind: {
        path: "$opp_leads_company_details",
        preserveNullAndEmptyArrays: true,
      },
    },

    // 5️⃣ Product Details
    {
      $lookup: {
        from: "leads_productcategory_product_mappings",
        localField: "leads_product_mapping.oProductCategory_Product_Mapping_Id",
        foreignField: "_id",
        as: "product_details",
      },
    },
    {
      $unwind: {
        path: "$product_details",
        preserveNullAndEmptyArrays: true,
      },
    },

    // 6️⃣ Opportunity Product Details (multiple products)
    {
      $lookup: {
        from: "leads_productcategory_product_mappings",
        localField: "opportunityDetails.productId",
        foreignField: "_id",
        as: "opp_product_details",
      },
    },
    {
      $unwind: {
        path: "$opp_product_details",
        preserveNullAndEmptyArrays: true,
      },
    },

    // 7️⃣ Category Details
    {
      $lookup: {
        from: "leads_categories",
        localField: "leads_product_mapping.oCategory_Id",
        foreignField: "_id",
        as: "category_details",
      },
    },
    {
      $unwind: {
        path: "$category_details",
        preserveNullAndEmptyArrays: true,
      },
    },

    // 8️⃣ Task Details
    {
      $lookup: {
        from: "transition_tasks",
        localField: "oTask_Id",
        foreignField: "_id",
        as: "task_details",
      },
    },
    {
      $unwind: {
        path: "$task_details",
        preserveNullAndEmptyArrays: true,
      },
    },

    // 9️⃣ Phase Info
    {
      $lookup: {
        from: "transition_mast_phases",
        localField: "transitionDetails.oPhaseId",
        foreignField: "_id",
        as: "phase_info",
      },
    },

    // 1️⃣1️⃣ Comments + Comment Users
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

    // 1️⃣2️⃣ Latest Update User
    {
      $lookup: {
        from: "useradmin_mast_users",
        localField: "cUpdatedBy",
        foreignField: "_id",
        as: "latest_updateuser",
      },
    },
    {
      $unwind: {
        path: "$latest_updateuser",
        preserveNullAndEmptyArrays: true,
      },
    },

    // 🧩 Group all opportunity product names
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
    {
      $replaceRoot: { newRoot: "$root" },
    },
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
            {
              $ifNull: ["$product_details.cFeaturesDesc", ""]
            }
          ]
        }
      }
    },

    // 1. Lookup status
    {
      $lookup: {
        from: "leads_master_statuses",
        localField: "reason.statusId",
        foreignField: "_id",
        as: "statusDetails"
      }
    },

    // 2. Lookup users
    {
      $lookup: {
        from: "useradmin_mast_users",
        localField: "reason.cCreatedBy",
        foreignField: "_id",
        as: "userDetails"
      }
    },

    // 3. Map reason array and inject names
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
                  in: "$$user.loginName" // change if your field is different
                }
              }
            }
          }
        }
      }
    },
    {
      $addFields: {
        isAdminEdit: {
          $in: [
            mongoose.Types.ObjectId(userId),
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

    // 🧾 Final Projection
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
        dUpdatedAt: {
          $dateToString: { format: "%d/%m/%Y", date: "$dUpdatedAt" },
        },
        cUpdatedBy: 1,
        lastUpdatedBy: "$latest_updateuser.loginName",
        oUserCompanyId: 1,
        bActive: 1,

        // Company name priority
        cCompanyName: {
          $ifNull: [
            "$opp_company_details.company_name",
            {
              $ifNull: [
                "$opp_leads_company_details.company_name",
                "$lead_company_details.company_name"
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
                "$lead_company_details._id"
              ]
            }
          ]
        },
        cProductName: "$cProductName",
        cCategory_Name: "$category_details.cCategory_Name",
        phase_info: "$phase_info",
        task_details: "$task_details",
        transition_comments: {
          $map: {
            input: "$transition_comments",
            as: "comment",
            in: {
              type: "$$comment.type",
              key: "$$comment.key",
              cComment: "$$comment.cComment",
              oTemplateId: "$$comment.oTemplateId",

              // ✅ keep original ObjectId
              cCreatedById: "$$comment.cCreatedBy",

              // ✅ safe comparison
              isCurrentUser: {
                $eq: [
                  "$$comment.cCreatedBy",
                  mongoose.Types.ObjectId(userId)
                ]
              },

              // ✅ separate username field (DO NOT overwrite)
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
  return template || null;
};

const socketUpdateTransitionTemplate = async (data) => {
  const { id, templateId, type, updatedData, userId, summary, isModified, cTransition_Name } = data;
  const transition_in_progress = await getStatusById("Transition", "transition_in_progress");
  const transition_cancel = await getStatusById("Transition", "transition_cancel");
  const transition_completed = await getStatusById("Transition", "transition_completed");
  const transition_hold = await getStatusById("Transition", "transition_hold");
  const approval_pending = await getStatusById("Transition", "transition_approval_pending");
  const transition_new = await getStatusById("Transition", "transition_new");

  try {
    const existingTemplate = await TransitionPhaseTemplateValueMappings.findById(id);
    if (!existingTemplate) return null;

    // Store original data for audit tracking
    const originalTemplateData = existingTemplate.toObject();

    if ([transition_cancel, transition_new, transition_completed, transition_hold, approval_pending].includes(existingTemplate.oStatus_Id.toString())) {
      return;
    }
    let isUpdated = false;

    const updatedTransitionDetails = existingTemplate.transitionDetails.map((item) => {
      const itemTemplateId = item.oTemplateId.toString();

      if (itemTemplateId === templateId && type === "checklist") {
        item.componentValues = updatedData;
        isUpdated = true;
      } else if (type === "kpiTransition" && updatedData.hasOwnProperty(itemTemplateId)) {
        item.KpiValues = updatedData[itemTemplateId];
        isUpdated = true;
      } else if (itemTemplateId === templateId && type === "tollgate" && updatedData.hasOwnProperty(itemTemplateId)) {
        item.tollgateValues = updatedData[itemTemplateId];
        isUpdated = true;
      }
      return item;
    });

    if (type === "phases_table") {
      Object.keys(updatedData).forEach((key) => {
        existingTemplate.phasesTableValues[key] = updatedData[key];
      });
      isUpdated = true;
    }

    if (summary) {
      existingTemplate.summary = existingTemplate?.summary?.length > 0 ? existingTemplate?.summary?.map((item) => {
        const findData = summary?.find((val) => item.cPhaseId.toString() === val.cPhaseId);
        return {
          ...item,
          checklist_score: findData?.checklist_score ?? item.checklist_score,
          kpi_score: findData?.kpi_score ?? item.kpi_score,
          tollgate_score: findData?.tollgate_score ?? item.tollgate_score,
        };
      }) : summary;
    }

    if (type === "kt-planner") {
      existingTemplate.ktPlanner = updatedData;
      isUpdated = true;
    }
    if (type === "action-tracker") {
      existingTemplate.actionTracker = updatedData;
      isUpdated = true;
    }
    if (type === "risk-logs") {
      existingTemplate.riskLogs = updatedData;
      isUpdated = true;
    }
    if (type === "matrix") {
      existingTemplate.matrix = updatedData;
      isUpdated = true;
    }

    if (existingTemplate.cTransition_Name !== cTransition_Name && type == "updateName") {
      // Ensure reason array exists
      existingTemplate.reason = existingTemplate.reason || [];

      // Push audit log BEFORE update (old → new)
      existingTemplate.reason.push({
        cNotes: `Transition Name updated from ${existingTemplate.cTransition_Name} to ${cTransition_Name}`,
        dCreatedAt: new Date(),
        cCreatedBy: userId,
        isStandalone: true,
        statusId: transition_in_progress
      });

      // Update transition name
      existingTemplate.cTransition_Name = cTransition_Name;

      // Save changes
      await existingTemplate.save();

    }

    if (isUpdated) {
      existingTemplate.transitionDetails = updatedTransitionDetails;
      existingTemplate.cUpdatedBy = userId;
      existingTemplate.dUpdatedAt = new Date();
      if (isModified) {
        existingTemplate.oStatus_Id = transition_in_progress;
      }

      await existingTemplate.save();

      // Call ManualTrackPlugin to track changes
      await ManualTrackPlugin({
        collectionName: 'transition_phase_template_value_mappings', // Use actual collection name
        documentId: id,
        originalData: mongoSanitize.sanitize(originalTemplateData),
        updatedData: mongoSanitize.sanitize(existingTemplate.toObject()),
        userId: userId,
        companyId: existingTemplate.oUserCompanyId, // Assuming this field exists
        actionType: 'updated',
        reason: `Transition template ${type} updated via WebSocket`,
        fieldsToTrack: getFieldsToTrackBasedOnType(type),
        category: "Transition",
        additionalInfo: {
          templateId: templateId,
          updateType: type,
          isModified: isModified,
          summary: summary
        }
      });
    }

    return await transitionWebSocketDataRefresh(id, userId);
  } catch (error) {
    console.error("Error updating template:", error);
    return null;
  }
};

// Helper function to determine which fields to track based on update type
function getFieldsToTrackBasedOnType(type) {
  switch (type) {
    case 'checklist':
      return ['transitionDetails.componentValues'];
    case 'kpiTransition':
      return ['transitionDetails.KpiValues'];
    case 'tollgate':
      return ['transitionDetails.tollgateValues'];
    case 'phases_table':
      return ['phasesTableValues'];
    default:
      return [];
  }
}

function setupSocket(io) {
  console.log("Socket server started");
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });

    socket.on("updateTransitionTemplate", async (data) => {
      data = sanitize(data);
      const template = await socketUpdateTransitionTemplate(data);
      console.log('template: ', template);
      if (template) {
        socket.broadcast.emit("template-updated", { ...template, type: data.type });
        if (data?.type == "phases_table") {
          socket.emit("template-updated", { ...template, type: data.type });
        } else if (data?.isUpdateCurrentChanges) {
          socket.emit("template-updated", { ...template, type: data.type });
        } else if (data?.type == "updateName") {
          socket.emit("template-updated", { ...template, type: data.type });
        }
      }
    });

    socket.on("createTransitionComment", (data) => {
      data = sanitize(data);
      // console.log("Received createTransitionComment:", data);
      socket.broadcast.emit("template-updated", data);
    });

    socket.on("updateTransitionComment", async (data) => {
      data = sanitize(data);
      // console.log("Received updateTransitionComment:", data);
      const template = await socketUpdateTransitionTemplate(data);
      if (template) {
        socket.broadcast.emit("template-updated", template);
      }
    });
  });
}

module.exports = setupSocket;
