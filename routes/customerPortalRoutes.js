const express = require("express");
const router = express.Router();

const isAuth = require("../middlewares/authendicateSession");
const customerPortalController = require("../modules/customerPortal").controller;
// razerpayController removed — P0 security: client-supplied payment secrets (CWE-798)
// Health/Test Route
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Customer Portal Route Working",
  });
});


router.get("/", (req, res) => res.status(200).send("Customer Portal Route OK"));

router.get("/getInvoicesCustomer", isAuth.getSessionUser, customerPortalController.getInvoicesCustomer);
router.get("/getPaymentInvoicesCustomer", isAuth.getSessionUser, customerPortalController.getCustomerPaymentInvoices);
router.get("/getInvoicesCustomerById/:id", isAuth.getSessionUser, customerPortalController.getInvoicesCustomerById);
router.get("/getProductsCustomer", isAuth.getSessionUser, customerPortalController.getProductsCustomer);
router.get("/getCompanyDetails", isAuth.getSessionUser, customerPortalController.getCompanyDetails);
router.get("/getCustomerDetails", isAuth.getSessionUser, customerPortalController.getCustomerDetails);
router.patch("/updateCustomerDetails", isAuth.getSessionUser, customerPortalController.updateCustomerDetails);
router.post("/syncExistingCustomer", isAuth.getSessionUser, customerPortalController.syncExistingCustomer);
router.post("/AddActiveCustomerMaster", isAuth.getSessionUser, customerPortalController.AddActiveCustomerMaster);
router.get("/getAllDepartmentsBactiveCustomerPortal", isAuth.getSessionUser, customerPortalController.getAllDepartmentsBactive);
router.post("/AddSubscriptionProduct", isAuth.getSessionUser, customerPortalController.AddSubscriptionProduct);
router.get("/getCustomerPaymentInvoicesById/:id", isAuth.getSessionUser, customerPortalController.getCustomerPaymentInvoicesById);


router.get("/loadCustomerTransition/:roleName", isAuth.getSessionUser, customerPortalController.loadCustomerTransition);
router.get("/loadClientProducts", isAuth.getSessionUser, customerPortalController.loadClientProducts);
router.get("/loadCustomerApproval", isAuth.getSessionUser, customerPortalController.loadCustomerApproval);
router.get("/getCardStatusesTransition/:type", isAuth.getSessionUser, customerPortalController.getCardStatusesTransition);
router.post("/upsertCustomerConfigration", isAuth.getSessionUser, customerPortalController.upsertCustomerConfigration);
router.get("/checkTransitionCustomerRole/:id", isAuth.getSessionUser, customerPortalController.checkTransitionCustomerRole);


module.exports = router;
