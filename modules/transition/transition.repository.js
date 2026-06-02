const TransitionMastPhases = require("../../models/Transition/Transition_Mast_Phase");
const TransitionPhaseTemplateValueMappings = require("../../models/Transition/Transition_Phase_Template_Value_Mapping");
const TransitionComment = require("../../models/Transition/Transition_Comment");
const TransitionMastTemplates = require("../../models/Transition/Transition_Mast_Template");
const TransitionMastPhaseTemplateMapping = require("../../models/Transition/Transition_Mast_Phase_Template_Mapping");
const TransitionActionOwner = require("../../models/Transition/Transition_Action_Owner");
const TransitionCSATSurveyTemplate = require("../../models/Transition/Transition_CSAT_SurveyTemplate");
const TransitionCompanySurveyMapping = require("../../models/Transition/Transition_Company_Survey_Mapping");
const TransitionTasks = require("../../models/Transition/Transition_Tasks");

module.exports = {
  transitionMastPhasesRepo: { model: TransitionMastPhases },
  transitionPhaseTemplateValueMappingsRepo: { model: TransitionPhaseTemplateValueMappings },
  transitionCommentRepo: { model: TransitionComment },
  transitionMastTemplatesRepo: { model: TransitionMastTemplates },
  phaseTemplateMasterMappingsRepo: { model: TransitionMastPhaseTemplateMapping },
  transitionMastActionOwnerRepo: { model: TransitionActionOwner },
  mastCSATSurveyTemplatesRepo: { model: TransitionCSATSurveyTemplate },
  csatValueMappingsRepo: { model: TransitionCompanySurveyMapping },
  transitionTasksRepo: { model: TransitionTasks },
};
