const CRMAuditLogs = require("../models/CRM-Audit-Logs");
const diff = require('deep-diff').diff;
const mongoose = require('mongoose');
const {
    getProductFieldLabel,
    getAccountFieldLabel,
    getOpportunityFieldLabel,
    getProductDetailFieldLabel,
    getBillingRowFieldLabel,
    getContactFieldLabel,
    getTransitionFieldLabel,
} = require("../Service/fieldNameMapping");

function getValueByPath(obj, pathArray) {
    return pathArray.reduce((acc, key) => acc?.[key], obj);
}

function isEmptyValue(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') {
        if (value instanceof mongoose.Types.ObjectId) return false;
        if (value instanceof Date) return false;
        return Object.keys(value).length === 0;
    }
    return false;
}

function formatDateToMMDDYYYY(date) {
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
}

function isDateField(fieldName) {
    const dateFields = [
        'dAvailabileFrom', 'dAvailabileTill', 'dCreatedAt', 'dUpdatedAt',
        'dStatusChangeDate', 'dStageChangeDate', 'dTargetclose_Date',
        'createdAt', 'updatedAt', 'dCreateDateAt', 'dUploadedAt', 'dFileUploadedAt'
    ];
    return dateFields.includes(fieldName);
}

function getActionType(operation, changes) {
    if (operation === 'create') return 'created';
    if (operation === 'delete') return 'deleted';
    const deactivated = changes && changes.find(change =>
        change.cFieldChanged === 'bActive' && change.cNewValue === 'false'
    );
    if (deactivated) return 'deactivated';
    return 'updated';
}

function getReasonMessage(collectionName, actionType) {
    const messages = {
        'leads_productcategory_product_mappings': {
            created: 'Product created', updated: 'Product updated',
            deleted: 'Product deleted', deactivated: 'Product deactivated'
        },
        'mast_company_informations': {
            created: 'Account created', updated: 'Account updated',
            deleted: 'Account deleted', deactivated: 'Account deactivated'
        },
        'leads_company_details': {
            created: 'Account created', updated: 'Account updated',
            deleted: 'Account deleted', deactivated: 'Account deactivated'
        },
        'leads_opportunity_product_company_mappings': {
            created: 'Opportunity created', updated: 'Opportunity updated',
            deleted: 'Opportunity deleted', deactivated: 'Opportunity deactivated'
        },
        'crm_generaterealestatebilling_histories': {
            created: 'Billing Row created', updated: 'Billing Row updated',
            deleted: 'Billing Row deleted', deactivated: 'Billing Row deactivated'
        },
        'leads_customer_details': {
            created: 'Contact created', updated: 'Contact updated',
            deleted: 'Contact deleted', deactivated: 'Contact deactivated'
        },
        'transition_phase_template_value_mappings': {
            created: 'Transition created', updated: 'Transition updated',
            deleted: 'Transition deleted', deactivated: 'Transition deactivated'
        }
    };
    return messages[collectionName]?.[actionType] || `${collectionName} ${actionType}`;
}
// Array formatting functions (previously in logCollectionInterface.js and arrayFormatterLogs.js)
function formatPhoneFaxArray(array) {
    if (!Array.isArray(array)) return '';
    return array.map(item => {
        const parts = [];
        if (item.code) parts.push(`Code: ${item.code}`);
        if (item.cMobileNo) parts.push(`Number: ${item.cMobileNo}`);
        if (item.flag) parts.push(`Flag: ${item.flag}`);
        return parts.join(', ');
    }).join(' | ');
}

function formatPhoneFaxContactArray(array) {
    if (!Array.isArray(array)) return '';
    return array.map(item => {
        const parts = [];
        if (item.code && item.code.trim()) parts.push(`Code: ${item.code}`);
        if (item.cMobileNo && item.cMobileNo.trim()) parts.push(`Number: ${item.cMobileNo}`);
        if (item.flag && item.flag.trim()) parts.push(`Flag: ${item.flag}`);

        // If no valid parts, return empty
        if (parts.length === 0) return '';

        return parts.join(', ');
    }).filter(item => item !== '').join(' | ');
}

function formatProductDetailsArray(array) {
    if (!Array.isArray(array)) return '';

    return array.map((item, index) => {
        const parts = [`Line ${index + 1}`];

        // Add Client/Product
        if (item.cOpportunityLine?.trim()) {
            parts.push(`Product: ${item.cOpportunityLine.trim()}`);
        } else if (item.oProductCategory_Product_Mapping_Id) {
            // You can resolve product name here if needed
            parts.push(`Product ID: ${item.oProductCategory_Product_Mapping_Id}`);
        }

        // Add Quantity
        if (item.cQuantity !== undefined && item.cQuantity !== null) {
            parts.push(`Qty: ${item.cQuantity}`);
        }

        // Add Price
        if (item.cNegotiatedPrice?.trim()) {
            parts.push(`Price: ${item.cNegotiatedPrice.trim()}`);
        }

        // Add Description if present
        if (item.cFeaturesDesc?.trim()) {
            const desc = item.cFeaturesDesc.trim();
            const truncatedDesc = desc.length > 30 ?
                desc.substring(0, 27) + '...' :
                desc;
            parts.push(`Desc: ${truncatedDesc}`);
        }

        // Add Billing Type if present
        if (item.cBillingType?.trim()) {
            parts.push(`Billing Type: ${item.cBillingType.trim()}`);
        }

        return parts.join(', ');
    }).join('\n');  // Changed from ' -> ' to '\n' for consistent line-by-line display
}

