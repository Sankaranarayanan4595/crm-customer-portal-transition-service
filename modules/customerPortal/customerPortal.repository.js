/**
 * CustomerPortal Repository — Data access layer for Customer Portal entities.
 *
 * Responsible for:
 * - Scoping queries by tenant ID
 * - Custom query wrappers for customer portal features
 *
 * @module modules/customerPortal/customerPortal.repository
 */

const mongoose = require('mongoose');
const BaseRepository = require('../../shared/database/BaseRepository');

// Models
const masterCompanyModel = require('../../models/masterCompanyModel');
const LeadsCustomerDetails = require('../../models/Leads-Customers');
const LeadsCustomerProductDetails = require('../../models/Leads-Customer-Products');
const CRMBillingAddress = require('../../models/CRM-Billing-Addresses');
const CustomerTransitionSetting = require('../../models/Transition/Customer-Transition-Setting');
const PaymentHistoryDetails = require('../../models/payment_history');
const TransitionPhaseTemplateValueMappings = require('../../models/Transition/Transition_Phase_Template_Value_Mapping');
const TransitionMastTemplates = require('../../models/Transition/Transition_Mast_Template');
const LeadsActivationStatus = require('../../models/Leads-Mast-Activation-Status');
const CRMDepartment = require('../../models/CRM-Mast-Department');
const CrmInvoicesHistory = require('../../models/CRM-Invoices-History');

class MasterCompanyRepository extends BaseRepository {
  constructor() {
    super(masterCompanyModel, 'oUsercompanyId');
  }
}

class LeadsCustomerDetailsRepository extends BaseRepository {
  constructor() {
    super(LeadsCustomerDetails, 'oUsercompanyId');
  }
}

class LeadsCustomerProductDetailsRepository extends BaseRepository {
  constructor() {
    super(LeadsCustomerProductDetails, 'oUserCompanyId');
  }
}

class CRMBillingAddressRepository extends BaseRepository {
  constructor() {
    super(CRMBillingAddress, 'oCompany_Id');
  }
}

class CustomerTransitionSettingRepository extends BaseRepository {
  constructor() {
    super(CustomerTransitionSetting, 'oUserCompanyId');
  }
}

class PaymentHistoryDetailsRepository extends BaseRepository {
  constructor() {
    super(PaymentHistoryDetails, 'oCompanyId');
  }
}

class TransitionPhaseTemplateValueMappingsRepository extends BaseRepository {
  constructor() {
    super(TransitionPhaseTemplateValueMappings, 'oUserCompanyId');
  }
}

class TransitionMastTemplatesRepository extends BaseRepository {
  constructor() {
    super(TransitionMastTemplates, 'oUserCompanyId');
  }
}

class LeadsActivationStatusRepository extends BaseRepository {
  constructor() {
    super(LeadsActivationStatus, 'oUserCompanyId');
  }
}

class CRMDepartmentRepository extends BaseRepository {
  constructor() {
    super(CRMDepartment, 'oUserCompanyId');
  }
}

class CrmInvoicesHistoryRepository extends BaseRepository {
  constructor() {
    super(CrmInvoicesHistory, 'oUserCompanyId');
  }
}

module.exports = {
  masterCompanyRepo: new MasterCompanyRepository(),
  leadsCustomerDetailsRepo: new LeadsCustomerDetailsRepository(),
  leadsCustomerProductDetailsRepo: new LeadsCustomerProductDetailsRepository(),
  crmBillingAddressRepo: new CRMBillingAddressRepository(),
  customerTransitionSettingRepo: new CustomerTransitionSettingRepository(),
  paymentHistoryDetailsRepo: new PaymentHistoryDetailsRepository(),
  transitionPhaseTemplateValueMappingsRepo: new TransitionPhaseTemplateValueMappingsRepository(),
  transitionMastTemplatesRepo: new TransitionMastTemplatesRepository(),
  leadsActivationStatusRepo: new LeadsActivationStatusRepository(),
  crmDepartmentRepo: new CRMDepartmentRepository(),
  crmInvoicesHistoryRepo: new CrmInvoicesHistoryRepository(),
};
