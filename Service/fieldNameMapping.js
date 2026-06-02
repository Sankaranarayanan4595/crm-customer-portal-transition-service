const mongoose = require('mongoose');

async function getProductFieldLabel(fieldKey) {
    const fieldLabels = {
        cDisplayName: "Product Code",
        cFeaturesDesc: "Product Name",
        cStandardPrice: "Standard Price",
        bActive: "Active",
        bIsPublic: "Visibility",
        cVersion: "Version",
        dAvailabileTill: "Available End Date",
        oUserID: "Product Owner",
        cBasePrice: "Base Prices",
        oCategoryID: "Class",
        oSubClass: "Sub Class",
        cGL_Account: "GL Income Account",
        cGL_Account_Code: "GL Income Account Code",
        cBillingUnit: "Billing Unit",
        cBillingFrequency: "Billing Frequency",
        oProductLevel: "Product Level",
        cProductType: "Product Type",
        oRegion: "Region",
        oIconId: "Icon",
        oPortalID: "Portal",
        oUserCompanyId: "Account",
        cProductCode: "Product ID",
        cStandardPriceUnit: "Standard Price Unit",
        dAvailabileFrom: "Available Start Date",
        cImg_src: "Image Source",
        iSortOrder: "Sort Order",
        bIsFTE: "Is FTE",
        bIsSubscription: "Is Subscription",
        dCreatedAt: "Created Date",
        oCreatedBy: "Created By",
        updatedBy: "Updated By",
        deletedBy: "Deleted By",
        bExpiryNotified: "Expiry Notified"
    };

    return fieldLabels[fieldKey] || fieldKey;
}

async function getAccountFieldLabel(fieldKey) {
    const fieldLabels = {
        company_name: "Account Name",
        company_nickname: "Company Nickname",
        cCompanyCode: "Account ID",
        cCompanyID: "Account Code",
        address: "Address Line 1",
        address2: "Address Line 2",
        phone: "Phone",
        email: "Email",
        web: "Website",
        active: "Active",
        oAccountClassification_id: "Account Classification",
        oAccount_Source_id: "Account Source",
        oAccountManagerUserId: "Account Manager",
        oParentComp_id: "Parent Company",
        oMasterCompany_id: "Master Company",
        oStatus_Id: "Status",
        cCity: "City",
        cState: "State",
        cCountry: "Country",
        cAccountantFirstName: "Accountant First Name",
        cAccountantLastName: "Accountant Last Name",
        cAccountingSoftware: "Accounting Software",
        IsConvertedtoClient: "Converted to Client",
        cComments: "Comments",
        oSalesManagerUserId: "Sales Manager",
        Invoice_Approvals: "Invoice Approvals",
        Billing_Informations: "Billing Information",
        statusChangeLogs: "Status Change Logs",
        phoneCode: "Phone Codes",
        faxCode: "Fax Codes",
        cOtherDetails: "Other Details",
        oCreatedBy: "Created By",
        updatedBy: "Updated By",
        deletedBy: "Deleted By",
        createdAt: "Created Date",
        updatedAt: "Updated Date",
        pin_code: "Zip Code",
        fax: "Fax",
        fileName: "File Name",
        comp_message: "Account Notes"
    };

    return fieldLabels[fieldKey] || fieldKey;
}