function formatOtherDetails(obj) {
    if (!obj || typeof obj !== 'object') return '';
    const parts = [];
    if (obj.public !== undefined) parts.push(`public: ${obj.public ? 'yes' : 'no'}`);
    if (obj.blackstoneEntity !== undefined) parts.push(`blackstoneEntity: ${obj.blackstoneEntity ? 'yes' : 'no'}`);
    if (obj.erp && Array.isArray(obj.erp)) parts.push(`erp: (${obj.erp.join(', ')})`);
    if (obj.software && Array.isArray(obj.software)) parts.push(`software: (${obj.software.join(', ')})`);
    if (obj.payables && Array.isArray(obj.payables)) parts.push(`payables: (${obj.payables.join(', ')})`);
    return parts.join(', ');
}

function formatInvoiceApprovalsArray(array) {
    if (!Array.isArray(array)) return '';
    return array.map((item, index) => {
        const parts = [`Approval ${index + 1}`];
        if (item.classId) parts.push(`Class: ${item.classId}`);
        if (item.subClassId) parts.push(`SubClass: ${item.subClassId}`);
        return parts.join(', ');
    }).join(' | ');
}

function formatBillingInfo(obj) {
    if (!obj || typeof obj !== 'object') return '';
    const parts = [];
    if (obj.IsConsolidateParent !== undefined) parts.push(`Consolidate Parent: ${obj.IsConsolidateParent ? 'Yes' : 'No'}`);
    if (obj.IsSeparateBySubclass !== undefined) parts.push(`Separate by Subclass: ${obj.IsSeparateBySubclass ? 'Yes' : 'No'}`);
    if (obj.IsOneInvoicePerEmail !== undefined) parts.push(`One Invoice Per Email: ${obj.IsOneInvoicePerEmail ? 'Yes' : 'No'}`);
    if (obj.IsAutoCCManager !== undefined) parts.push(`Auto CC Manager: ${obj.IsAutoCCManager ? 'Yes' : 'No'}`);
    if (obj.IsSeparateBySOW !== undefined) parts.push(`Separate by SOW: ${obj.IsSeparateBySOW ? 'Yes' : 'No'}`);
    return parts.join(', ');
}

function formatTeamDetailsArray(array, oldArray = null) {
    if (!Array.isArray(array)) return '';

    return array.map((item, index) => {
        const parts = [`Line ${index + 1}`];

        if (item.oRole_Id) parts.push(`Role: ${item.oRole_Id}`);
        if (item.oUser_Id) parts.push(`User: ${item.oUser_Id}`);
        if (item.cEmail) parts.push(`Email: ${item.cEmail}`);

        return parts.join(', ');
    }).join('\n');
}

function formatLinksArray(array, oldArray = null) {
    if (!Array.isArray(array)) return '';

    return array.map((item, index) => {
        const parts = [`Line ${index + 1}`];

        if (item.cLink) {
            const link = item.cLink.length > 30 ?
                item.cLink.substring(0, 27) + '...' :
                item.cLink;
            parts.push(`URL: ${link}`);
        }

        if (item.cLinkDescription) {
            const desc = item.cLinkDescription.length > 30 ?
                item.cLinkDescription.substring(0, 27) + '...' :
                item.cLinkDescription;
            parts.push(`Desc: ${desc}`);
        }

        return parts.join(', ');
    }).join('\n');
}

function formatFilesArray(array, oldArray = null) {
    if (!Array.isArray(array)) return '';

    return array.map((item, index) => {
        const parts = [`Line ${index + 1}`];

        if (item.cFileName) {
            const name = item.cFileName.length > 30 ?
                item.cFileName.substring(0, 27) + '...' :
                item.cFileName;
            parts.push(`Name: ${name}`);
        }

        if (item.cFileDescription) {
            const desc = item.cFileDescription.length > 30 ?
                item.cFileDescription.substring(0, 27) + '...' :
                item.cFileDescription;
            parts.push(`Desc: ${desc}`);
        }

        return parts.join(', ');
    }).join('\n');
}

