const TransitionMastTemplates = require("../../models/Transition/Transition_Mast_Template");
const CSATValueMappings = require("../../models/Transition/Transition_CSAT_SurveyTemplate");
const TransitionPhaseTemplateValueMappings = require("../../models/Transition/Transition_Phase_Template_Value_Mapping");
const LeadsOpportunityProductCompanyMappings = require("../../models/Leads_Opportunity_Product_Company_mappings");
const masterCompanyModel = require("../../models/masterCompanyModel");
const LeadsMailTemplates = require("../../models/Leads-Mail-Templates");
const emailService = require("../../Service/SendMail");

const surveyMailNotification = async ({
  emailIds,
  surveyTemplateId,
  surveyMappedId,
  isResend = false,
}) => {
  try {
    const surveyTemplate = await TransitionMastTemplates.findById(
      surveyTemplateId
    );

    if (!surveyTemplate) {
      throw new Error("Survey template not found");
    }

    const surveyDetails = await CSATValueMappings.findById(surveyMappedId);
    const transitionDetails = await TransitionPhaseTemplateValueMappings.findById(
      surveyDetails.transitionId.toString()
    );
    const opp_details = await LeadsOpportunityProductCompanyMappings.findById(transitionDetails.opportunityDetails[0].opportunityId.toString());

    const tempSurveyId = surveyDetails?.SurveyDetails?.find((item) => item.oTemplateId.toString() === surveyTemplateId.toString())?.cSurveyTemplateId.toString();
    console.log('tempSurveyId: ', tempSurveyId);
    const companyDetails = await masterCompanyModel
      .findById(surveyDetails.oUserCompanyId)
      .populate("oContactPerson")
      .exec();

    if (!companyDetails) {
      throw new Error("Company details not found");
    }

    const mailTemplate = await LeadsMailTemplates.findById(
      process.env.SURVEY_MAIL_TEMPLATE
    );
    if (!mailTemplate) {
      throw new Error("Survey mail template not found");
    }

    const replacePlaceholders = (template, replacements) => {
      return Object.keys(replacements).reduce((acc, key) => {
        const regex = new RegExp(`#${key}#`, "g");
        return acc.replace(regex, replacements[key] || "");
      }, template);
    };

    const emailPromises = emailIds.map(async (emailObj) => {
      const email = typeof emailObj === "object" ? emailObj.email : emailObj;

      const surveyLink = `${process.env.mailPath}/survey/${surveyMappedId}?template=${tempSurveyId}&recipient=${encodeURIComponent(email)}`;

      const buttonHtml = `
        <div style="margin: 20px 0; text-align: center;">
          <a href="${surveyLink}" 
             style="background-color: #0E3133; 
                    color: white; 
                    padding: 12px 24px; 
                    text-align: center; 
                    text-decoration: none; 
                    display: inline-block; 
                    border-radius: 4px; 
                    font-weight: bold;">
            Fill Out Survey
          </a>
        </div>
        `;

      const resendNotice = isResend
        ? `<p style="color: #ff6b6b; font-weight: bold; text-align: center;">
          Reminder: This is a follow-up request to complete your survey.
        </p>`
        : "";

      const replacements = {
        SURVEY_NAME: surveyDetails.SurveyDetails[0].cSurveyName,
        COMPANY_NAME: companyDetails.company_name,
        CREATED_BY:
          surveyDetails.SurveyDetails[0].cCreatedBy?.loginName ||
          "Administrator",
        CREATION_DATE: new Date(
          surveyDetails.SurveyDetails[0].dCreatedAt
        ).toLocaleDateString(),
        SURVEY_LINK: buttonHtml,
        RESEND_NOTICE: resendNotice,
        opportunity_name: opp_details?.cOpportunityName || "",
      };

      let emailSubject = replacePlaceholders(
        mailTemplate.cSubject,
        replacements
      );

      if (isResend) {
        emailSubject = `Reminder: ${emailSubject}`;
      }

      const emailBody = replacePlaceholders(mailTemplate.cBody, replacements);

      await emailService.sendEmail({
        to: email,
        subject: emailSubject,
        html: emailBody,
      });
    });

    await Promise.all(emailPromises);

    console.log(
      `Survey emails ${isResend ? "resent" : "sent"} to ${emailIds.length} recipients`
    );
    return {
      success: true,
      message: `Survey emails ${isResend ? "resent" : "sent"} successfully`,
    };
  } catch (error) {
    console.error("Error in surveyMailNotification:", error);
    throw error;
  }
};

module.exports = {
  surveyMailNotification,
};
