const mongoose = require('mongoose')
const winston = require("winston");
const { format, transports, config } = require("winston");
const moment = require("moment");
require("winston-mongodb");
var fs = require("fs");

const dotenv = require("dotenv");
const CRMAuditLogs = require("../models/CRM-Audit-Logs");
const Users = require("../models/userModel");
// const { Audit_Logs } = require("../controllers/commonService");
// const { Invoice_Logs } = require("../controllers/commonService");
dotenv.config({ path: "config.env" });

let today_files = [];

// assigning file name as today date
let file_name = moment(new Date()).format("DD-MM-YYYY");

// checking the logs folder getting today created files
if (fs.existsSync("./logs")) {
  fs.readdirSync("./logs").forEach((file) => {
    if (file.split(".")[0] == file_name || file.split("_")[0] == file_name) today_files.push(file);
  });
} else {
  console.warn("Logs directory not found at ./logs. Logger will operate with default settings.");
}

// getting the file size which created latest
if (today_files.length) {
  var stats = fs.statSync(`./logs/${today_files[today_files.length - 1]}`);
  file_name = today_files[today_files.length - 1].split(".")[0];
  var fileSizeInMegabytes = stats.size / (1024 * 1024);

  if (fileSizeInMegabytes > 2) file_name = `${file_name.split("_")[0]}_${today_files.length}`;
}

const fileLogger = winston.createLogger({
  transports: [
    new transports.File({
      filename: `./logs/${file_name}.log`,
      maxsize: 2000000,
      handleExceptions: true,
      exitOnError: false,
      format: format.combine(
        format.timestamp({ format: "MMM-DD-YYYY HH:mm:ss" }),
        format.metadata(),
        format.align(),
        format.printf((info) => `${info.level}: ${[info.timestamp]}: ${info.message}`)
      ),
    }),
  ],
});

const dbLogger = winston.createLogger({
  transports: [
    new transports.MongoDB({
      levels: config.syslog.levels,
      db: `${process.env.MONGODB_CONNECTION_STRING}`,
      options: {
        useUnifiedTopology: true
      },
      collection: "ABG_server_logs",
      format: format.combine(format.timestamp({ format: "MMM-DD-YYYY HH:mm:ss" }), format.metadata(), format.json()),
    }),
  ],
});

const updateLogs = async (
  selectedCompanyId,
  collectionName,
  documentId,
  originalData,
  updateDetails,
  userId,
  reason
) => {
  // console.log("originalData: ", originalData);
  // console.log("updateDetails: ", updateDetails);
  // console.log("THIS UPDATE LOG WON'T WORK FOR NOW")
  // try {
  //   const changedOriginal = {};
  //   const changedUpdated = {};

  //   // Extract actual document data (handle Mongoose documents)
  //   const originalDoc = originalData._doc || originalData;
  //   const updateDoc = updateDetails._doc || updateDetails;

  //   // Check if documents are identical
  //   let hasChanges = false;

  //   for (const key in updateDoc) {
  //     if (["_id", "__v", "createdAt", "updatedAt"].includes(key)) continue;

  //     const oldVal = originalDoc[key];
  //     const newVal = updateDoc[key];

  //     // Handle ObjectId comparison
  //     const oldValStr = oldVal && oldVal.toString ? oldVal.toString() : JSON.stringify(oldVal);
  //     const newValStr = newVal && newVal.toString ? newVal.toString() : JSON.stringify(newVal);

  //     if (oldValStr !== newValStr) {
  //       hasChanges = true;
  //       changedOriginal[key] = oldVal;
  //       changedUpdated[key] = newVal;
  //     }
  //   }

  //   // If no changes found, use the original data as-is
  //   if (!hasChanges) {
  //     for (const key in updateDoc) {
  //       if (["_id", "__v"].includes(key)) continue;
  //       changedOriginal[key] = originalDoc[key];
  //       changedUpdated[key] = updateDoc[key];
  //     }
  //   }

  //   // Utility function to safely convert any value to string
  //   const reconcileValue = (value) => {
  //     if (Array.isArray(value)) {
  //       // Join arrays as comma-separated string or JSON if nested
  //       return value.every(v => typeof v !== "object")
  //         ? value.join(", ")
  //         : JSON.stringify(value);
  //     } else if (value && typeof value === "object") {
  //       // Convert objects to JSON string
  //       return JSON.stringify(value);
  //     } else if (value === null || value === undefined) {
  //       return "";
  //     } else {
  //       // Primitive values
  //       return String(value);
  //     }
  //   };

  //   if (Object.keys(changedUpdated).length > 0) {
  //     const cChanges = Object.keys(changedUpdated).map(field => ({
  //       cFieldChanged: field,
  //       cOldValue: reconcileValue(changedOriginal[field]),
  //       cNewValue: reconcileValue(changedUpdated[field]),
  //       userId: userId,
  //       app_id: null,
  //       empId: null,
  //       description: `Field ${field} updated`
  //     }));

  //     const auditLogData = {
  //       category: "CRM",
  //       collectionName,
  //       documentId,
  //       userId,
  //       userName: "",
  //       app_id: null,
  //       appName: "",
  //       empId: null,
  //       empName: "",
  //       cChanges,
  //       createdBy: userId,
  //       oUserCompanyId: selectedCompanyId,
  //       reason
  //     };

  //     const response = new CRMAuditLogs(auditLogData);
  //     await response.save();
  //     console.log("✅ Audit log saved successfully");
  //   }

  // } catch (error) {
  //   console.error("Error updating logs:", error);
  // }
};

// const updateLogs = async (selectedCompanyId, collectionName, Id, originalData, updateDetails, userId, response) => {
//   try {
//       const changedFields = {};
//       const originalValues = {};

//       for (const key in updateDetails) {
//           if (Object.prototype.hasOwnProperty.call(updateDetails, key) && originalData[key] !== updateDetails[key]) {
//               changedFields[key] = updateDetails[key];
//               originalValues[key] = originalData[key];
//           }
//       }

//       // Log changes if any fields were updated
//       if (Object.keys(changedFields).length > 0) {
//           await Audit_Logs(selectedCompanyId, collectionName, Id, originalValues, changedFields, userId, response);
//       }
//   } catch (error) {
//       console.error('Error updating logs:', error);
//   }
// };

