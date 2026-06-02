const transitionService = require("./transition.service");
const { getTokenDetails } = require("../../middlewares/authendicateSession");

async function extractToken(req) {
  const tokenDetails = await getTokenDetails(req);
  if (!tokenDetails) {
    throw new Error("Invalid or missing authentication token");
  }
  return tokenDetails;
}

// --- Phases & Master ---
async function createPhases(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.createPhases(req.body, tokenDetails);
    res.status(201).json({
      message: "Phase created successfully",
      data: result,
      success: true,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating phase", error: error.message, success: false });
  }
}

async function getAllPhases(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.getAllPhases(tokenDetails);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ message: "Error fetching phases", error: error.message });
  }
}

async function getAllBActivePhases(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.getAllBActivePhases(tokenDetails);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ message: "Error fetching phases", error: error.message });
  }
}

async function getPhaseById(req, res, next) {
  try {
    const result = await transitionService.getPhaseById(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Phase not found" });
    }
    res.status(200).json({ success: false, data: result });
  } catch (error) {
    res.status(500).json({ message: "Error fetching phase", error: error.message, success: false });
  }
}

async function updatePhase(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.updatePhase(req.params.id, req.body, tokenDetails);
    if (!result) {
      return res.status(404).json({ success: false, message: "Phase not found for update" });
    }
    res.status(200).json({
      success: true,
      message: "Phase updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating phase", error: error.message });
  }
}

async function deletePhase(req, res, next) {
  try {
    const result = await transitionService.deletePhase(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: "Phase not found for deletion" });
    }
    res.status(200).json({ success: true, message: "Phase deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting phase", error: error.message });
  }
}

async function getByIdTemplateMapping(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.getByIdTemplateMapping(req.params.id, tokenDetails);
    if (!result) {
      return res.status(404).json({ message: "Template not found" });
    }
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
}

async function getByIdTransitionComments(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.getByIdTransitionComments(req.body, tokenDetails, req.io);
    res.status(200).json({
      success: true,
      message: "Comments fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching comments", error: error.message });
  }
}

async function createTransitionComment(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.createTransitionComment(req.body, tokenDetails);
    res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating comment", error: error.message });
  }
}

async function updateTransitionComment(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.updateTransitionComment(req.params.id, req.body, tokenDetails);
    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating comment", error: error.message });
  }
}

async function deleteTransitionComment(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    await transitionService.deleteTransitionComment(req.params.id, tokenDetails);
    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting comment", error: error.message });
  }
}

