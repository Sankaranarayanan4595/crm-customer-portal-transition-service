/**
 * Transition Repository — Data access layer for Transition entities.
 *
 * Responsible for:
 * - Scoping queries by tenant ID (oUserCompanyId)
 * - Mongoose CRUD operations for Transition models
 *
 * @module modules/transition/transition.repository
 */

const mongoose = require('mongoose');
const BaseRepository = require('../../shared/database/BaseRepository');

// Models
const TransitionMastPhases = require('../../models/Transition/Transition_Mast_Phase');
const TransitionPhaseTemplateValueMappings = require('../../models/Transition/Transition_Phase_Template_Value_Mapping');
const TransitionComment = require('../../models/Transition/Transition_Comment');
const TransitionMastTemplates = require('../../models/Transition/Transition_Mast_Template');
const PhaseTemplateMasterMappings = require('../../models/Transition/Transition_Mast_Phase_Template_Mapping');
const TransitionTasks = require('../../models/Transition/Transition_Tasks');
const TransitionMastActionOwner = require('../../models/Transition/Transition_Action_Owner');
const MastCSATSurveyTemplates = require('../../models/Transition/Transition_CSAT_SurveyTemplate');
const CSATValueMappings = require('../../models/Transition/Transition_Company_Survey_Mapping');

class TransitionMastPhasesRepository extends BaseRepository {
  constructor() {
    super(TransitionMastPhases, 'oUserCompanyId');
  }
}

class TransitionPhaseTemplateValueMappingsRepository extends BaseRepository {
  constructor() {
    super(TransitionPhaseTemplateValueMappings, 'oUserCompanyId');
  }
}

class TransitionCommentRepository extends BaseRepository {
  constructor() {
    super(TransitionComment, 'oUserCompanyId');
  }
}

class TransitionMastTemplatesRepository extends BaseRepository {
  constructor() {
    super(TransitionMastTemplates, 'oUserCompanyId');
  }
}

class PhaseTemplateMasterMappingsRepository extends BaseRepository {
  constructor() {
    super(PhaseTemplateMasterMappings, 'oUserCompanyId');
  }
}

class TransitionTasksRepository extends BaseRepository {
  constructor() {
    super(TransitionTasks, 'oUserCompanyId');
  }
}

class TransitionMastActionOwnerRepository extends BaseRepository {
  constructor() {
    super(TransitionMastActionOwner, 'oUserCompanyId');
  }
}

class MastCSATSurveyTemplatesRepository extends BaseRepository {
  constructor() {
    super(MastCSATSurveyTemplates, 'oUserCompanyId');
  }
}

class CSATValueMappingsRepository extends BaseRepository {
  constructor() {
    super(CSATValueMappings, 'oUserCompanyId');
  }
}

module.exports = {
  transitionMastPhasesRepo: new TransitionMastPhasesRepository(),
  transitionPhaseTemplateValueMappingsRepo: new TransitionPhaseTemplateValueMappingsRepository(),
  transitionCommentRepo: new TransitionCommentRepository(),
  transitionMastTemplatesRepo: new TransitionMastTemplatesRepository(),
  phaseTemplateMasterMappingsRepo: new PhaseTemplateMasterMappingsRepository(),
  transitionTasksRepo: new TransitionTasksRepository(),
  transitionMastActionOwnerRepo: new TransitionMastActionOwnerRepository(),
  mastCSATSurveyTemplatesRepo: new MastCSATSurveyTemplatesRepository(),
  csatValueMappingsRepo: new CSATValueMappingsRepository(),
};