function getChangedArrayItems(oldArray, newArray, fieldName) {
    if (!oldArray && !newArray) return [];
    if (!oldArray && newArray && newArray.length > 0) {
        // All items are new
        return newArray.map((item, index) => ({
            index: index + 1,
            oldValue: null,
            newValue: item,
            action: 'added'
        }));
    }
    if (oldArray && oldArray.length > 0 && (!newArray || newArray.length === 0)) {
        // All items are removed
        return oldArray.map((item, index) => ({
            index: index + 1,
            oldValue: item,
            newValue: null,
            action: 'removed'
        }));
    }
    if (!newArray && oldArray && oldArray.length > 0) {
        return oldArray.map((item, index) => ({
            index: index + 1,
            oldValue: item,
            newValue: null,
            action: 'removed'
        }));
    }

    // Check if arrays are identical
    if (JSON.stringify(oldArray) === JSON.stringify(newArray)) {
        return [];
    }

    const changedItems = [];

    // For Links, check if there are actual changes
    if (fieldName === 'Links') {
        // Create maps of Links for comparison
        const oldLinksMap = new Map();
        const newLinksMap = new Map();

        oldArray?.forEach((item, index) => {
            const key = `link_${item.cLink || ''}_desc_${item.cLinkDescription || ''}`;
            oldLinksMap.set(key, { ...item, originalIndex: index + 1 });
        });

        newArray?.forEach((item, index) => {
            const key = `link_${item.cLink || ''}_desc_${item.cLinkDescription || ''}`;
            newLinksMap.set(key, { ...item, originalIndex: index + 1 });
        });

        // Find removed links
        for (const [key, oldItem] of oldLinksMap) {
            if (!newLinksMap.has(key)) {
                changedItems.push({
                    index: oldItem.originalIndex,
                    oldValue: oldItem,
                    newValue: null,
                    action: 'removed'
                });
            }
        }

        // Find added links
        for (const [key, newItem] of newLinksMap) {
            if (!oldLinksMap.has(key)) {
                changedItems.push({
                    index: newItem.originalIndex,
                    oldValue: null,
                    newValue: newItem,
                    action: 'added'
                });
            }
        }

        // Find modified links
        for (const [key, oldItem] of oldLinksMap) {
            if (newLinksMap.has(key)) {
                const newItem = newLinksMap.get(key);
                if (JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
                    changedItems.push({
                        index: oldItem.originalIndex,
                        oldValue: oldItem,
                        newValue: newItem,
                        action: 'modified'
                    });
                }
            }
        }
    }
    // For TeamDetails, use the same logic
    else if (fieldName === 'TeamDetails') {
        const oldMap = new Map();
        const newMap = new Map();

        oldArray?.forEach((item, index) => {
            const key = `role_${item.oRole_Id || ''}_user_${item.oUser_Id || ''}_email_${item.cEmail || ''}`;
            oldMap.set(key, { ...item, originalIndex: index + 1 });
        });

        newArray?.forEach((item, index) => {
            const key = `role_${item.oRole_Id || ''}_user_${item.oUser_Id || ''}_email_${item.cEmail || ''}`;
            newMap.set(key, { ...item, originalIndex: index + 1 });
        });

        // Find removed team members
        for (const [key, oldItem] of oldMap) {
            if (!newMap.has(key)) {
                changedItems.push({
                    index: oldItem.originalIndex,
                    oldValue: oldItem,
                    newValue: null,
                    action: 'removed'
                });
            }
        }

        // Find added team members
        for (const [key, newItem] of newMap) {
            if (!oldMap.has(key)) {
                changedItems.push({
                    index: newItem.originalIndex,
                    oldValue: null,
                    newValue: newItem,
                    action: 'added'
                });
            }
        }

        // Find modified team members
        for (const [key, oldItem] of oldMap) {
            if (newMap.has(key)) {
                const newItem = newMap.get(key);
                if (JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
                    changedItems.push({
                        index: oldItem.originalIndex,
                        oldValue: oldItem,
                        newValue: newItem,
                        action: 'modified'
                    });
                }
            }
        }
    }
    // For Files
    else if (fieldName === 'Files') {
        const oldMap = new Map();
        const newMap = new Map();

        oldArray?.forEach((item, index) => {
            const key = `file_${item.cFileName || ''}_desc_${item.cFileDescription || ''}`;
            oldMap.set(key, { ...item, originalIndex: index + 1 });
        });

        newArray?.forEach((item, index) => {
            const key = `file_${item.cFileName || ''}_desc_${item.cFileDescription || ''}`;
            newMap.set(key, { ...item, originalIndex: index + 1 });
        });

        // Find removed files
        for (const [key, oldItem] of oldMap) {
            if (!newMap.has(key)) {
                changedItems.push({
                    index: oldItem.originalIndex,
                    oldValue: oldItem,
                    newValue: null,
                    action: 'removed'
                });
            }
        }

        // Find added files
        for (const [key, newItem] of newMap) {
            if (!oldMap.has(key)) {
                changedItems.push({
                    index: newItem.originalIndex,
                    oldValue: null,
                    newValue: newItem,
                    action: 'added'
                });
            }
        }

        // Find modified files
        for (const [key, oldItem] of oldMap) {
            if (newMap.has(key)) {
                const newItem = newMap.get(key);
                if (JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
                    changedItems.push({
                        index: oldItem.originalIndex,
                        oldValue: oldItem,
                        newValue: newItem,
                        action: 'modified'
                    });
                }
            }
        }
    }

    return changedItems;
}


function formatChangedArrayItems(changedItems, formatter, fieldName) {
    if (!changedItems || changedItems.length === 0) return { old: '', new: '' };

    const oldParts = [];
    const newParts = [];

    changedItems.forEach(change => {
        if (change.action === 'removed') {
            const formatted = formatter([change.oldValue]);
            // Clean up the formatted string
            const cleaned = formatted.replace(/Line \d+: Line \d+,/, `Line ${change.index}:`);
            oldParts.push(cleaned);
        }
        else if (change.action === 'added') {
            const formatted = formatter([change.newValue]);
            // Clean up the formatted string
            const cleaned = formatted.replace(/Line \d+: Line \d+,/, `Line ${change.index}:`);
            newParts.push(cleaned);
        }
        else if (change.action === 'modified') {
            const oldFormatted = formatter([change.oldValue]);
            const newFormatted = formatter([change.newValue]);
            // Clean up the formatted strings
            const oldCleaned = oldFormatted.replace(/Line \d+: Line \d+,/, `Line ${change.index}:`);
            const newCleaned = newFormatted.replace(/Line \d+: Line \d+,/, `Line ${change.index}:`);
            oldParts.push(oldCleaned);
            newParts.push(newCleaned);
        }
    });

    return {
        old: oldParts.join('\n'),
        new: newParts.join('\n')
    };
}

