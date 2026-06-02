const express = require("express");
const router = express.Router();
const transitionController = require("../modules/transition").controller;
const isAuth = require("../middlewares/authendicateSession");
var middleware = require("../middlewares/insertion");


router.get("/", (req, res) => res.status(200).send("Transition Route OK"));

//#region Phases
router.post("/createPhases", isAuth.getSessionUser, middleware.checkPhaseName, transitionController.createPhases);
router.get("/getAllPhases", isAuth.getSessionUser, transitionController.getAllPhases);
router.get("/getAllBActivePhases", isAuth.getSessionUser, transitionController.getAllBActivePhases);
router.get("/getPhaseById/:id", isAuth.getSessionUser, transitionController.getPhaseById);
router.put("/updatePhase/:id", isAuth.getSessionUser, middleware.checkPhaseName, transitionController.updatePhase);
router.delete("/deletePhase/:id", isAuth.getSessionUser, transitionController.deletePhase);

//Mapping Template
router.get("/getByIdTemplateMapping/:id", isAuth.getSessionUser, transitionController.getByIdTemplateMapping);
router.get("/getAllTransitionTemplates", isAuth.getSessionUser, transitionController.getAllTransitionTemplates);

//BeginTranstion
router.post("/beginTransitionMapWithProduct", isAuth.getSessionUser, transitionController.beginTransitionMapWithProduct);
router.post("/updateBeginTransitionMapWithProduct", isAuth.getSessionUser, transitionController.updateBeginTransitionMapWithProduct);
router.post("/transitionTemplateJSON", isAuth.getSessionUser, transitionController.transitionTemplateJSON);
router.post("/updateTransitionTemplate", isAuth.getSessionUser, transitionController.updateTransitionTemplate);
router.get("/checkAlreadyBeginTransition/:id", isAuth.getSessionUser, transitionController.checkAlreadyBeginTransition);
router.post("/createTransitionTemplateJSON", isAuth.getSessionUser, transitionController.createTransitionTemplateJSON);
router.post("/createTransitionTemplateJSONWithOptions", isAuth.getSessionUser, transitionController.createTransitionTemplateJSONWithOptions);

//Transition Comments
router.post("/getByIdTransitionComments", isAuth.getSessionUser, transitionController.getByIdTransitionComments);
router.post("/createTransitionComment", isAuth.getSessionUser, transitionController.createTransitionComment);
router.post("/updateTransitionComment/:id", isAuth.getSessionUser, transitionController.updateTransitionComment);
router.delete("/deleteTransitionComment/:id", isAuth.getSessionUser, transitionController.deleteTransitionComment);

//Master
router.patch("/savePhasesTemplateMasterMapping", isAuth.getSessionUser, transitionController.savePhasesTemplateMasterMapping);
router.delete("/deletePhasesTemplateMasterMapping/:id", isAuth.getSessionUser, transitionController.deletePhasesTemplateMasterMapping);
router.get("/getAllPhasesTemplatesMasterMapped", isAuth.getSessionUser, transitionController.getAllPhasesTemplatesMasterMapped);
router.get("/getAllPhasesTemplatesBActiveMasterMapped", isAuth.getSessionUser, transitionController.getAllPhasesTemplatesBActiveMasterMapped);
router.get("/getProductMappedtoTransition/:id", isAuth.getSessionUser, transitionController.getProductMappedtoTransition);

//survey
router.get("/getAllSurveyTemplates", isAuth.getSessionUser, transitionController.getAllSurveyTemplates);
router.get("/getAllSavedSurveyTemplates/:id", isAuth.getSessionUser, transitionController.getAllSavedSurveyTemplates);
router.get("/getValueMappedSurveybyId/:id/:templateId", isAuth.getSessionUser, transitionController.getValueMappedSurveybyId);
router.post("/saveSurveyTemplates", isAuth.getSessionUser, transitionController.saveSurveyTemplates);
router.delete("/deleteSurveyTemplate/:id", isAuth.getSessionUser, transitionController.deleteSurveyTemplate);
router.post("/sendSurveyMailTemplate", isAuth.getSessionUser, transitionController.sendSurveyMailTemplate);
router.post("/submitSurveyResponse", isAuth.getSessionUser, transitionController.submitSurveyResponse);
router.get('/getCSATScoreById/:id', isAuth.getSessionUser, transitionController.getCSATScoreById);
router.post('/resend-survey', isAuth.getSessionUser, transitionController.resendSurvey);

//Tasks
router.post("/createTransitionTask", isAuth.getSessionUser, middleware.checkTaskName, transitionController.createTransitionTask);
router.get("/getAllTransitionTasks", isAuth.getSessionUser, transitionController.getAllTransitionTasks);


router.get("/checkTransitionComplete/:id", isAuth.getSessionUser, transitionController.checkTransitionComplete);
router.post("/actionTransitionProcess", isAuth.getSessionUser, transitionController.actionTransitionProcess);
router.get("/loadOpportunityForTransition", isAuth.getSessionUser, transitionController.loadOpportunityForTransition);
router.get("/loadExistingTransition", isAuth.getSessionUser, transitionController.loadExistingTransition);
router.get("/getTransitionByOpportunityId/:opportunityId", isAuth.getSessionUser, transitionController.getTransitionByOpportunityId);
router.get("/getEmpUserNames", isAuth.getSessionUser, transitionController.getEmpUserNames);
router.get("/existingTransitionNumber", isAuth.getSessionUser, transitionController.existingTransitionNumber);
router.get("/existingTransitionTemplateStore", transitionController.existingTransitionTemplateStore);
router.get("/loadApprovalTransitionRequest", isAuth.getSessionUser, transitionController.loadApprovalTransitionRequest);
router.get("/loadExitingApprovalTransitionRequest", isAuth.getSessionUser, transitionController.loadExitingApprovalTransitionRequest);
router.post("/approveOrRejectTransition", isAuth.getSessionUser, transitionController.approveOrRejectTransition);
router.get("/checkAccountTransitionInitiated/:id", isAuth.getSessionUser, transitionController.checkAccountTransitionInitiated);
router.get("/getTransitonApprovalAccountList", isAuth.getSessionUser, transitionController.getTransitonApprovalAccountList);
router.get("/checkAccountTransitionIsApprovalLevel/:id", isAuth.getSessionUser, transitionController.checkAccountTransitionIsApprovalLevel);

//#region Phases
router.post("/createActionOwner", isAuth.getSessionUser, middleware.checkPhaseName, transitionController.createActionOwner);
router.get("/getAllActionOwners", isAuth.getSessionUser, transitionController.getAllActionOwners);
router.put("/updateActionOwner/:id", isAuth.getSessionUser, middleware.checkPhaseName, transitionController.updateActionOwner);
router.delete("/deleteActionOwner/:id", isAuth.getSessionUser, transitionController.deleteActionOwner);

router.get("/clientDashboardReports", isAuth.getSessionUser, transitionController.clientDashboardReports);
router.get("/updateScoreExitingSurvey", transitionController.updateScoreExitingSurvey);
router.post("/cloneTransitionProcess", isAuth.getSessionUser, transitionController.cloneTransitionProcess);
router.get("/opportunityListByTransition", isAuth.getSessionUser, transitionController.opportunityListByTransition);
router.get("/loadContactListAgainstAccount/:id", isAuth.getSessionUser, transitionController.loadContactListAgainstAccount);
router.get("/checkTransitionName/:name", isAuth.getSessionUser, transitionController.checkTransitionName);
module.exports = router;