async function getOpportunityFieldLabel(fieldKey) {
    const fieldLabels = {
        cOpportunityCode: "Opportunity Code",
        cOpportunityName: "Opportunity Name",
        cDescription: "Description",
        oOpportunity_Owner: "Account Manager",
        oCompany_Id: "Account Name - ID",
        cProbability: "Probability",
        dTargetclose_Date: "Target Close Date",
        oOpportunitysource_Id: "Opportunity Source",
        oSubClass: "Sub Class",
        oCategoryID: "Class",
        bIsEscalation: "Is Escalation",
        bIsEscalationRounded: "Is Escalation Rounded",
        cEscalationPercentage: "Escalation Percentage",
        cEscalationAmount: "Escalation Amount",
        roundTo: "Round To",
        escalationDate: "Escalation Date",
        oEscalationFrequency: "Escalation Frequency",
        nextEscalationBillingDate: "Next Escalation Billing Date",
        endDate: "End Date",
        startDate: "Start Date",
        lastEscalationDate: "Last Escalation Date",
        isEscalationMet: "Is Escalation Met",
        "ProductDetails.cOpportunityLineCode": "Opportunity Line Code",
        "ProductDetails.oProductCategory_Product_Mapping_Id": "Product",
        "ProductDetails.cFeaturesDesc": "Features description",
        "ProductDetails.oBilling_Unit": "Billing Unit",
        "ProductDetails.oLevel": "Level",
        "ProductDetails.cOpportunityLine": "Opportunity Line",
        "ProductDetails.cBillingCycle": "Billing Cycle",
        "ProductDetails.cNegotiatedPrice": "Negotiated Price",
        "ProductDetails.cEscalatedPrice": "Escalated Price",
        "ProductDetails.originalEscalatedPrice": "Original Escalated Price",
        "ProductDetails.cBasePrice": "Standard Price",
        "ProductDetails.cBillingType": "Billing Type",
        "ProductDetails.cQuantity": "Quantity",
        "ProductDetails.cExtendedPrice": "Extended Price",
        "ProductDetails.cAnnualValue": "Annual Value",
        "ProductDetails.cStandardPriceUnit": "Standard Price Unit",
        "ProductDetails.forecasting": "Forecasting",
        "ProductDetails.isAddedToBillingRows": "Added to Billing Rows",
        cOppValue: "Opportunity Value",
        "statusChangeLogs": "Status Change Logs",
        "statusChangeLogs.oOpportunitySubStatus": "Status",
        "statusChangeLogs.dStatusChangeDate": "Status Change Date",
        "statusChangeLogs.cStatusNotes": "Status Notes",
        "statusChangeLogs.oUpdatedBy": "Status Updated By",
        "stageChangeLogs": "Stage Change Logs",
        "stageChangeLogs.oOpportunityStage": "Stage",
        "stageChangeLogs.dStageChangeDate": "Stage Change Date",
        "stageChangeLogs.cStatusNotes": "Stage Notes",
        "stageChangeLogs.oUpdatedBy": "Stage Updated By",
        'TeamDetails': 'TeamDetails', // Make sure this matches what's stored
        'Links': 'Links',
        'Files': 'Files',
        cCreatedBy: "Created By",
        dCreateDateAt: "Created Date",
        dUpdatedAt: "Updated Date",
        cUpdatedBy: "Updated By",
        bActive: "Active",
        unifiedNotificataionid: "Notification ID"
    };

    return fieldLabels[fieldKey] || fieldKey;
}

async function getProductDetailFieldLabel(fieldKey) {
    const fieldLabels = {
        'oProductCategory_Product_Mapping_Id': 'Product',
        'cQuantity': 'Quantity',
        'cNegotiatedPrice': 'Negotiated Price',
        'cEscalatedPrice': 'Escalated Price',
        'originalEscalatedPrice': 'Original Escalated Price',
        'cBasePrice': 'Base Price',
        'cBillingType': 'Billing Type',
        'cBillingCycle': 'Billing Cycle',
        'oBilling_Unit': 'Billing Unit',
        'oLevel': 'Level',
        'cFeaturesDesc': 'Description',
        'cOpportunityLine': 'Opportunity Line',
        'cOpportunityLineCode': 'Opportunity Line Code',
        'cExtendedPrice': 'Extended Price',
        'cAnnualValue': 'Annual Value',
        'cStandardPriceUnit': 'Standard Price Unit',
        'forecasting': 'Forecasting',
        'isAddedToBillingRows': 'Added to Billing Rows'
    };

    return fieldLabels[fieldKey] || fieldKey;
}

