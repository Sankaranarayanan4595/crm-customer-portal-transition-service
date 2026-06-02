const customerPortalService = require("./customerPortal.service");
const { getTokenDetails } = require("../../middlewares/authendicateSession");
const mongoose = require("mongoose");

async function getInvoicesCustomer(req, res, next) {
  try {
    const tokenDetails = await getTokenDetails(req);
    const result = await customerPortalService.getInvoicesCustomer(tokenDetails);
    res.status(200).json({
      success: true,
      message: "Customer Portal Invoices retrieved successfully",
      invoiceDetails: result
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Error retrieving invoices"
    });
  }
}

async function getCustomerPaymentInvoices(req, res, next) {
  try {
    const tokenDetails = await getTokenDetails(req);
    const result = await customerPortalService.getCustomerPaymentInvoices(tokenDetails);
    res.status(200).json({
      success: true,
      message: "Payment invoice history fetched successfully.",
      invoices: result
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "An error occurred while fetching payment invoices."
    });
  }
}

async function getCustomerPaymentInvoicesById(req, res, next) {
  try {
    const tokenDetails = await getTokenDetails(req);
    const result = await customerPortalService.getCustomerPaymentInvoicesById(req.params.id, tokenDetails);
    res.status(200).json({
      success: true,
      message: "Payment invoice history fetched successfully.",
      invoices: result
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "An error occurred while fetching payment invoices."
    });
  }
}

async function getProductsCustomer(req, res, next) {
  try {
    const tokenDetails = await getTokenDetails(req);
    const result = await customerPortalService.getProductsCustomer(tokenDetails);
    res.status(200).json({
      success: true,
      message: "Customer Portal products info retrieved successfully",
      companies: result
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Error in retrieving products info"
    });
  }
}

async function getCompanyDetails(req, res, next) {
  try {
    const tokenDetails = await getTokenDetails(req);
    const result = await customerPortalService.getCompanyDetails(tokenDetails);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Error fetching company"
    });
  }
}

async function updateCustomerDetails(req, res, next) {
  try {
    const token = req.header("x-access-token");
    const tokenDetails = await getTokenDetails(req);
    const result = await customerPortalService.updateCustomerDetails(req, req.body, tokenDetails, token);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Error updating customer"
    });
  }
}

async function getCustomerDetails(req, res, next) {
  try {
    const tokenDetails = await getTokenDetails(req);
    const result = await customerPortalService.getCustomerDetails(tokenDetails);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Error fetching customer"
    });
  }
}

async function syncExistingCustomer(req, res, next) {
  try {
    const token = req.header("x-access-token");
    const tokenDetails = await getTokenDetails(req);
    const result = await customerPortalService.syncExistingCustomer(req.body.email, token, tokenDetails);
    res.status(200).json({
      success: true,
      message: "Customer sync successful",
      ...result
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Error syncing customer"
    });
  }
}

async function getInvoicesCustomerById(req, res, next) {
  try {
    const token = req.header("x-access-token");
    const tokenDetails = await getTokenDetails(req);
    const result = await customerPortalService.getInvoicesCustomerById(req.params.id, token, tokenDetails);
    res.status(200).json({
      success: true,
      message: "Customer Portal Invoice retrieved successfully",
      invoiceDetails: result
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Error in retrieving invoices"
    });
  }
}

async function AddActiveCustomerMaster(req, reqBody, res) {
  // Supports internal call: AddActiveCustomerMaster(req, reqBody, res)
  // Supports routing call: AddActiveCustomerMaster(req, res)
  let customer;
  let token;
  let isExpress = false;

  if (reqBody && typeof reqBody.status === "function" && typeof reqBody.json === "function") {
    // Express call
    customer = req.body;
    token = req.header("x-access-token");
    isExpress = true;
  } else {
    // Internal call
    customer = reqBody?.body || reqBody;
    if (!customer?.fromSignUp) {
      token = req.header ? req.header('x-access-token') : req.headers?.['x-access-token'];
    }
  }

  try {
    const result = await customerPortalService.addActiveCustomerMaster(customer, token);
    if (isExpress) {
      return reqBody.status(200).json({ success: true, data: result });
    }
    return result;
  } catch (error) {
    if (isExpress) {
      return reqBody.status(500).json({ success: false, message: error.message });
    }
    throw error;
  }
}

async function getAllDepartmentsBactive(req, res, next) {
  try {
    const tokenDetails = await getTokenDetails(req);
    const result = await customerPortalService.getAllDepartmentsBactive(tokenDetails);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Error fetching departments"
    });
  }
}

async function AddSubscriptionProduct(req, res, next) {
  try {
    const tokenDetails = await getTokenDetails(req);
    await customerPortalService.AddSubscriptionProduct(req.body, tokenDetails);
    res.status(200).json({
      success: true,
      message: "Product Added Successfully",
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
}

async function loadCustomerTransition(req, res, next) {
  try {
    const tokenDetails = await getTokenDetails(req);
    const result = await customerPortalService.loadCustomerTransition(req.params.roleName, tokenDetails);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
}

async function getCardStatusesTransition(req, res, next) {
  try {
    const result = await customerPortalService.getCardStatusesTransition(req.params.type);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
}

async function loadClientProducts(req, res, next) {
  try {
    const tokenDetails = await getTokenDetails(req);
    const result = await customerPortalService.loadClientProducts(tokenDetails);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
}

async function upsertCustomerConfigration(req, res, next) {
  try {
    const tokenDetails = await getTokenDetails(req);
    const result = await customerPortalService.upsertCustomerConfigration(req.body, tokenDetails);
    res.status(req.body._id ? 200 : 201).json({
      success: true,
      message: req.body._id ? "Customer configuration updated successfully" : "Customer configuration created successfully",
      data: result
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
}

async function loadCustomerApproval(req, res, next) {
  try {
    const tokenDetails = await getTokenDetails(req);
    const result = await customerPortalService.loadCustomerApproval(tokenDetails);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
}

async function checkTransitionCustomerRole(req, res, next) {
  try {
    const tokenDetails = await getTokenDetails(req);
    const result = await customerPortalService.checkTransitionCustomerRole(req.params.id, tokenDetails);
    res.status(200).json({
      success: true,
      roles: result
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
}

module.exports = {
  getInvoicesCustomer,
  getCustomerPaymentInvoices,
  getCustomerPaymentInvoicesById,
  getProductsCustomer,
  getCompanyDetails,
  updateCustomerDetails,
  getCustomerDetails,
  syncExistingCustomer,
  getInvoicesCustomerById,
  AddActiveCustomerMaster,
  getAllDepartmentsBactive,
  AddSubscriptionProduct,
  loadCustomerTransition,
  getCardStatusesTransition,
  loadClientProducts,
  upsertCustomerConfigration,
  loadCustomerApproval,
  checkTransitionCustomerRole
};
