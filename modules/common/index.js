const commonController = require('./common.controller');
const commonRepository = require('./common.repository');

module.exports = {
  surveyMailNotification: commonController.surveyMailNotification,
  getStatusById: commonRepository.getStatusById
};