async function getBillingRowFieldLabel(fieldKey) {
    const fieldLabels = {
        'iBillingNo': 'Billing Number',
        'dCreateAt': 'Created Date',
        'oCreatedBy': 'Created By',
        'oAccountManagerUserId': 'Account Manager',
        'cInvoicePeriod': 'Invoice Period',
        'cFilePath': 'File Path',
        'cFileName': 'File Name',
        'cStatus': 'Status',
        'cRemarks': 'Remarks',
        'oUserCompanyId': 'User Company',
        'bActive': 'Active',
        'cTotal': 'Total Amount',
        'cCurrency': 'Currency',
        'lineItems': 'Line Items',
        'lineItems.oAccountManagerUserId': 'Line Item Account Manager',
        'lineItems.oCompanyId': 'Line Item Company',
        'lineItems.oOpportunityCode': 'Line Item Opportunity Code',
        'lineItems.oOpportunity_Id': 'Line Item Opportunity',
        'lineItems.oProductCategory_Product_Mapping_Id': 'Line Item Product',
        'lineItems.cClientID': 'Line Item Client ID',
        'lineItems.cClientName': 'Line Item Client Name',
        'lineItems.cProductCode': 'Line Item Product Code',
        'lineItems.cProcessDescription': 'Line Item Description',
        'lineItems.oSubClass': 'Line Item Sub Class',
        'lineItems.cBillingType': 'Line Item Billing Type',
        'lineItems.cReqRollOver': 'Line Item Roll Over',
        'lineItems.cDisplayZero': 'Line Item Display Zero',
        'lineItems.cSow': 'Line Item SOW',
        'lineItems.cPO': 'Line Item PO',
        'lineItems.iQty': 'Line Item Quantity',
        'lineItems.cValue': 'Line Item Value',
        'lineItems.cSubTotal': 'Line Item Sub Total'
    };

    return fieldLabels[fieldKey] || fieldKey;
}

async function getDraftInvoiceFieldLabel(fieldKey) {
    const fieldLabels = {
        'iDraftNo': 'Draft Number',
        'dCreateAt': 'Created Date',
        'oCreatedBy': 'Created By',
        'oCompany_Id': 'Client Company',
        'oSubClass': 'Sub Class',
        'oAccountManagerUserId': 'Account Manager',
        'cInvoiceDuration': 'Billing Month',
        'cFilePath': 'File Path',
        'cRejectReason': 'Reject Reason',
        'cFileName': 'File Name',
        'oInvoiceDraftStatus': 'Draft Status',
        'cDraftType': 'Draft Type',
        'cComments': 'Comments',
        'oUserCompanyId': 'User Company',
        'bActive': 'Active',
        'cTotal': 'Total Amount',
        'lineItems': 'Line Items',
        'mailTemplateConfig': 'Mail Template Configuration',
        'lineItems.oAccountManagerUserId': 'Line Item Account Manager',
        'lineItems.oCompanyId': 'Line Item Company',
        'lineItems.oOpportunity_Id': 'Line Item Opportunity',
        'lineItems.oProductCategory_Product_Mapping_Id': 'Line Item Product',
        'lineItems.cClientID': 'Line Item Client ID',
        'lineItems.cClientName': 'Line Item Client Name',
        'lineItems.oSubClass': 'Line Item Sub Class',
        'lineItems.cProcessDescription': 'Line Item Process Description',
        'lineItems.cDisplayDescription': 'Line Item Display Description',
        'lineItems.cBillingType': 'Line Item Billing Type',
        'lineItems.cReqRollOver': 'Line Item Roll Over',
        'lineItems.cDisplayZero': 'Line Item Display Zero',
        'lineItems.cSow': 'Line Item SOW',
        'lineItems.cPO': 'Line Item PO',
        'lineItems.iQty': 'Line Item Quantity',
        'lineItems.cValue': 'Line Item Value',
        'lineItems.cSubTotal': 'Line Item Sub Total',
        'lineItems.Comments': 'Line Item Comments',
        'lineItems.Files': 'Line Item Files'
    };

    return fieldLabels[fieldKey] || fieldKey;
}