// Add this helper function
function arraysAreDifferent(oldArray, newArray, fieldName) {
    if (!oldArray && !newArray) return false;
    if ((!oldArray || oldArray.length === 0) && (!newArray || newArray.length === 0)) return false;
    if ((!oldArray || oldArray.length === 0) !== (!newArray || newArray.length === 0)) return true;

    // If lengths are different, arrays are definitely different
    if (oldArray.length !== newArray.length) return true;

    // For arrays with objects, we need to compare content, not just object references
    if (fieldName === 'TeamDetails') {
        const normalizedOld = oldArray.map(item => ({
            oRole_Id: item.oRole_Id?.toString() || '',
            oUser_Id: item.oUser_Id?.toString() || '',
            cEmail: item.cEmail || ''
        }));

        const normalizedNew = newArray.map(item => ({
            oRole_Id: item.oRole_Id?.toString() || '',
            oUser_Id: item.oUser_Id?.toString() || '',
            cEmail: item.cEmail || ''
        }));

        // Sort both arrays for comparison
        normalizedOld.sort((a, b) =>
            (a.oRole_Id + a.oUser_Id + a.cEmail).localeCompare(b.oRole_Id + b.oUser_Id + b.cEmail)
        );
        normalizedNew.sort((a, b) =>
            (a.oRole_Id + a.oUser_Id + a.cEmail).localeCompare(b.oRole_Id + b.oUser_Id + b.cEmail)
        );

        return JSON.stringify(normalizedOld) !== JSON.stringify(normalizedNew);
    }
    else if (fieldName === 'Links') {
        const normalizedOld = oldArray.map(item => ({
            cLink: item.cLink || '',
            cLinkDescription: item.cLinkDescription || ''
        }));

        const normalizedNew = newArray.map(item => ({
            cLink: item.cLink || '',
            cLinkDescription: item.cLinkDescription || ''
        }));

        normalizedOld.sort((a, b) => a.cLink.localeCompare(b.cLink));
        normalizedNew.sort((a, b) => a.cLink.localeCompare(b.cLink));

        return JSON.stringify(normalizedOld) !== JSON.stringify(normalizedNew);
    }
    else if (fieldName === 'Files') {
        const normalizedOld = oldArray.map(item => ({
            cFileName: item.cFileName || '',
            cFileDescription: item.cFileDescription || ''
        }));

        const normalizedNew = newArray.map(item => ({
            cFileName: item.cFileName || '',
            cFileDescription: item.cFileDescription || ''
        }));

        normalizedOld.sort((a, b) => a.cFileName.localeCompare(b.cFileName));
        normalizedNew.sort((a, b) => a.cFileName.localeCompare(b.cFileName));

        return JSON.stringify(normalizedOld) !== JSON.stringify(normalizedNew);
    }

    // For other arrays, use default comparison
    return JSON.stringify(oldArray) !== JSON.stringify(newArray);
}

// Update the formatStatusLogsArray function to resolve status names
function formatStatusLogsArray(array) {
    if (!Array.isArray(array)) return '';

    return array.map((item, index) => {
        const parts = [`Log ${index + 1}`];

        // Store the status ID - will be resolved later in logInterface
        if (item.oOpportunitySubStatus || item.oOpportunityStage || item.oClientSubStatus) {
            const statusId = item.oOpportunitySubStatus || item.oOpportunityStage || item.oClientSubStatus;
            const statusType = item.oOpportunitySubStatus ? 'Sub-Status' :
                item.oOpportunityStage ? 'Stage' :
                    item.oClientSubStatus ? 'Client Status' : 'Status';

            parts.push(`${statusType}: ${statusId}`);
        }

        if (item.cStatusNotes) {
            // Truncate long notes
            const notes = item.cStatusNotes.length > 50 ?
                item.cStatusNotes.substring(0, 50) + '...' :
                item.cStatusNotes;
            parts.push(`Notes: ${notes}`);
        }

        return parts.join(', ');
    }).join(' -> ');
}

async function getFieldLabel(collectionName, fieldKey) {
    switch (collectionName) {
        case 'leads_productcategory_product_mappings':
            return await getProductFieldLabel(fieldKey);
        case 'mast_company_informations':
        case 'leads_company_details':
            return await getAccountFieldLabel(fieldKey);
        case 'leads_opportunity_product_company_mappings':
            return await getOpportunityFieldLabel(fieldKey);
        case 'crm_generaterealestatebilling_histories':
            return await getBillingRowFieldLabel(fieldKey);
        case 'crm_draft_invoices':  // Add this
            return await getDraftInvoiceFieldLabel(fieldKey);
        case 'leads_customer_details':  // ADD THIS
            return await getContactFieldLabel(fieldKey);
        case 'transition_phase_template_value_mappings':  // ADD THIS
            return await getTransitionFieldLabel(fieldKey);
        default:
            return fieldKey;
    }
}

function formatBillingLineItemsArray(array) {
    if (!Array.isArray(array)) return '';

    return array
        .map((item, index) => {
            const parts = [];

            if (item.cClientName?.trim())
                parts.push(`Client: ${item.cClientName}`);

            if (item.cProcessDescription?.trim()) {
                const desc =
                    item.cProcessDescription.length > 30
                        ? `${item.cProcessDescription.slice(0, 27)}...`
                        : item.cProcessDescription;
                parts.push(`Desc: ${desc}`);
            }

            if (item.iQty !== undefined && item.iQty !== null)
                parts.push(`Qty: ${item.iQty}`);

            if (item.cValue?.trim())
                parts.push(`Value: ${item.cValue}`);

            if (item.cSubTotal?.trim())
                parts.push(`Total: ${item.cSubTotal}`);

            if (item.cBillingType?.trim())
                parts.push(`Billing Type: ${item.cBillingType}`);

            if (item.cProductCode?.trim())
                parts.push(`Product Code: ${item.cProductCode}`);

            return `Line ${index + 1}: ${parts.join(', ')}`;
        })
        .join('\n');
}