const updateInvoiceLogs = async (InvoiceId, selectedCompanyId, cActionPerformed, originalData, updateDetails, userId, response, logname) => {
  try {
    const changedFields = {};
    const originalValues = {};

    for (const key in updateDetails) {
      if (Object.prototype.hasOwnProperty.call(updateDetails, key) && originalData[key] !== updateDetails[key]) {
        changedFields[key] = updateDetails[key];
        originalValues[key] = originalData[key];
      }
    }

    if (Object.keys(changedFields).length > 0) {
      await Invoice_Logs(selectedCompanyId, InvoiceId, cActionPerformed, originalValues, changedFields, userId, response, logname);
    }
  } catch (error) {
    console.error('Error updating logs:', error);
  }
};

// Add this cache utility at the top of the file
const cache = new Map();

async function getCachedValue(key, fetchFunction) {
  if (cache.has(key)) return cache.get(key);
  const value = await fetchFunction();
  cache.set(key, value);
  setTimeout(() => cache.delete(key), 300000); // Cache for 5 minutes
  return value;
}

const mongoSanitize = require("express-mongo-sanitize");

const ManualTrackPlugin = async ({
  collectionName,
  documentId,
  originalData,
  updatedData,
  userId,
  companyId,
  actionType = 'updated',
  reason = '',
  fieldsToTrack = [],
  category = "CRM",
  additionalInfo = {}
}) => {
  try {
    // console.log(`🔍 Manual tracking for ${collectionName}: ${documentId}`);
    // console.log('actionType: ', actionType);
    // console.log('reason: ', reason);
    // console.log('originalData: ', originalData);
    // console.log('updatedData: ', updatedData);

    // Clean data (deep copy and sanitize against NoSQL injection)
    const getCleanData = (doc) => {
      if (!doc) return {};
      let cleanDoc = doc;
      if (doc._doc) cleanDoc = JSON.parse(JSON.stringify(doc._doc));
      else if (doc.toObject) cleanDoc = JSON.parse(JSON.stringify(doc.toObject()));
      else cleanDoc = JSON.parse(JSON.stringify(doc));
      return mongoSanitize.sanitize(cleanDoc);
    };

    const oldDoc = getCleanData(originalData);
    const newDoc = getCleanData(updatedData);
    const changes = [];

    // IMPORTANT: Make sure we're comparing the right line items
    // For draft invoices, we should compare lineItems, not OriginallineItems
    if (collectionName === 'crm_draft_invoices') {
      // Make sure we're using the correct field names
      if (oldDoc.lineItems === undefined && oldDoc.OriginallineItems !== undefined) {
        oldDoc.lineItems = oldDoc.OriginallineItems;
      }
      if (newDoc.lineItems === undefined && newDoc.OriginallineItems !== undefined) {
        newDoc.lineItems = newDoc.OriginallineItems;
      }
    }

    // Helper function for nested fields
    const getNestedValue = (obj, path) => {
      if (!obj || !path) return undefined;
      return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
      }, obj);
    };

    // Helper functions
    const isEmptyValue = (value) => {
      if (value === null || value === undefined) return true;
      if (typeof value === 'string') return value.trim() === '';
      if (Array.isArray(value)) return value.length === 0;
      if (typeof value === 'object') {
        if (value instanceof mongoose.Types.ObjectId) return false;
        if (value instanceof Date) return false;
        return Object.keys(value).length === 0;
      }
      return false;
    };

    const formatDateToMMDDYYYY = (date) => {
      if (!date) return '';
      try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return String(date);
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();
        return `${month}/${day}/${year}`;
      } catch (error) {
        return String(date);
      }
    };

    const isDateField = (fieldName) => {
      const dateFields = [
        'dAvailabileFrom', 'dAvailabileTill', 'dCreatedAt', 'dUpdatedAt',
        'dStatusChangeDate', 'dStageChangeDate', 'dTargetclose_Date',
        'createdAt', 'updatedAt', 'dCreateDateAt', 'dUploadedAt', 'dFileUploadedAt',
        'dCreateAt', 'dInvoiceDueAt', 'dPaymentDate'
      ];
      return dateFields.includes(fieldName);
    };

    // Function to format line items with all fields (optionally only specific indices)
    const formatLineItems = (lineItems, indicesToShow = null) => {
      if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
        return 'None';
      }

      const itemsToFormat = indicesToShow
        ? lineItems.filter((_, index) => indicesToShow.includes(index))
        : lineItems;

      if (itemsToFormat.length === 0) {
        return 'None';
      }

      return itemsToFormat.map((item, arrayIndex) => {
        const originalIndex = lineItems.indexOf(item);
        const parts = [`Line ${originalIndex + 1}`];

        // Add Product Code if present
        if (item.cProductCode && item.cProductCode.trim()) {
          parts.push(`Product: ${item.cProductCode.trim()}`);
        }

        // Add Description fields
        const processDesc = item.cProcessDescription || '';
        const displayDesc = item.cDisplayDescription || '';

        if (displayDesc.trim()) {
          parts.push(`Desc: ${displayDesc.trim()}`);
        }

        // Add Billing Type
        if (item.cBillingType && item.cBillingType.trim()) {
          parts.push(`Billing: ${item.cBillingType.trim()}`);
        }

        // Add Rollover
        if (item.cReqRollOver && item.cReqRollOver.trim()) {
          parts.push(`Rollover: ${item.cReqRollOver.trim()}`);
        }

        // Add Display Zero
        if (item.cDisplayZero && item.cDisplayZero.trim()) {
          parts.push(`Show Zero: ${item.cDisplayZero.trim()}`);
        }

        // Add SOW
        if (item.cSow && item.cSow.trim()) {
          parts.push(`SOW: ${item.cSow.trim()}`);
        }

        // Add PO
        if (item.cPO && item.cPO.trim()) {
          parts.push(`PO: ${item.cPO.trim()}`);
        }

        // Add Quantity
        if (item.iQty !== undefined && item.iQty !== null) {
          parts.push(`Qty: ${item.iQty}`);
        }

        // Add Value (Unit Price)
        if (item.cValue && item.cValue.trim()) {
          let value = item.cValue.trim();
          // Format decimal places
          if (value.includes('.') && value.split('.')[1].length > 2) {
            value = parseFloat(value).toFixed(2);
          }
          parts.push(`Value: ${value}`);
        }

        // Add Total
        if (item.cSubTotal && item.cSubTotal.trim()) {
          parts.push(`Total: ${item.cSubTotal.trim()}`);
        }

        // Add Comments count
        if (item.Comments && Array.isArray(item.Comments) && item.Comments.length > 0) {
          parts.push(`Comments: ${item.Comments.length}`);
        }

        // Add Files count
        if (item.Files && Array.isArray(item.Files) && item.Files.length > 0) {
          parts.push(`Files: ${item.Files.length}`);
        }

        return parts.join(', ');
      }).join('\n');
    };

    // Function to resolve status names
    const resolveStatusName = async (statusId) => {
      if (!statusId || statusId === 'None') return 'None';

      try {
        // If it's already a status name (like "Saved", "Generated"), return it
        if (typeof statusId === 'string' && !mongoose.Types.ObjectId.isValid(statusId)) {
          return statusId;
        }

        // Only try to resolve if it's a valid ObjectId
        if (typeof statusId === 'string' && mongoose.Types.ObjectId.isValid(statusId)) {
          const statusDoc = await mongoose.model("leads_master_statuses")
            .findOne({ _id: String(statusId) })
            .select('cStatus_Name')
            .lean();
          return statusDoc?.cStatus_Name || statusId;
        }
        return String(statusId);
      } catch (error) {
        console.log("Error resolving status:", error);
        return String(statusId);
      }
    };

    // Function to resolve user names
    const resolveUserName = async (userId) => {
      if (!userId || userId === 'None') return 'None';

      try {
        if (typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)) {
          const user = await Users.findOne({ _id: String(userId) }).select('loginName').lean();
          return user?.loginName || userId;
        }
        return String(userId);
      } catch (error) {
        console.log("Error resolving user:", error);
        return String(userId);
      }
    };

    // Function to resolve account names
    const resolveAccountName = async (accountId) => {
      if (!accountId || accountId === 'None') return 'None';

      try {
        if (typeof accountId === 'string' && mongoose.Types.ObjectId.isValid(accountId)) {
          // Try master company first
          let company = await masterCompanyModel.findOne({ _id: String(accountId) }).select('company_name').lean();
          if (!company) {
            // Try lead company
            company = await LeadCompanyDetails.findOne({ _id: String(accountId) }).select('company_name').lean();
          }
          return company?.company_name || accountId;
        }
        return String(accountId);
      } catch (error) {
        console.log("Error resolving account:", error);
        return String(accountId);
      }
    };

    // Update the formatTransitionValues function
    const formatTransitionValues = (values) => {
      if (!values || typeof values !== 'object' || Object.keys(values).length === 0) {
        return 'None';
      }

      const formatted = [];
      Object.entries(values).forEach(([key, value]) => {
        // Skip empty values
        if (value === null || value === undefined || value === '') {
          return;
        }

        // Clean the key name
        const cleanKey = key
          .replace(/^\d+_/, '')
          .replace(/_/g, ' ')
          .replace(/^status_/i, 'Status: ')
          .replace(/^actualStartDate_/i, 'Actual Start Date: ')
          .replace(/^targetStartDate_/i, 'Target Start Date: ')
          .replace(/^targetEndDate_/i, 'Target End Date: ')
          .replace(/^actualEndDate_/i, 'Actual End Date: ')
          .replace(/^outcome_/i, 'Outcome: ')
          .replace(/^owner_/i, 'Owner: ')
          .replace(/^score_/i, 'Score: ');

        let displayValue = value;

        // Check if it's a date field
        if (key.includes('Date') || key.includes('date')) {
          displayValue = formatDateToMMDDYYYY(value);
        }

        // Handle arrays
        if (Array.isArray(value)) {
          displayValue = value.join(', ');
        }

        // Handle objects
        if (typeof value === 'object' && !Array.isArray(value)) {
          try {
            displayValue = JSON.stringify(value);
          } catch {
            displayValue = '[Object]';
          }
        }

        formatted.push(`${cleanKey}: ${displayValue}`);
      });

      return formatted.length > 0 ? formatted.join('\n') : 'None';
    };

    // Update the formatValueForDisplay function
    const formatValueForDisplay = async (value, field) => {
      // console.log('field: ', field);
      if (value === null || value === undefined) return 'None';

      // Handle empty strings
      if (typeof value === 'string' && value.trim() === '') {
        return 'None';
      }

      // Special date handling
      const isDateField = field.includes('Date') || field.includes('date') ||
        field === 'dUpdatedAt' || field === 'dCreatedAt' ||
        (typeof value === 'string' && (
          value.match(/^\d{4}-\d{2}-\d{2}/) || // YYYY-MM-DD
          value.match(/^\d{4}-\d{2}-\d{2}T/) || // ISO format
          value.match(/^\d{2}\/\d{2}\/\d{4}/) // MM/DD/YYYY
        ));

      if (isDateField) {
        if (typeof value === 'string') {
          // Parse the date string
          let date;
          if (value.includes('T')) {
            // ISO format with time
            date = new Date(value);
          } else if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // YYYY-MM-DD format
            date = new Date(value + 'T00:00:00');
          } else if (value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            // MM/DD/YYYY format
            const [month, day, year] = value.split('/');
            date = new Date(year, month - 1, day);
          } else {
            // Try parsing as is
            date = new Date(value);
          }

          if (!isNaN(date.getTime())) {
            return formatDateToMMDDYYYY(date);
          }
        } else if (value instanceof Date) {
          return formatDateToMMDDYYYY(value);
        }
        // If we can't parse it, return the string as-is
      }

      // Handle transition values
      if (field.includes('componentValues') || field.includes('KpiValues') || field.includes('tollgateValues')) {
        return formatTransitionValues(value);
      }

      // Handle arrays
      if (Array.isArray(value)) {
        if (value.length === 0) return 'None';

        if (field === 'lineItems') {
          return formatLineItems(value);
        }

        // Join array items
        return value.map(item => {
          if (typeof item === 'object') return JSON.stringify(item);
          return String(item);
        }).join(', ');
      }

      // Handle ObjectId
      if (value instanceof mongoose.Types.ObjectId ||
        (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value))) {

        if (field === 'oStatus_Id' || field.includes('Status')) {
          return await resolveStatusName(value);
        }

        if (field.includes('By') || field.includes('User')) {
          return await resolveUserName(value);
        }

        if (field.includes('Company') || field.includes('Account')) {
          return await resolveAccountName(value);
        }

        return String(value);
      }

      // Handle objects
      if (typeof value === 'object' && !(value instanceof Date)) {
        if (field === 'phasesTableValues') {
          if (Object.keys(value).length === 0) return 'None';
          const formatted = Object.entries(value).map(([key, val]) =>
            `${key}: ${val || 'Empty'}`
          ).join('\n');
          return formatted;
        }

        try {
          return JSON.stringify(value);
        } catch {
          return '[Object]';
        }
      }

      // Handle booleans
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
      }

      // Handle numbers
      if (typeof value === 'number') {
        return String(value);
      }

      // Handle strings
      if (typeof value === 'string') {
        return value;
      }

      // Default
      return String(value);
    };


    // Get field label based on collection
    const getFieldLabel = async (fieldKey) => {
      try {
        // Handle nested field paths
        if (fieldKey.includes('.')) {
          // Map common nested fields to readable names
          const nestedFieldMap = {
            'transitionDetails.componentValues': 'Checklist Values',
            'transitionDetails.KpiValues': 'KPI Values',
            'transitionDetails.tollgateValues': 'Tollgate Values',
            'phasesTableValues': 'Phases Table Values',
            'summary.checklist_score': 'Checklist Score',
            'summary.kpi_score': 'KPI Score',
            'summary.tollgate_score': 'Tollgate Score',
            'oStatus_Id': 'Status'
          };
          return nestedFieldMap[fieldKey] || fieldKey;
        }

        switch (collectionName) {
          case 'transition_phase_template_value_mappings':
            const transitionFieldMap = {
              'transitionDetails': 'Transition Details',
              'phasesTableValues': 'Phases Table Values',
              'summary': 'Summary Scores',
              'oStatus_Id': 'Status',
              'cUpdatedBy': 'Updated By',
              'dUpdatedAt': 'Updated Date',
              'componentValues': 'Checklist Values',
              'KpiValues': 'KPI Values',
              'tollgateValues': 'Tollgate Values'
            };
            return transitionFieldMap[fieldKey] || fieldKey;
          case 'crm_draft_invoices':
            return await require("../Service/fieldNameMapping").getDraftInvoiceFieldLabel(fieldKey) || fieldKey;
          case 'crm_invoices_histories':
            return await require("../Service/fieldNameMapping").getInvoiceHistoryFieldLabel(fieldKey) || fieldKey;
          case 'crm_generaterealestatebilling_histories':
            return await require("../Service/fieldNameMapping").getBillingRowFieldLabel(fieldKey) || fieldKey;
          case 'leads_productcategory_product_mappings':
            return await require("../Service/fieldNameMapping").getProductFieldLabel(fieldKey) || fieldKey;
          case 'mast_company_informations':
          case 'leads_company_details':
            return await require("../Service/fieldNameMapping").getAccountFieldLabel(fieldKey) || fieldKey;
          case 'leads_opportunity_product_company_mappings':
            return await require("../Service/fieldNameMapping").getOpportunityFieldLabel(fieldKey) || fieldKey;
          default:
            return fieldKey;
        }
      } catch (error) {
        console.log("Error getting field label:", error);
        return fieldKey;
      }
    };

    // SPECIAL HANDLING FOR CREATION SCENARIO
    if (actionType === 'created') {
      // console.log('🆕 Handling creation scenario');

      // Define which fields to track for creation
      const creationFields = {
        'crm_invoices_histories': [
          'netSuiteInvoiceNo', 'cTotal', 'cInvoiceDuration',
          'cInvoice_Date', 'dInvoiceDueAt', 'lineItems', 'oPaymentStatus',
          'oCompany_Id', 'oDraft_Id', 'oTerms_Id', 'cBalanceDue', 'cAmountPaid'
        ],
        'crm_draft_invoices': [
          'iDraftNo', 'oInvoiceDraftStatus', 'cInvoiceDuration',
          'cTotal', 'lineItems', 'oCompany_Id', 'oSubClass'
        ],
        'crm_generaterealestatebilling_histories': [
          'cInvoicePeriod', 'cStatus', 'cRemarks', 'lineItems',
          'cTotal', 'oUserCompanyId', 'oCreatedBy'
        ],
        'transition_phase_template_value_mappings': [
          'transitionDetails', 'phasesTableValues', 'summary',
          'oStatus_Id', 'cCreatedBy', 'dCreatedAt'
        ]
      };

      const fieldsToCheck = fieldsToTrack.length > 0 ?
        fieldsToTrack :
        (creationFields[collectionName] || Object.keys(newDoc).filter(key => !key.startsWith('_')));

      for (const field of fieldsToCheck) {
        const fieldValue = newDoc[field];
        if (!isEmptyValue(fieldValue)) {
          const fieldLabel = await getFieldLabel(field);
          const formattedValue = await formatValueForDisplay(fieldValue, field);

          if (formattedValue !== 'None' && formattedValue !== '') {
            changes.push({
              cFieldChanged: fieldLabel,
              cOldValue: 'None',
              cNewValue: formattedValue,
              userId: userId,
              description: `Initial value`
            });
          }
        }
      }

      // Special handling for line items in billing rows and invoices
      if ((collectionName === 'crm_invoices_histories' ||
        collectionName === 'crm_draft_invoices' ||
        collectionName === 'crm_generaterealestatebilling_histories') &&
        newDoc.lineItems && Array.isArray(newDoc.lineItems)) {

        const lineItemSummary = formatLineItems(newDoc.lineItems);

        if (lineItemSummary !== 'None') {
          changes.push({
            cFieldChanged: 'Line Items',
            cOldValue: 'None',
            cNewValue: lineItemSummary,
            userId: userId,
            description: `Line items added`
          });
        }
      }

    }
    // HANDLING UPDATES FOR DRAFT INVOICES WITH APPROVAL DATA
    else if (collectionName === 'crm_draft_invoices' && additionalInfo.approvalData) {
      // console.log('📝 Handling draft invoice approval');
      const approvalData = additionalInfo.approvalData;

      // Track status change
      if (oldDoc.oInvoiceDraftStatus !== newDoc.oInvoiceDraftStatus) {
        const oldStatus = await formatValueForDisplay(oldDoc.oInvoiceDraftStatus, 'oInvoiceDraftStatus');
        const newStatus = await formatValueForDisplay(newDoc.oInvoiceDraftStatus, 'oInvoiceDraftStatus');

        changes.push({
          cFieldChanged: 'Approval Status',
          cOldValue: oldStatus,
          cNewValue: newStatus,
          userId: userId,
          description: 'Invoice submitted for approval'
        });
      }

      // Add approval details - show each field separately
      if (approvalData) {
        // Account Name
        if (approvalData.accountName) {
          changes.push({
            cFieldChanged: 'Account',
            cOldValue: 'None',
            cNewValue: approvalData.accountName,
            userId: userId,
            description: 'Account for approval'
          });
        }

        // Requested By
        if (approvalData.requestedBy) {
          const requestedByName = await resolveUserName(approvalData.requestedBy);
          changes.push({
            cFieldChanged: 'Submitted By',
            cOldValue: 'None',
            cNewValue: requestedByName,
            userId: userId,
            description: 'User who submitted for approval'
          });
        }

        // Approval Level
        if (approvalData.currentLevel) {
          changes.push({
            cFieldChanged: 'Approval Level',
            cOldValue: 'None',
            cNewValue: approvalData.currentLevel,
            userId: userId,
            description: 'Approval level'
          });
        }

        // Approvers
        if (approvalData.approvers && Array.isArray(approvalData.approvers) && approvalData.approvers.length > 0) {
          const approverNames = await Promise.all(
            approvalData.approvers.map(uid => resolveUserName(uid))
          );
          const validApproverNames = approverNames.filter(n => n !== 'None');

          if (validApproverNames.length > 0) {
            changes.push({
              cFieldChanged: 'Approvers',
              cOldValue: 'None',
              cNewValue: validApproverNames.join(', '),
              userId: userId,
              description: 'Users assigned for approval'
            });
          }
        }
      }

      // Track approval/rejection action
      if (approvalData.action) {
        const actionDescription = approvalData.action === 'approve' ? 'Approved' : 'Rejected';
        const approverName = approvalData.approverName || await resolveUserName(userId);

        changes.push({
          cFieldChanged: 'Action',
          cOldValue: 'Pending',
          cNewValue: `${actionDescription} by ${approverName}`,
          userId: userId,
          description: `${actionDescription} action`
        });

        // Reason for approval/rejection
        if (approvalData.reason) {
          changes.push({
            cFieldChanged: 'Reason',
            cOldValue: 'None',
            cNewValue: approvalData.reason,
            userId: userId,
            description: `${actionDescription} reason`
          });
        }
      }

      // Track other field changes
      const fieldsToCheck = fieldsToTrack.length > 0 ?
        fieldsToTrack.filter(f => !['oInvoiceDraftStatus'].includes(f)) :
        [];

      for (const field of fieldsToCheck) {
        if (oldDoc[field] !== newDoc[field]) {
          const fieldLabel = await getFieldLabel(field);
          const oldValue = await formatValueForDisplay(oldDoc[field], field);
          const newValue = await formatValueForDisplay(newDoc[field], field);

          if (oldValue !== newValue && newValue !== 'None') {
            changes.push({
              cFieldChanged: fieldLabel,
              cOldValue: oldValue === 'None' || !oldValue ? 'None' : oldValue,
              cNewValue: newValue,
              userId: userId,
              description: `${fieldLabel} updated`
            });
          }
        }
      }

    }
    // Update the HANDLING TRANSITION TEMPLATE UPDATES section
    else if (collectionName === 'transition_phase_template_value_mappings') {
      // console.log('🔄 Handling transition template update');

      // Helper function to compare any two values properly
      const valuesAreDifferent = (oldVal, newVal, fieldName = '') => {
        // Handle null/undefined/empty
        if (!oldVal && !newVal) return false;
        if (!oldVal || !newVal) return true;

        // Special handling for dates
        if (fieldName.includes('Date') || fieldName.includes('date') ||
          (typeof oldVal === 'string' && oldVal.includes('T')) ||
          (typeof newVal === 'string' && newVal.includes('T'))) {

          const normalizeDate = (dateVal) => {
            if (!dateVal) return '';
            if (dateVal instanceof Date) return dateVal.toISOString().split('T')[0];
            if (typeof dateVal === 'string') {
              // Extract just the date part for comparison
              const dateMatch = dateVal.match(/(\d{4}-\d{2}-\d{2})/);
              return dateMatch ? dateMatch[0] : dateVal;
            }
            return String(dateVal);
          };

          return normalizeDate(oldVal) !== normalizeDate(newVal);
        }

        // Handle arrays
        if (Array.isArray(oldVal) || Array.isArray(newVal)) {
          const oldArray = Array.isArray(oldVal) ? oldVal : [];
          const newArray = Array.isArray(newVal) ? newVal : [];
          return JSON.stringify(oldArray) !== JSON.stringify(newArray);
        }

        // Handle objects
        if (typeof oldVal === 'object' && typeof newVal === 'object') {
          return JSON.stringify(oldVal) !== JSON.stringify(newVal);
        }

        // Handle strings (trim for comparison)
        if (typeof oldVal === 'string' && typeof newVal === 'string') {
          return oldVal.trim() !== newVal.trim();
        }

        // Default comparison
        return oldVal !== newVal;
      };

      // Handle specific fields from additionalInfo
      if (additionalInfo.updateType) {
        switch (additionalInfo.updateType) {
          case 'checklist':
            const templateId = additionalInfo.templateId;

            // Find the specific transition detail that was updated
            const oldDetail = oldDoc.transitionDetails?.find(td =>
              td.oTemplateId?.toString() === templateId
            );
            const newDetail = newDoc.transitionDetails?.find(td =>
              td.oTemplateId?.toString() === templateId
            );

            if (oldDetail && newDetail) {
              const oldChecklist = oldDetail.componentValues || {};
              const newChecklist = newDetail.componentValues || {};

              // Find all unique keys
              const allKeys = new Set([
                ...Object.keys(oldChecklist),
                ...Object.keys(newChecklist)
              ]);

              // Track changed fields
              for (const key of allKeys) {
                const oldValue = oldChecklist[key];
                const newValue = newChecklist[key];

                // Use the helper function to check for differences
                if (valuesAreDifferent(oldValue, newValue, key)) {
                  // Get the field name without the prefix
                  const fieldName = key
                    .replace(/^\d+_/, '')
                    .replace(/_/g, ' ');

                  const formattedOldValue = await formatValueForDisplay(oldValue, key);
                  const formattedNewValue = await formatValueForDisplay(newValue, key);

                  // Only add to changes if values are different after formatting
                  if (formattedOldValue !== formattedNewValue) {
                    changes.push({
                      cFieldChanged: fieldName,
                      cOldValue: formattedOldValue === 'None' || !formattedOldValue ? 'None' : formattedOldValue,
                      cNewValue: formattedNewValue === 'None' || !formattedNewValue ? 'None' : formattedNewValue,
                      userId: userId,
                      description: `${fieldName} updated`
                    });
                  }
                }
              }
            }
            break;

          case 'kpiTransition':
            // Handle KPI updates
            const oldTransitionDetails = oldDoc.transitionDetails || [];
            const newTransitionDetails = newDoc.transitionDetails || [];

            for (let i = 0; i < newTransitionDetails.length; i++) {
              const oldItem = oldTransitionDetails[i] || {};
              const newItem = newTransitionDetails[i] || {};
              const templateId = newItem.oTemplateId?.toString() || 'Unknown';

              // Check if KpiValues exist and have changed
              if (newItem.KpiValues && Object.keys(newItem.KpiValues).length > 0) {
                const oldKpi = oldItem.KpiValues || {};
                const newKpi = newItem.KpiValues || {};

                // Check all KPI fields
                const allKpiKeys = new Set([
                  ...Object.keys(oldKpi),
                  ...Object.keys(newKpi)
                ]);

                for (const key of allKpiKeys) {
                  if (valuesAreDifferent(oldKpi[key], newKpi[key], key)) {
                    const fieldName = key
                      .replace(/^\d+_/, '')
                      .replace(/_/g, ' ');

                    const formattedOldValue = await formatValueForDisplay(oldKpi[key], key);
                    const formattedNewValue = await formatValueForDisplay(newKpi[key], key);

                    if (formattedOldValue !== formattedNewValue) {
                      changes.push({
                        cFieldChanged: `${fieldName} (KPI)`,
                        cOldValue: formattedOldValue === 'None' || !formattedOldValue ? 'None' : formattedOldValue,
                        cNewValue: formattedNewValue === 'None' || !formattedNewValue ? 'None' : formattedNewValue,
                        userId: userId,
                        description: `KPI ${fieldName} updated for template ${templateId}`
                      });
                    }
                  }
                }
              }
            }
            break;

          case 'tollgate':
            // Handle tollgate updates
            const oldDetails = oldDoc.transitionDetails || [];
            const newDetails = newDoc.transitionDetails || [];

            for (let i = 0; i < newDetails.length; i++) {
              const oldItem = oldDetails[i] || {};
              const newItem = newDetails[i] || {};
              const templateId = newItem.oTemplateId?.toString() || 'Unknown';

              // Check if tollgateValues exist and have changed
              if (newItem.tollgateValues && Object.keys(newItem.tollgateValues).length > 0) {
                const oldTollgate = oldItem.tollgateValues || {};
                const newTollgate = newItem.tollgateValues || {};

                // Check all tollgate fields
                const allTollgateKeys = new Set([
                  ...Object.keys(oldTollgate),
                  ...Object.keys(newTollgate)
                ]);

                for (const key of allTollgateKeys) {
                  if (valuesAreDifferent(oldTollgate[key], newTollgate[key], key)) {
                    const fieldName = key
                      .replace(/^\d+_/, '')
                      .replace(/_/g, ' ');

                    const formattedOldValue = await formatValueForDisplay(oldTollgate[key], key);
                    const formattedNewValue = await formatValueForDisplay(newTollgate[key], key);

                    if (formattedOldValue !== formattedNewValue) {
                      changes.push({
                        cFieldChanged: `${fieldName} (Tollgate)`,
                        cOldValue: formattedOldValue === 'None' || !formattedOldValue ? 'None' : formattedOldValue,
                        cNewValue: formattedNewValue === 'None' || !formattedNewValue ? 'None' : formattedNewValue,
                        userId: userId,
                        description: `Tollgate ${fieldName} updated for template ${templateId}`
                      });
                    }
                  }
                }
              }
            }
            break;

          case 'phases_table':
            // Handle phases table updates
            const oldPhases = oldDoc.phasesTableValues || {};
            const newPhases = newDoc.phasesTableValues || {};

            // Check all phase table fields
            const allPhaseKeys = new Set([
              ...Object.keys(oldPhases),
              ...Object.keys(newPhases)
            ]);

            for (const key of allPhaseKeys) {
              const oldValue = oldPhases[key];
              const newValue = newPhases[key];

              if (valuesAreDifferent(oldValue, newValue, key)) {
                const fieldLabel = key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase());

                const formattedOldValue = await formatValueForDisplay(oldValue, key);
                const formattedNewValue = await formatValueForDisplay(newValue, key);

                if (formattedOldValue !== formattedNewValue) {
                  changes.push({
                    cFieldChanged: fieldLabel,
                    cOldValue: formattedOldValue === 'None' || !formattedOldValue ? 'None' : formattedOldValue,
                    cNewValue: formattedNewValue === 'None' || !formattedNewValue ? 'None' : formattedNewValue,
                    userId: userId,
                    description: `${fieldLabel} updated`
                  });
                }
              }
            }
            break;
        }
      }

      // Handle summary updates
      if (additionalInfo.summary) {
        const oldSummary = oldDoc.summary || [];
        const newSummary = additionalInfo.summary || [];

        // Check each summary item
        for (let i = 0; i < Math.max(oldSummary.length, newSummary.length); i++) {
          const oldItem = oldSummary[i] || {};
          const newItem = newSummary[i] || {};

          if (valuesAreDifferent(oldItem, newItem)) {
            const phaseId = newItem.cPhaseId || oldItem.cPhaseId || 'Unknown';
            const phaseName = await getCachedValue(`phase_${phaseId}`,
              () => mongoose.model("Transition_Mast_Phases").findOne({ _id: phaseId }).select('cPhaseName'));

            const fieldLabel = `Phase: ${phaseName?.cPhaseName || phaseId}`;

            // Check individual score fields
            const scoreFields = ['checklist_score', 'kpi_score', 'tollgate_score'];
            for (const scoreField of scoreFields) {
              if (valuesAreDifferent(oldItem[scoreField], newItem[scoreField])) {
                const scoreLabel = scoreField.replace('_score', ' Score').replace(/_/g, ' ');

                changes.push({
                  cFieldChanged: `${fieldLabel} - ${scoreLabel}`,
                  cOldValue: await formatValueForDisplay(oldItem[scoreField], scoreField),
                  cNewValue: await formatValueForDisplay(newItem[scoreField], scoreField),
                  userId: userId,
                  description: `${scoreLabel} updated`
                });
              }
            }
          }
        }
      }

      // Handle status changes
      if (oldDoc.oStatus_Id !== newDoc.oStatus_Id) {
        const oldStatus = await formatValueForDisplay(oldDoc.oStatus_Id, 'oStatus_Id');
        const newStatus = await formatValueForDisplay(newDoc.oStatus_Id, 'oStatus_Id');

        changes.push({
          cFieldChanged: 'Status',
          cOldValue: oldStatus,
          cNewValue: newStatus,
          userId: userId,
          description: additionalInfo.isModified ? 'Status changed to In Progress' : 'Status updated'
        });
      }

      // Handle updated by and date changes
      if (oldDoc.cUpdatedBy !== newDoc.cUpdatedBy) {
        const oldUser = await formatValueForDisplay(oldDoc.cUpdatedBy, 'cUpdatedBy');
        const newUser = await formatValueForDisplay(newDoc.cUpdatedBy, 'cUpdatedBy');

        changes.push({
          cFieldChanged: 'Updated By',
          cOldValue: oldUser,
          cNewValue: newUser,
          userId: userId,
          description: 'Updated by changed'
        });
      }

      // Always track the update timestamp
      changes.push({
        cFieldChanged: 'Last Updated',
        cOldValue: await formatValueForDisplay(oldDoc.dUpdatedAt, 'dUpdatedAt'),
        cNewValue: await formatValueForDisplay(newDoc.dUpdatedAt, 'dUpdatedAt'),
        userId: userId,
        description: 'Last updated timestamp'
      });
    }

    // HANDLING REGULAR UPDATES for other collections
    else if (actionType === 'updated') {
      // console.log('✏️ Handling update scenario');

      // Helper function to calculate total from line items
      const calculateLineItemsTotal = (lineItems) => {
        if (!lineItems || !Array.isArray(lineItems)) return 0;
        return lineItems.reduce((total, item) => {
          const itemTotal = parseFloat(item.cSubTotal) || 0;
          return total + itemTotal;
        }, 0);
      };

      // Helper function to compare line items deeply and track which lines changed
      const compareLineItems = (oldItems, newItems) => {
        const changedLineIndices = [];

        // If both are empty or null, no changes
        if ((!oldItems || oldItems.length === 0) && (!newItems || newItems.length === 0)) {
          return { hasChanges: false, changedIndices: [] };
        }

        // If lengths are different, all lines are considered changed
        if ((oldItems?.length || 0) !== (newItems?.length || 0)) {
          // console.log(`Length changed: ${oldItems?.length || 0} -> ${newItems?.length || 0}`);
          // Mark all indices as changed
          for (let i = 0; i < Math.max(oldItems?.length || 0, newItems?.length || 0); i++) {
            changedLineIndices.push(i);
          }
          return { hasChanges: true, changedIndices: changedLineIndices };
        }

        // Compare each line item
        for (let i = 0; i < oldItems.length; i++) {
          const oldItem = oldItems[i];
          const newItem = newItems[i];

          // If either item is null/undefined at this index, there's a change
          if (!oldItem || !newItem) {
            // console.log(`Item missing at index ${i}: old=${!!oldItem}, new=${!!newItem}`);
            changedLineIndices.push(i);
            continue;
          }

          let lineHasChanges = false;

          // Define ALL fields to compare (including Comments and Files)
          const fieldsToCompare = [
            'cProcessDescription', 'cDisplayDescription', 'cBillingType',
            'cReqRollOver', 'cDisplayZero', 'cSow', 'cPO', 'iQty',
            'cValue', 'cSubTotal', 'cClientName', 'cClientID',
            'cProductCode', 'cUniqueOppoLineCode'
          ];

          // Compare each field
          for (const field of fieldsToCompare) {
            const oldValue = oldItem[field];
            const newValue = newItem[field];

            // Special handling for different data types
            if (field === 'iQty') {
              // Compare numbers
              const oldQty = parseFloat(oldValue) || 0;
              const newQty = parseFloat(newValue) || 0;
              if (oldQty !== newQty) {
                // console.log(`Change detected in Qty at index ${i}: ${oldQty} -> ${newQty}`);
                lineHasChanges = true;
                break;
              }
            } else if (field === 'cValue' || field === 'cSubTotal') {
              // Compare numeric strings (normalize)
              const normalizeNumber = (val) => {
                if (!val) return '0';
                const num = parseFloat(String(val).replace(/[^\d.-]/g, ''));
                return isNaN(num) ? '0' : num.toString();
              };
              const oldNum = normalizeNumber(oldValue);
              const newNum = normalizeNumber(newValue);
              if (oldNum !== newNum) {
                // console.log(`Change detected in ${field} at index ${i}: ${oldNum} -> ${newNum}`);
                lineHasChanges = true;
                break;
              }
            } else {
              // Compare other fields (including empty strings)
              const oldStr = oldValue !== undefined && oldValue !== null ? String(oldValue).trim() : '';
              const newStr = newValue !== undefined && newValue !== null ? String(newValue).trim() : '';
              if (oldStr !== newStr) {
                // console.log(`Change detected in ${field} at index ${i}: "${oldStr}" -> "${newStr}"`);
                lineHasChanges = true;
                break;
              }
            }
          }

          // Compare Comments arrays (only count, not content)
          const oldComments = oldItem.Comments || [];
          const newComments = newItem.Comments || [];
          if (oldComments.length !== newComments.length) {
            // console.log(`Comments count changed at index ${i}: ${oldComments.length} -> ${newComments.length}`);
            lineHasChanges = true;
          }

          // Compare Files arrays (only count, not content)
          const oldFiles = oldItem.Files || [];
          const newFiles = newItem.Files || [];
          if (oldFiles.length !== newFiles.length) {
            // console.log(`Files count changed at index ${i}: ${oldFiles.length} -> ${newFiles.length}`);
            lineHasChanges = true;
          }

          if (lineHasChanges) {
            changedLineIndices.push(i);
          }
        }

        return {
          hasChanges: changedLineIndices.length > 0,
          changedIndices: changedLineIndices
        };
      };

      // Get all fields that have changed
      const allFields = new Set([...Object.keys(oldDoc), ...Object.keys(newDoc)]);
      const fieldsToCheck = fieldsToTrack.length > 0 ?
        fieldsToTrack.filter(f => {
          // Check if field is nested path
          if (f.includes('.')) {
            const oldValue = getNestedValue(oldDoc, f);
            const newValue = getNestedValue(newDoc, f);
            return oldValue !== undefined || newValue !== undefined;
          }
          return allFields.has(f);
        }) :
        Array.from(allFields).filter(key => !key.startsWith('_') && !key.startsWith('__'));

      // First, handle line items separately if they exist
      if (oldDoc.lineItems || newDoc.lineItems) {
        const oldLineItems = oldDoc.lineItems || [];
        const newLineItems = newDoc.lineItems || [];

        // console.log('DEBUG - Comparing line items:');
        // console.log('Old line items count:', oldLineItems.length);
        // console.log('New line items count:', newLineItems.length);

        // Check if there are actual changes in line items and get which lines changed
        const comparisonResult = compareLineItems(oldLineItems, newLineItems);
        // console.log('Has line item changes?', comparisonResult.hasChanges);
        // console.log('Changed line indices:', comparisonResult.changedIndices);

        if (comparisonResult.hasChanges) {
          const fieldLabel = await getFieldLabel('lineItems');

          // Get formatted old and new line items - ONLY the changed lines
          const formattedOldValue = formatLineItems(oldLineItems, comparisonResult.changedIndices);
          const formattedNewValue = formatLineItems(newLineItems, comparisonResult.changedIndices);

          // console.log('Formatted old value (changed lines only):', formattedOldValue);
          // console.log('Formatted new value (changed lines only):', formattedNewValue);

          // Add the line items change
          changes.push({
            cFieldChanged: fieldLabel,
            cOldValue: formattedOldValue === 'None' || !formattedOldValue ? 'None' : formattedOldValue,
            cNewValue: formattedNewValue === 'None' || !formattedNewValue ? 'None' : formattedNewValue,
            userId: userId,
            description: 'Line Items updated'
          });
        }
      }

      // Now handle other fields (skip lineItems since we already handled it)
      for (const field of fieldsToCheck) {
        // Skip lineItems as we already handled it
        if (field === 'lineItems') continue;

        let oldValue, newValue;

        if (field.includes('.')) {
          // Handle nested fields
          oldValue = getNestedValue(oldDoc, field);
          newValue = getNestedValue(newDoc, field);
        } else {
          oldValue = oldDoc[field];
          newValue = newDoc[field];
        }

        // Skip if both are undefined
        if (oldValue === undefined && newValue === undefined) {
          continue;
        }

        // Handle arrays specially for transitionDetails
        if (field === 'transitionDetails' && Array.isArray(oldValue) && Array.isArray(newValue)) {
          // Compare each transition detail item
          for (let i = 0; i < Math.max(oldValue.length, newValue.length); i++) {
            const oldItem = oldValue[i] || {};
            const newItem = newValue[i] || {};

            // Check for changes in componentValues, KpiValues, or tollgateValues
            const valueTypes = ['componentValues', 'KpiValues', 'tollgateValues'];

            for (const valueType of valueTypes) {
              if (JSON.stringify(oldItem[valueType]) !== JSON.stringify(newItem[valueType])) {
                const fieldLabel = `${valueType} in Transition Detail ${i + 1}`;
                const formattedOldValue = await formatValueForDisplay(oldItem[valueType], valueType);
                const formattedNewValue = await formatValueForDisplay(newItem[valueType], valueType);

                changes.push({
                  cFieldChanged: fieldLabel,
                  cOldValue: formattedOldValue === 'None' || !formattedOldValue ? 'None' : formattedOldValue,
                  cNewValue: formattedNewValue === 'None' || !formattedNewValue ? 'None' : formattedNewValue,
                  userId: userId,
                  description: `${fieldLabel} updated`
                });
              }
            }
          }
          continue;
        }

        // Check if the field has changed
        let hasChanged = JSON.stringify(oldValue) !== JSON.stringify(newValue);

        // For cTotal, also check if the calculated total matches line items
        if (field === 'cTotal') {
          const oldTotal = parseFloat(oldValue) || 0;
          const newTotal = parseFloat(newValue) || 0;
          const lineItemsTotal = calculateLineItemsTotal(newDoc.lineItems || []);

          // Only track if the total actually changed or doesn't match line items
          if (oldTotal !== newTotal || Math.abs(newTotal - lineItemsTotal) > 0.01) {
            hasChanged = true;
          }
        }

        if (hasChanged) {
          const fieldLabel = await getFieldLabel(field);
          const formattedOldValue = await formatValueForDisplay(oldValue, field);
          const formattedNewValue = await formatValueForDisplay(newValue, field);

          // Skip if both values are None or empty
          if ((formattedOldValue === 'None' && formattedNewValue === 'None') ||
            (formattedOldValue === '' && formattedNewValue === '')) {
            continue;
          }

          // Special handling for total amount field
          if (field === 'cTotal') {
            changes.push({
              cFieldChanged: 'Total Amount',
              cOldValue: formattedOldValue === 'None' || !formattedOldValue ? 'None' : formattedOldValue,
              cNewValue: formattedNewValue === 'None' || !formattedNewValue ? 'None' : formattedNewValue,
              userId: userId,
              description: 'Total Amount updated'
            });
          }
          // Special handling for draft status
          else if (field === 'oInvoiceDraftStatus') {
            changes.push({
              cFieldChanged: 'Draft Status',
              cOldValue: formattedOldValue === 'None' || !formattedOldValue ? 'None' : formattedOldValue,
              cNewValue: formattedNewValue === 'None' || !formattedNewValue ? 'None' : formattedNewValue,
              userId: userId,
              description: 'Draft Status updated'
            });
          }
          // Handle other fields
          else {
            changes.push({
              cFieldChanged: fieldLabel,
              cOldValue: formattedOldValue === 'None' || !formattedOldValue ? 'None' : formattedOldValue,
              cNewValue: formattedNewValue === 'None' || !formattedNewValue ? 'None' : formattedNewValue,
              userId: userId,
              description: `${fieldLabel} updated`
            });
          }
        }
      }
    }

    // Create audit log if there are changes
    if (changes.length > 0) {
      const logData = {
        category: category,
        collectionName: collectionName,  // FIXED: Use the parameter, not hardcoded
        documentId: documentId,
        userId: userId,
        ...(companyId && { oUserCompanyId: companyId }),
        cChanges: changes,
        actionType: actionType,
        reason: reason || `${collectionName} ${actionType}`,
        createdAt: new Date(),
        // Store additional info for reference
        ...(additionalInfo && { metadata: additionalInfo })
      };

      if (actionType === 'created') {
        logData.createdBy = userId;
      } else if (actionType === 'updated') {
        logData.updatedBy = userId;
      } else if (actionType === 'deleted') {
        logData.deletedBy = userId;
      }

      // console.log(`📊 Creating audit log with ${changes.length} changes`);
      const savedLog = await CRMAuditLogs.create(logData);

      // console.log(`✅ Manual audit log created: ${savedLog._id} with ${changes.length} changes`);

      return {
        success: true,
        logId: savedLog._id,
        changesCount: changes.length,
        changes: changes.map(c => ({
          field: c.cFieldChanged,
          oldValue: c.cOldValue,
          newValue: c.cNewValue
        }))
      };
    } else {
      // console.log(`ℹ️ No changes detected for manual tracking: ${collectionName}:${documentId}`);
      return { success: true, changesCount: 0 };
    }

  } catch (error) {
    console.error("❌ Error in ManualTrackPlugin:", error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
};


module.exports = {
  loggerFile: fileLogger,
  loggerMongoDB: dbLogger,
  auditLogs: updateLogs,
  updateInvoiceLogs: updateInvoiceLogs,
  ManualTrackPlugin
};