async function getInvoiceHistoryFieldLabel(fieldKey) {
    const fieldLabels = {
        'netSuiteInvoiceNo': 'Invoice Number',
        'netSuiteInvoiceId': 'NetSuite ID',
        'cInvoiceDuration': 'Billing Period',
        'cInvoice_Date': 'Invoice Date',
        'dInvoiceDueAt': 'Due Date',
        'dCreateAt': 'Created Date',
        'cTotal': 'Total Amount',
        'cBalanceDue': 'Balance Due',
        'cAmountPaid': 'Amount Paid',
        'oPaymentStatus': 'Payment Status',
        'oInvoiceDraftStatus': 'Invoice Status',
        'oCompany_Id': 'Client Company',
        'oUserCompanyId': 'User Company',
        'oDraft_Id': 'Source Draft',
        'oTerms_Id': 'Payment Terms',
        'isBilledToClient': 'Billed to Client',
        'isMRC': 'Monthly Recurring Charge',
        'isSummary': 'Summary Invoice',
        'bIsCompanyBased': 'Company Based',
        'bIsProductBased': 'Product Based',
        'cFileName': 'File Name',
        'cFilePath': 'File Path',
        'cMessage': 'Message',
        'PaymentDetails': 'Payment Details',
        'PaymentDetails.cFileName': 'Payment File Names',
        'PaymentDetails.cFilePath': 'Payment File Paths',
        'lineItems': 'Line Items',
        'lineItems.oProductCategory_Product_Mapping_Id': 'Product',
        'lineItems.cClientID': 'Client ID',
        'lineItems.cClientName': 'Client Name',
        'lineItems.oSubClass': 'Sub Class',
        'lineItems.cProcessDescription': 'Process Description',
        'lineItems.cDisplayDescription': 'Display Description',
        'lineItems.oOpportunity_Id': 'Opportunity',
        'lineItems.cBillingType': 'Billing Type',
        'lineItems.cReqRollOver': 'Roll Over Required',
        'lineItems.cDisplayZero': 'Display Zero',
        'lineItems.cSow': 'SOW',
        'lineItems.cPO': 'PO',
        'lineItems.iQty': 'Quantity',
        'lineItems.cValue': 'Unit Price',
        'lineItems.cSubTotal': 'Line Total',
        'lineItems.dUpdatedAt': 'Line Updated At',
        'lineItems.oUpdatedBy': 'Line Updated By',
        'oCreatedBy': 'Created By',
        'updatedBy': 'Updated By',
        'deletedBy': 'Deleted By',
        'bActive': 'Active'
    };

    return fieldLabels[fieldKey] || fieldKey;
}

async function getContactFieldLabel(fieldKey) {
    const fieldLabels = {
        'cSalutation': 'Salutation',
        'cFirst_Name': 'First Name',
        'cLast_Name': 'Last Name',
        'cSuffix': 'Suffix',
        'cDisplayName': 'Contact Display name',
        'cTitle': 'Job Title',
        'cEmail': 'Email',
        'cLinkedInURL': 'LinkedinUrl',
        'cPassword': 'Password',
        'cMobileNo': 'Mobile Number',
        'oCompany_Id': 'Account',
        'oContactRoles': 'Contact Role',
        'cDepartment': 'Department',
        'oUsercompanyId': 'User Company',
        'cWorkPhoneNumber': 'Work Phone',
        'cCellPhoneNumber': 'Cell Phone',
        'cFax': 'Fax',
        'preferredContact': 'Preferred Contact',
        'bActive': 'Active',
        'dCreatedAt': 'Created Date',
        'dUpdatedAt': 'Updated Date',
        'oCreatedBy': 'Created By',
        'updatedBy': 'Updated By',
        'deletedBy': 'Deleted By'
    };

    return fieldLabels[fieldKey] || fieldKey;
}

async function getTransitionFieldLabel(fieldKey) {
    const fieldLabels = {
        'transitionNo': 'Transition Number',
        'oActivation_Id': 'Activation',
        'oTask_Id': 'Task',
        'transition_manager': 'Transition Manager',
        'mappedPhaseTemplate_Id': 'Phase Template',
        'opportunityDetails': 'Opportunity Details',
        'transitionDetails': 'Transition Details',
        'phasesTableValues': 'Phase Table Values',
        'summary': 'Summary Scores',
        'cCreatedBy': 'Created By',
        'cUpdatedBy': 'Updated By',
        'oUserCompanyId': 'User Company',
        'bActive': 'Active',
        'reason': 'Reason',
        'oStatus_Id': 'Status',
        'dCreatedAt': 'Created Date',
        'dUpdatedAt': 'Updated Date',
        'componentValues': 'Checklist Values',
        'KpiValues': 'KPI Values',
        'tollgateValues': 'Tollgate Values',
        'checklist_score': 'Checklist Score',
        'kpi_score': 'KPI Score',
        'tollgate_score': 'Tollgate Score',
        'transitionDetails.componentValues': 'Checklist Values',
        'transitionDetails.KpiValues': 'KPI Values',
        'transitionDetails.tollgateValues': 'Tollgate Values'
    };

    return fieldLabels[fieldKey] || fieldKey;
}

// Add to module.exports
module.exports = {
    getProductFieldLabel,
    getAccountFieldLabel,
    getOpportunityFieldLabel,
    getProductDetailFieldLabel,
    getBillingRowFieldLabel,
    getDraftInvoiceFieldLabel,
    getInvoiceHistoryFieldLabel,
    getContactFieldLabel,
    getTransitionFieldLabel  // Add this line
};