async function getAllTransitionTemplates(req, res, next) {
  try {
    const result = await transitionService.getAllTransitionTemplates();
    res.status(200).json({
      success: true,
      message: "Templates fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "An error occurred while fetching templates", error: error.message });
  }
}

async function getAllPhasesTemplatesMasterMapped(req, res, next) {
  try {
    const result = await transitionService.getAllPhasesTemplatesMasterMapped();
    res.status(200).json({
      success: true,
      message: "Templates fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "An error occurred while fetching templates", error: error.message });
  }
}

async function getAllPhasesTemplatesBActiveMasterMapped(req, res, next) {
  try {
    const result = await transitionService.getAllPhasesTemplatesBActiveMasterMapped();
    res.status(200).json({
      success: true,
      message: "Templates fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "An error occurred while fetching templates", error: error.message });
  }
}

async function savePhasesTemplateMasterMapping(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.savePhasesTemplateMasterMapping(req.body, tokenDetails);
    res.status(201).json({
      message: req.body.isEdited ? "Transition mapping updated successfully" : "Transition mapping created successfully",
      data: result,
      success: true,
    });
  } catch (error) {
    res.status(500).json({ message: "Error while saving transition mapping", error: error.message, success: false });
  }
}

async function deletePhasesTemplateMasterMapping(req, res, next) {
  try {
    const result = await transitionService.deletePhasesTemplateMasterMapping(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: "Phase not found for deletion" });
    }
    res.status(200).json({ success: true, message: "Phase deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting phase", error: error.message });
  }
}

async function getProductMappedtoTransition(req, res, next) {
  try {
    const result = await transitionService.getProductMappedtoTransition(req.params.id);
    res.status(200).json({
      success: true,
      isMapped: result.isMapped,
      message: result.isMapped ? "This Process is mapped to Transition and cannot be modified" : "No process are mapped to any transition and can be modified",
      transitionCount: result.transitionCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// --- Tasks ---
async function createTransitionTask(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.createTransitionTask(req.body, tokenDetails);
    res.status(201).json({ success: true, data: result, message: "Task Created successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function getAllTransitionTasks(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.getAllTransitionTasks(tokenDetails);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getTransitionTaskById(req, res, next) {
  try {
    const result = await transitionService.getTransitionTaskById(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function updateTransitionTask(req, res, next) {
  try {
    const result = await transitionService.updateTransitionTask(req.params.id, req.body);
    if (!result) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function deleteTransitionTask(req, res, next) {
  try {
    const result = await transitionService.deleteTransitionTask(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// --- Load Opportunity/Transitions ---
async function loadOpportunityForTransition(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.loadOpportunityForTransition(tokenDetails);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

async function loadExistingTransition(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.loadExistingTransition(tokenDetails);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

async function getTransitionByOpportunityId(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.getTransitionByOpportunityId(req.params.opportunityId, tokenDetails);
    if (!result || result.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No transition found for this opportunity",
        data: []
      });
    }
    res.status(200).json({ success: true, data: result.length === 1 ? result[0] : result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

async function getEmpUserNames(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.getEmpUserNames(tokenDetails, req.headers);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

// --- Action Owner ---
async function createActionOwner(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.createActionOwner(req.body, tokenDetails);
    if (result.success === false) {
      return res.status(201).json(result);
    }
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

async function getAllActionOwners(req, res, next) {
  try {
    const result = await transitionService.getAllActionOwners();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

async function getActionOwnerById(req, res, next) {
  try {
    const result = await transitionService.getActionOwnerById(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: "Action owner not found" });
    }
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

async function updateActionOwner(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.updateActionOwner(req.params.id, req.body, tokenDetails);
    res.status(200).json({ success: true, message: "Action owner updated successfully", data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

async function deleteActionOwner(req, res, next) {
  try {
    const result = await transitionService.deleteActionOwner(req.params.id, req.body);
    res.status(200).json({ success: true, message: "Action owner deleted successfully", data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

// --- Begin & Process Transition ---
async function beginTransitionMapWithProduct(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.beginTransitionMapWithProduct(req.body, tokenDetails);
    if (result.success === false) {
      return res.status(201).json(result);
    }
    res.status(201).json({
      message: "Transition mapping created successfully",
      data: result.data,
      success: true,
    });
  } catch (error) {
    res.status(500).json({ message: "Error while creating transition mapping", error: error.message, success: false });
  }
}

async function updateBeginTransitionMapWithProduct(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.updateBeginTransitionMapWithProduct(req.body, tokenDetails);
    if (!result) {
      return res.status(404).json({ message: "Transition mapping not found", success: false });
    }
    res.status(200).json({ message: "Transition mapping updated successfully", data: result, success: true });
  } catch (error) {
    res.status(500).json({ message: "Error while updating transition mapping", error: error.message, success: false });
  }
}

async function transitionTemplateJSON(req, res, next) {
  try {
    const result = await transitionService.transitionTemplateJSON(req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function updateTransitionTemplate(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.updateTransitionTemplate(req.body, tokenDetails);
    res.status(200).json({ success: true, message: "Template updated successfully", data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating template", error: error.message });
  }
}

async function checkAlreadyBeginTransition(req, res, next) {
  try {
    const result = await transitionService.checkAlreadyBeginTransition(req.params.id);
    if (result) {
      res.status(200).json({
        success: true,
        message: "Transition Mapping already exists",
        data: {
          _id: result._id,
          oActivation_Id: result.oActivation_Id,
          oTask_Id: result.oTask_Id,
          transition_manager: result.transition_manager,
          mappedPhaseTemplate_Id: result.mappedPhaseTemplate_Id,
          transitionDetails: result.transitionDetails?.map((item) => ({
            iSortOrder: item.iSortOrder,
            oTemplateId: item.oTemplateId,
            oPhaseId: item.oPhaseId,
          })),
        },
      });
    } else {
      res.status(200).json({ success: false, message: "No Transition Mapping found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

async function createTransitionTemplateJSON(req, res, next) {
  try {
    const result = await transitionService.createTransitionTemplateJSON(req.body);
    res.send(result);
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function createTransitionTemplateJSONWithOptions(req, res, next) {
  try {
    const result = await transitionService.createTransitionTemplateJSONWithOptions(req.body);
    res.send(result);
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function checkTransitionComplete(req, res, next) {
  try {
    const result = await transitionService.checkTransitionComplete(req.params.id);
    if (result) {
      res.status(200).json({ success: true, data: { isTranstion: result } });
    } else {
      res.status(201).json({ success: true, data: { isTranstion: result } });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function actionTransitionProcess(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.actionTransitionProcess(req.body, tokenDetails);
    if (result.success === false) {
      return res.status(200).json(result);
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function existingTransitionNumber(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    await transitionService.existingTransitionNumber(tokenDetails);
    res.status(200).json({ success: true, message: "All transition numbers generated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to generate transition numbers", error: error.message });
  }
}

async function uploadTransitionViaExcel(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    res.status(200).json({ message: "Excel data processed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error importing Excel file", error: error.message });
  }
}

async function existingTransitionTemplateStore(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    await transitionService.existingTransitionTemplateStore(req.body, tokenDetails);
    res.status(200).json({ success: true, message: "Transition templates updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update transition templates", error: error.message });
  }
}

async function clientDashboardReports(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.clientDashboardReports(tokenDetails);
    res.status(200).json({ message: "Excel data processed successfully", data: result });
  } catch (error) {
    res.status(500).json({ message: "Error importing Excel file", error: error.message });
  }
}

async function clientDashboardReportsYear(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.clientDashboardReportsYear(tokenDetails);
    res.status(200).json({ message: "Excel data processed successfully", data: result });
  } catch (error) {
    res.status(500).json({ message: "Error importing Excel file", error: error.message });
  }
}

async function approveOrRejectTransition(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.approveOrRejectTransition(req.body, tokenDetails);
    res.status(200).json({ success: true, message: "Transition approved successfully", data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
  }
}

async function checkAccountTransitionInitiated(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.checkAccountTransitionInitiated(req.params.id, tokenDetails);
    if (result.success === false) {
      return res.status(201).json(result);
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

async function getTransitonApprovalAccountList(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.getTransitonApprovalAccountList(tokenDetails);
    res.status(200).json({ success: true, message: "Transition approval matched accounts fetched successfully", data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

async function checkAccountTransitionIsApprovalLevel(req, res, next) {
  try {
    const result = await transitionService.checkAccountTransitionIsApprovalLevel(req.params.id);
    if (result) {
      res.status(200).json({ success: true, message: "Transition approval is currently in progress", isAction: false });
    } else {
      res.status(200).json({ success: true, message: "No active approval level found", isAction: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

async function cloneTransitionProcess(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.cloneTransitionProcess(req.body, tokenDetails);
    res.status(200).json({ success: true, message: "New transition created successfully", data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to clone transition process", error: error.message });
  }
}

async function opportunityListByTransition(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.opportunityListByTransition(tokenDetails);
    res.status(200).json({ success: true, message: "Opportunity fetched successfully", data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to opportunity fetched", error: error.message });
  }
}

async function checkTransitionName(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.checkTransitionName(req.params.name, tokenDetails);
    if (result) {
      res.status(201).json({ status: false, message: "Transition name already exists" });
    } else {
      res.status(200).json({ status: true, message: "Transition Not Found" });
    }
  } catch (error) {
    res.status(500).json({ status: false, message: "Failed to check transition name" });
  }
}

// --- Approvals (Exposed for external modules) ---
async function loadApprovalTransitionRequest(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.loadApprovalTransitionRequest(tokenDetails);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

async function loadExitingApprovalTransitionRequest(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.loadExitingApprovalTransitionRequest(tokenDetails);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

// --- Survey Logic ---
async function getAllSurveyTemplates(req, res, next) {
  try {
    const result = await transitionService.getAllSurveyTemplates();
    res.status(200).json({ success: true, message: "Survey templates fetched successfully", data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "An error occurred while fetching survey templates", error: error.message });
  }
}

async function getAllSavedSurveyTemplates(req, res, next) {
  try {
    const result = await transitionService.getAllSavedSurveyTemplates(req.params.id);
    res.status(200).json({ success: true, message: "Survey templates fetched successfully with components", data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "An error occurred while fetching survey templates", error: error.message });
  }
}

async function getValueMappedSurveybyId(req, res, next) {
  try {
    const result = await transitionService.getValueMappedSurveybyId(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: "Survey mapping not found" });
    }
    res.status(200).json({ success: true, message: "Survey template fetched successfully", data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "An error occurred while fetching survey templates", error: error.message });
  }
}

async function saveSurveyTemplates(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.saveSurveyTemplates(req.body, tokenDetails);
    res.status(201).json({ success: true, message: "Survey template saved successfully", data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "An error occurred while saving the survey template", error: error.message });
  }
}

async function deleteSurveyTemplate(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.deleteSurveyTemplate(req.params.id, tokenDetails);
    if (result.success === false) {
      return res.status(201).json(result);
    }
    res.status(200).json({ success: true, message: "Template deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting Template", error: error.message });
  }
}

async function sendSurveyMailTemplate(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.sendSurveyMailTemplate(req.body, tokenDetails);
    if (result.success === false) {
      return res.status(201).json(result);
    }
    res.status(200).json({
      success: true,
      message: result.emailsSent ? "Survey emails sent to new recipients and mapping updated successfully" : "Survey emails sent and mapping saved successfully",
      data: result.data,
      emailsSent: result.emailsSent,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
}

async function submitSurveyResponse(req, res, next) {
  try {
    const result = await transitionService.submitSurveyResponse(req.body);
    res.status(200).json({ success: true, message: "Survey response updated successfully", data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error while updating survey response" });
  }
}

async function getCSATScoreById(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.getCSATScoreById(req.params.id, tokenDetails);
    res.status(200).json({ success: true, message: "CSAT score calculated successfully", data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "An error occurred while calculating CSAT score", error: error.message });
  }
}

async function resendSurvey(req, res, next) {
  try {
    const tokenDetails = await extractToken(req);
    const result = await transitionService.resendSurvey(req.body, tokenDetails);
    res.status(200).json({ success: true, message: "Survey resent successfully", data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
}

async function updateScoreExitingSurvey(req, res, next) {
  try {
    await transitionService.updateScoreExitingSurvey();
    res.status(200).json({ success: true, message: "Updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
}

async function loadContactListAgainstAccount(req, res, next) {
  try {
    const result = await transitionService.loadContactListAgainstAccount(req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

module.exports = {
  createPhases,
  getAllPhases,
  getAllBActivePhases,
  getPhaseById,
  updatePhase,
  deletePhase,
  getByIdTemplateMapping,
  getByIdTransitionComments,
  createTransitionComment,
  updateTransitionComment,
  deleteTransitionComment,
  getAllTransitionTemplates,
  getAllPhasesTemplatesMasterMapped,
  getAllPhasesTemplatesBActiveMasterMapped,
  savePhasesTemplateMasterMapping,
  deletePhasesTemplateMasterMapping,
  getProductMappedtoTransition,
  createTransitionTask,
  getAllTransitionTasks,
  getTransitionTaskById,
  updateTransitionTask,
  deleteTransitionTask,
  loadOpportunityForTransition,
  loadExistingTransition,
  getTransitionByOpportunityId,
  getEmpUserNames,
  createActionOwner,
  getAllActionOwners,
  getActionOwnerById,
  updateActionOwner,
  deleteActionOwner,
  beginTransitionMapWithProduct,
  updateBeginTransitionMapWithProduct,
  transitionTemplateJSON,
  updateTransitionTemplate,
  checkAlreadyBeginTransition,
  createTransitionTemplateJSON,
  createTransitionTemplateJSONWithOptions,
  checkTransitionComplete,
  actionTransitionProcess,
  existingTransitionNumber,
  uploadTransitionViaExcel,
  existingTransitionTemplateStore,
  clientDashboardReports,
  clientDashboardReportsYear,
  approveOrRejectTransition,
  checkAccountTransitionInitiated,
  getTransitonApprovalAccountList,
  checkAccountTransitionIsApprovalLevel,
  cloneTransitionProcess,
  opportunityListByTransition,
  checkTransitionName,
  loadApprovalTransitionRequest,
  loadExitingApprovalTransitionRequest,
  loadContactListAgainstAccount,
  getAllSurveyTemplates,
  getAllSavedSurveyTemplates,
  getValueMappedSurveybyId,
  saveSurveyTemplates,
  deleteSurveyTemplate,
  sendSurveyMailTemplate,
  submitSurveyResponse,
  getCSATScoreById,
  resendSurvey,
  updateScoreExitingSurvey,
};