function checkPhoneFaxRealChanges(oldArray, newArray) {
    // If both are empty, no change
    if (
        (!oldArray || oldArray.length === 0) &&
        (!newArray || newArray.length === 0)
    ) {
        return false;
    }

    // If one is empty and other is not, there's a change
    if (
        (!oldArray || oldArray.length === 0) !==
        (!newArray || newArray.length === 0)
    ) {
        return true;
    }

    // If lengths differ, there's a change
    if (oldArray.length !== newArray.length) {
        return true;
    }

    // Compare actual values (not just IDs)
    const normalizedOld = oldArray.map((item) => ({
        code: item.code || "",
        cMobileNo: item.cMobileNo || "",
        flag: item.flag || "",
    }));

    const normalizedNew = newArray.map((item) => ({
        code: item.code || "",
        cMobileNo: item.cMobileNo || "",
        flag: item.flag || "",
    }));

    // Sort arrays for comparison
    normalizedOld.sort((a, b) =>
        JSON.stringify(a).localeCompare(JSON.stringify(b))
    );
    normalizedNew.sort((a, b) =>
        JSON.stringify(a).localeCompare(JSON.stringify(b))
    );

    return JSON.stringify(normalizedOld) !== JSON.stringify(normalizedNew);
}



async function trackChangesPlugin(schema, options = {}) {
    const fieldsToTrack = options.fieldsToTrack || [];
    const moduleName = options.module || schema.collection?.name;

    const getCleanData = (doc) => {
        if (!doc) return {};
        return JSON.parse(JSON.stringify(doc));
    };

    async function logChanges(original, updated, documentId, modelName, userContext, operation = 'update') {
        const oldDoc = getCleanData(original);
        const newDoc = getCleanData(updated);

        const userId = userContext?.userId ||
            newDoc?.updatedBy || newDoc?.oUpdatedBy || newDoc?.cUpdatedBy ||
            newDoc?.oCreatedBy || newDoc?.createdBy;

        const companyId = newDoc?.oUserCompanyId || newDoc?.oUsercompanyId || newDoc?.oUserCompany_Id;

        let changeLogs = [];

        // Track which fields have been handled by array processing
        const handledFields = new Set();

        // Handle billing row specific arrays
        if (modelName === 'crm_generaterealestatebilling_histories') {
            const specialArrays = {
                'lineItems': formatBillingLineItemsArray
            };

            for (const [field, formatter] of Object.entries(specialArrays)) {
                if (fieldsToTrack.includes(field) &&
                    (Array.isArray(oldDoc[field]) || Array.isArray(newDoc[field]))) {

                    const oldVal = oldDoc[field] || [];
                    const newVal = newDoc[field] || [];

                    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                        const fieldLabel = await getFieldLabel(modelName, field);
                        changeLogs.push({
                            cFieldChanged: fieldLabel,
                            cOldValue: formatter(oldVal) || 'None',
                            cNewValue: formatter(newVal) || 'None',
                            userId: userId,
                            description: `${fieldLabel} updated`
                        });
                        handledFields.add(field);
                    }
                }
            }
        }

        // Update this section in the logChanges function:
        if (modelName === 'leads_opportunity_product_company_mappings') {
            const specialArrays = {
                'ProductDetails': formatProductDetailsArray,
                'TeamDetails': formatTeamDetailsArray,
                'statusChangeLogs': async (array) => await formatStatusLogsArray(array, modelName),
                'stageChangeLogs': async (array) => await formatStatusLogsArray(array, modelName),
                'Links': formatLinksArray,
                'Files': formatFilesArray
            };

            for (const [field, formatter] of Object.entries(specialArrays)) {
                if (fieldsToTrack.includes(field) &&
                    (Array.isArray(oldDoc[field]) || Array.isArray(newDoc[field]))) {

                    const oldVal = oldDoc[field] || [];
                    const newVal = newDoc[field] || [];

                    // Check if arrays are actually different (not just object IDs)
                    const arraysDifferent = arraysAreDifferent(oldVal, newVal, field);

                    if (arraysDifferent) {
                        const fieldLabel = await getFieldLabel(modelName, field);

                        // Get changed items with field-specific comparison
                        const changedItems = getChangedArrayItems(oldVal, newVal, field);

                        if (changedItems.length > 0) {
                            // Format only changed items
                            const formatted = formatChangedArrayItems(changedItems, formatter, field);

                            // Only log if there are actual formatted changes
                            if (formatted.old !== '' || formatted.new !== '') {
                                // Handle async formatters
                                let formattedOldValue, formattedNewValue;
                                if (formatter.constructor.name === 'AsyncFunction') {
                                    formattedOldValue = await formatted.old;
                                    formattedNewValue = await formatted.new;
                                } else {
                                    formattedOldValue = formatted.old || 'None';
                                    formattedNewValue = formatted.new || 'None';
                                }

                                // Don't log if both values are "None"
                                if (formattedOldValue !== 'None' || formattedNewValue !== 'None') {
                                    changeLogs.push({
                                        cFieldChanged: fieldLabel,
                                        cOldValue: formattedOldValue,
                                        cNewValue: formattedNewValue,
                                        userId: userId,
                                        description: `${fieldLabel} updated (${changedItems.length} item(s) changed)`
                                    });
                                    handledFields.add(field);
                                }
                            }
                        }
                    }
                }
            }
        }

        // Handle Account-specific arrays
        if (modelName === 'mast_company_informations' || modelName === 'leads_company_details') {
            const accountArrays = {
                'phoneCode': formatPhoneFaxArray,
                'faxCode': formatPhoneFaxArray,
                'cOtherDetails': formatOtherDetails,
                'Invoice_Approvals': formatInvoiceApprovalsArray,
                'Billing_Informations': formatBillingInfo,
                'statusChangeLogs': formatStatusLogsArray
            };

            for (const [field, formatter] of Object.entries(accountArrays)) {
                if (fieldsToTrack.includes(field)) {
                    const oldVal = oldDoc[field];
                    const newVal = newDoc[field];

                    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                        const fieldLabel = await getFieldLabel(modelName, field);
                        changeLogs.push({
                            cFieldChanged: fieldLabel,
                            cOldValue: formatter(oldVal) || 'None',
                            cNewValue: formatter(newVal) || 'None',
                            userId: userId,
                            description: `${fieldLabel} updated`
                        });
                        handledFields.add(field);
                    }
                }
            }
        }

        // Handle Contact-specific arrays
        if (modelName === "leads_customer_details") {
            const contactArrays = {
                cWorkPhoneNumber: formatPhoneFaxContactArray,
                cCellPhoneNumber: formatPhoneFaxContactArray,
                cFax: formatPhoneFaxContactArray,
            };

            for (const [field, formatter] of Object.entries(contactArrays)) {
                if (
                    fieldsToTrack.includes(field) &&
                    (Array.isArray(oldDoc[field]) || Array.isArray(newDoc[field]))
                ) {
                    const oldVal = oldDoc[field] || [];
                    const newVal = newDoc[field] || [];

                    // Check if there are actual changes (not just IDs)
                    const hasRealChanges = checkPhoneFaxRealChanges(oldVal, newVal);

                    if (hasRealChanges) {
                        const fieldLabel = await getFieldLabel(modelName, field);
                        changeLogs.push({
                            cFieldChanged: fieldLabel,
                            cOldValue: formatter(oldVal) || "None",
                            cNewValue: formatter(newVal) || "None",
                            userId: userId,
                            description: `${fieldLabel} updated`,
                        });
                        handledFields.add(field);
                    }
                }
            }
        }

        if (modelName === 'transition_phase_template_value_mappings') {
            // Handle transitionDetails changes
            if (JSON.stringify(oldDoc.transitionDetails) !== JSON.stringify(newDoc.transitionDetails)) {
                const oldTransitionDetails = oldDoc.transitionDetails || [];
                const newTransitionDetails = newDoc.transitionDetails || [];

                // Compare each transition detail
                for (let i = 0; i < Math.max(oldTransitionDetails.length, newTransitionDetails.length); i++) {
                    const oldDetail = oldTransitionDetails[i] || {};
                    const newDetail = newTransitionDetails[i] || {};

                    // Check for checklist (componentValues) changes
                    if (JSON.stringify(oldDetail.componentValues) !== JSON.stringify(newDetail.componentValues)) {
                        const fieldLabel = `Checklist Values for Template ${oldDetail.oTemplateId || newDetail.oTemplateId || 'Unknown'}`;
                        const oldValues = oldDetail.componentValues || {};
                        const newValues = newDetail.componentValues || {};

                        changeLogs.push({
                            cFieldChanged: fieldLabel,
                            cOldValue: formatTransitionValues(oldValues),
                            cNewValue: formatTransitionValues(newValues),
                            userId: userId,
                            description: `Checklist values updated`
                        });
                    }

                    // Check for KPI changes
                    if (JSON.stringify(oldDetail.KpiValues) !== JSON.stringify(newDetail.KpiValues)) {
                        const fieldLabel = `KPI Values for Template ${oldDetail.oTemplateId || newDetail.oTemplateId || 'Unknown'}`;
                        changeLogs.push({
                            cFieldChanged: fieldLabel,
                            cOldValue: formatTransitionValues(oldDetail.KpiValues),
                            cNewValue: formatTransitionValues(newDetail.KpiValues),
                            userId: userId,
                            description: `KPI values updated`
                        });
                    }

                    // Check for tollgate changes
                    if (JSON.stringify(oldDetail.tollgateValues) !== JSON.stringify(newDetail.tollgateValues)) {
                        const fieldLabel = `Tollgate Values for Template ${oldDetail.oTemplateId || newDetail.oTemplateId || 'Unknown'}`;
                        changeLogs.push({
                            cFieldChanged: fieldLabel,
                            cOldValue: formatTransitionValues(oldDetail.tollgateValues),
                            cNewValue: formatTransitionValues(newDetail.tollgateValues),
                            userId: userId,
                            description: `Tollgate values updated`
                        });
                    }
                }
            }

            // Handle phasesTableValues changes
            if (JSON.stringify(oldDoc.phasesTableValues) !== JSON.stringify(newDoc.phasesTableValues)) {
                const fieldLabel = 'Phase Table Values';
                const formatPhasesTable = (values) => {
                    if (!values || Object.keys(values).length === 0) return 'None';
                    const parts = [];
                    if (values.transitionPeriod) {
                        if (values.transitionPeriod.startDate) parts.push(`Start Date: ${values.transitionPeriod.startDate}`);
                        if (values.transitionPeriod.endDate) parts.push(`End Date: ${values.transitionPeriod.endDate}`);
                    }
                    if (values.plannedGoLiveDate) parts.push(`Planned Go-Live: ${formatDateToMMDDYYYY(values.plannedGoLiveDate)}`);
                    if (values.overallComplianceTollGate !== undefined) {
                        parts.push(`Compliance: ${values.overallComplianceTollGate ? 'Yes' : 'No'}`);
                    }
                    if (values.goLiveReadiness) parts.push(`Readiness: ${values.goLiveReadiness}`);
                    return parts.join('\n');
                };

                changeLogs.push({
                    cFieldChanged: fieldLabel,
                    cOldValue: formatPhasesTable(oldDoc.phasesTableValues),
                    cNewValue: formatPhasesTable(newDoc.phasesTableValues),
                    userId: userId,
                    description: 'Phase table values updated'
                });
            }

            // Handle summary changes
            if (JSON.stringify(oldDoc.summary) !== JSON.stringify(newDoc.summary)) {
                const formatSummary = (summary) => {
                    if (!Array.isArray(summary) || summary.length === 0) return 'None';
                    return summary.map(item =>
                        `Phase: ${item.cPhaseId}, Checklist: ${item.checklist_score || 0}, KPI: ${item.kpi_score || 0}, Tollgate: ${item.tollgate_score || 0}`
                    ).join('\n');
                };

                changeLogs.push({
                    cFieldChanged: 'Summary Scores',
                    cOldValue: formatSummary(oldDoc.summary),
                    cNewValue: formatSummary(newDoc.summary),
                    userId: userId,
                    description: 'Summary scores updated'
                });
            }
        }

        const handledArrays = [
            'ProductDetails', 'TeamDetails', 'statusChangeLogs',
            'stageChangeLogs', 'Links', 'Files', 'phoneCode',
            'faxCode', 'Invoice_Approvals', 'Billing_Informations',
            'lineItems', 'cWorkPhoneNumber', 'cCellPhoneNumber', 'cFax'  // Add contact phone fields here
        ];

        // Handle regular field changes
        // In trackChangesPlugin.js, in the logChanges function, update the create section:
        if (operation === 'create') {
            const fieldsToSkipOnCreate = ['Billing_Informations', 'lineItems'];

            for (const field of fieldsToTrack) {
                // Skip fields on create
                if (fieldsToSkipOnCreate.includes(field) || handledFields.has(field)) {
                    continue;
                }

                const fieldValue = newDoc[field];
                if (fieldValue !== undefined && fieldValue !== null && !isEmptyValue(fieldValue)) {
                    let formattedValue = fieldValue;

                    if (isDateField(field)) {
                        formattedValue = formatDateToMMDDYYYY(formattedValue);
                    } else if (Array.isArray(formattedValue)) {
                        // Handle phone/fax arrays specially during create
                        if (field === 'cWorkPhoneNumber' || field === 'cCellPhoneNumber' || field === 'cFax') {
                            formattedValue = formatPhoneFaxContactArray(formattedValue);
                        }
                        // Handle company array
                        else if (field === 'oCompany_Id') {
                            // For company array, just store the array - will be resolved later
                            formattedValue = JSON.stringify(formattedValue);
                        }
                        // Skip other arrays already handled
                        else if (handledArrays.includes(field)) {
                            continue;
                        } else {
                            formattedValue = JSON.stringify(formattedValue);
                        }
                    } else if (formattedValue instanceof mongoose.Types.ObjectId) {
                        formattedValue = formattedValue.toString();
                    } else if (typeof formattedValue === 'object' && !(formattedValue instanceof Date)) {
                        formattedValue = JSON.stringify(formattedValue);
                    }

                    const fieldLabel = await getFieldLabel(modelName, field);
                    changeLogs.push({
                        cFieldChanged: fieldLabel,
                        cOldValue: '',
                        cNewValue: String(formattedValue),
                        userId: userId,
                        description: 'Initial value'
                    });
                }
            }
        } else if (operation === 'update') {
            const differences = diff(oldDoc, newDoc);
            if (differences && differences.length > 0) {
                const filteredDifferences = differences.filter(change => {
                    const fieldPath = change.path?.[0];
                    // Skip fields already handled by array processing
                    return !handledFields.has(fieldPath) &&
                        !handledArrays.includes(fieldPath) &&
                        fieldsToTrack.includes(fieldPath);
                });

                for (const change of filteredDifferences) {
                    const fieldName = change.path?.[0] || '';
                    const fullPath = change.path?.join('.') || '';

                    let rawOldValue, rawNewValue, description = '';

                    if (change.kind === 'A') {
                        const arrayPath = [...change.path, change.index];
                        const itemChange = change.item;
                        switch (itemChange.kind) {
                            case 'N':
                                rawOldValue = ''; rawNewValue = getValueByPath(newDoc, arrayPath);
                                description = 'Added to array'; break;
                            case 'D':
                                rawOldValue = getValueByPath(oldDoc, arrayPath); rawNewValue = '';
                                description = 'Removed from array'; break;
                            case 'E':
                                rawOldValue = itemChange.lhs; rawNewValue = itemChange.rhs;
                                description = 'Modified array item'; break;
                        }
                    } else {
                        rawOldValue = change.kind === 'E' ? getValueByPath(oldDoc, change.path) : change.lhs;
                        rawNewValue = change.kind === 'E' ? getValueByPath(newDoc, change.path) : change.rhs;
                        description = change.kind === 'E' ? 'Modified' :
                            change.kind === 'N' ? 'Added' :
                                change.kind === 'D' ? 'Removed' : '';
                    }

                    if (rawOldValue === rawNewValue ||
                        (isEmptyValue(rawOldValue) && isEmptyValue(rawNewValue))) {
                        continue;
                    }

                    // Skip if it's a phone/fax ID change (these are handled by array processing)
                    if ((fieldName === 'cWorkPhoneNumber' || fieldName === 'cCellPhoneNumber' || fieldName === 'cFax') &&
                        (Array.isArray(rawOldValue) || Array.isArray(rawNewValue))) {
                        continue;
                    }

                    if (isDateField(fieldName)) {
                        if (rawOldValue) rawOldValue = formatDateToMMDDYYYY(rawOldValue);
                        if (rawNewValue) rawNewValue = formatDateToMMDDYYYY(rawNewValue);
                    }

                    if (rawOldValue instanceof mongoose.Types.ObjectId) rawOldValue = rawOldValue.toString();
                    if (rawNewValue instanceof mongoose.Types.ObjectId) rawNewValue = rawNewValue.toString();

                    if (typeof rawOldValue === 'object' && rawOldValue !== null && !(rawOldValue instanceof Date)) {
                        rawOldValue = JSON.stringify(rawOldValue);
                    }
                    if (typeof rawNewValue === 'object' && rawNewValue !== null && !(rawNewValue instanceof Date)) {
                        rawNewValue = JSON.stringify(rawNewValue);
                    }

                    if (isEmptyValue(rawOldValue) && isEmptyValue(rawNewValue)) continue;

                    const fieldLabel = await getFieldLabel(modelName, fieldName);
                    changeLogs.push({
                        cFieldChanged: fieldLabel,
                        cOldValue: rawOldValue !== undefined && rawOldValue !== null ? String(rawOldValue) : '',
                        cNewValue: rawNewValue !== undefined && rawNewValue !== null ? String(rawNewValue) : '',
                        userId: userId,
                        description: description || `${fieldLabel} updated`
                    });
                }
            }
        } else if (operation === 'delete') {
            // Skip delete logging - just return without creating audit log
            console.log(`ℹ️ Delete audit logging is disabled for ${modelName}`);
            return;
        }

        if (changeLogs.length === 0) return;

        try {
            const actionType = getActionType(operation, changeLogs);
            const reason = getReasonMessage(modelName, actionType);

            const logData = {
                category: "CRM",
                collectionName: modelName,
                documentId: documentId,
                userId: userId,
                ...(companyId && { oUserCompanyId: companyId }),
                cChanges: changeLogs,
                actionType: actionType,
                reason: reason,
                createdAt: new Date()
            };

            if (operation === 'create') logData.createdBy = userId;
            else if (operation === 'update') logData.updatedBy = userId;
            else if (operation === 'delete') logData.deletedBy = userId;

            await CRMAuditLogs.create(logData);
            console.log(`✅ Audit log created for ${modelName} ${actionType}: ${documentId}`);
        } catch (error) {
            console.error("❌ Error creating audit log:", error);
        }
    }
    // Pre-save hook for new documents
    schema?.pre('save', async function (next) {
        if (this.isNew) {
            const modelName = this.constructor.modelName;
            const documentId = this._id;
            const userId = this.oCreatedBy || this.createdBy;
            const companyId = this.oUserCompanyId || this.oUsercompanyId;

            try {
                await logChanges(null, this, documentId, modelName, { userId, companyId }, 'create');
            } catch (error) {
                console.error("❌ Error in pre-save hook:", error);
            }
        }
        next();
    });

    async function preUpdateHook(next) {
        const modelName = this.model.modelName;
        const filter = this.getQuery();
        const update = this.getUpdate();

        try {
            const original = await this.model.findOne(filter).lean();
            if (!original) return next();

            const userId = extractUserIdFromUpdate(update, original);
            const companyId = extractCompanyIdFromUpdate(update, original);

            let updateData = {};
            if (update.$set) {
                updateData = { ...update.$set };
            } else {
                updateData = { ...update };
            }

            // Remove auto-update fields
            delete updateData.updatedAt;
            delete updateData.updatedBy;
            delete updateData.oUpdatedBy;
            delete updateData.cUpdatedBy;

            const simulatedUpdated = { ...original, ...updateData };
            await logChanges(original, simulatedUpdated, original._id, modelName, { userId, companyId }, 'update');
            next();
        } catch (error) {
            console.error("❌ Error in pre-update hook:", error);
            next();
        }
    }

    function extractUserIdFromUpdate(update, original) {
        if (update.$set) {
            if (update.$set.updatedBy) return update.$set.updatedBy;
            if (update.$set.oUpdatedBy) return update.$set.oUpdatedBy;
            if (update.$set.cUpdatedBy) return update.$set.cUpdatedBy;
        }
        if (update.updatedBy) return update.updatedBy;
        if (update.oUpdatedBy) return update.oUpdatedBy;
        if (update.cUpdatedBy) return update.cUpdatedBy;
        if (original.updatedBy) return original.updatedBy;
        if (original.oUpdatedBy) return original.oUpdatedBy;
        if (original.cUpdatedBy) return original.cUpdatedBy;
        if (original.oCreatedBy) return original.oCreatedBy;
        if (original.createdBy) return original.createdBy;
        return null;
    }

    function extractCompanyIdFromUpdate(update, original) {
        if (update.$set) {
            if (update.$set.oUserCompanyId) return update.$set.oUserCompanyId;
            if (update.$set.oUsercompanyId) return update.$set.oUsercompanyId;
            if (update.$set.oUserCompany_Id) return update.$set.oUserCompany_Id;
        }
        if (update.oUserCompanyId) return update.oUserCompanyId;
        if (update.oUsercompanyId) return update.oUsercompanyId;
        if (update.oUserCompany_Id) return update.oUserCompany_Id;
        if (original.oUserCompanyId) return original.oUserCompanyId;
        if (original.oUsercompanyId) return original.oUsercompanyId;
        if (original.oUserCompany_Id) return original.oUserCompany_Id;
        return null;
    }

    schema.pre('findOneAndUpdate', preUpdateHook);
    schema.pre('updateOne', preUpdateHook);
    schema.pre('updateMany', preUpdateHook);
    schema.pre('findByIdAndUpdate', preUpdateHook);

    // Delete hooks - Completely disabled to avoid API interference
    // These hooks will simply call next() without doing anything
    schema.pre('findOneAndDelete', function (next) {
        console.log('ℹ️ Delete hook skipped for findOneAndDelete');
        next();
    });

    schema.pre('findOneAndRemove', function (next) {
        console.log('ℹ️ Delete hook skipped for findOneAndRemove');
        next();
    });

    schema.pre('deleteOne', function (next) {
        console.log('ℹ️ Delete hook skipped for deleteOne');
        next();
    });

    schema.pre('deleteMany', function (next) {
        console.log('ℹ️ Delete hook skipped for deleteMany');
        next();
    });
}

module.exports = trackChangesPlugin;