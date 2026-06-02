const mongoose = require("mongoose");
const axios = require("axios");
const logger = require("../../shared/logger");
const { AppError, ErrorCodes } = require("../../shared/errors/AppError");

const {
  masterCompanyRepo,
  leadsCustomerDetailsRepo,
  leadsCustomerProductDetailsRepo,
  crmBillingAddressRepo,
  customerTransitionSettingRepo,
  paymentHistoryDetailsRepo,
  transitionPhaseTemplateValueMappingsRepo,
  transitionMastTemplatesRepo,
  leadsActivationStatusRepo,
  crmDepartmentRepo,
  crmInvoicesHistoryRepo
} = require("./customerPortal.repository");

const countrySchema = require('../../models/CRM-Mast-Countries');
async function getCountryData() {
  return await countrySchema.aggregate([
    {
      $match: { bActive: true },
    },
    {
      $lookup: {
        from: "mast_currencies",
        localField: "iCurrency_id",
        foreignField: "_id",
        as: "country_details",
      },
    },
    {
      $unwind: {
        path: "$country_details",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $sort: { iSortOrder: 1 }
    }
  ]);
}
const { getStatusById } = require("../common");
const User = require("../../models/userModel");
const Employee = require("../../models/userEmployee");

class CustomerPortalService {
  async getInvoicesCustomer(tokenDetails) {
    const loggedInUser = tokenDetails?.idofuser;
    const selectedCompanyId = tokenDetails?.selectedCompanyId;

    if (!loggedInUser) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, "Unauthorized user.", 401);
    }

    const mastComp = await masterCompanyRepo.findById(selectedCompanyId);
    if (!mastComp) {
      throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, "Company not found.", 404);
    }

    const INVOICE_PAID_ID = mongoose.Types.ObjectId(process.env.INVOICE_PAID_ID);
    const INVOICE_VOID_ID = mongoose.Types.ObjectId(process.env.INVOICE_VOID_ID);

    const invoiceDetails = await crmInvoicesHistoryRepo.model.aggregate([
      {
        $match: {
          oUserCompanyId: mongoose.Types.ObjectId(mastComp.oUsercompanyId),
          oPaymentStatus: { $nin: [INVOICE_PAID_ID, INVOICE_VOID_ID] }
        }
      },
      { $unwind: "$invoiceDetails" },
      {
        $lookup: {
          from: "leads_customer_product_details",
          localField: "invoiceDetails.oActivation_Id",
          foreignField: "_id",
          as: "customer_product"
        }
      },
      { $unwind: { path: "$customer_product", preserveNullAndEmptyArrays: true } },
      {
        $match: {
          "customer_product.oCompany_Id": mongoose.Types.ObjectId(selectedCompanyId)
        }
      },
      {
        $lookup: {
          from: "leads_productcategory_product_mappings",
          localField: "customer_product.oProductCategory_Product_Mapping_Id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "mast_company_informations",
          localField: "customer_product.oCompany_Id",
          foreignField: "_id",
          as: "company"
        }
      },
      { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_categories",
          localField: "product.oCategoryID",
          foreignField: "_id",
          as: "categoryDetails"
        }
      },
      { $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_master_statuses",
          localField: "oPaymentStatus",
          foreignField: "_id",
          as: "invoiceStatus"
        }
      },
      { $unwind: { path: "$invoiceStatus", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          InvoiceNo: "$iInvoiceNo",
          oPaymentStatus: 1,
          InvoiceDate: "$dCreateAt",
          DueDate: "$dInvoiceDueAt",
          cCompany_Name: "$company.company_name",
          email: "$company.email",
          address: "$company.address",
          address2: "$company.address2",
          phone: "$company.phone",
          cDisplayName: "$product.cDisplayName",
          product_id: "$product._id",
          qty: "$invoiceDetails.iQty",
          cValue: "$invoiceDetails.cValue",
          subTotal: "$invoiceDetails.cSubTotal",
          total: "$cTotal",
          cBalanceDue: "$cBalanceDue",
          cFileName: "$cFileName",
          cFilePath: "$cFilePath",
          categoryName: "$categoryDetails.cCategory_Name",
          categoryID: "$categoryDetails._id",
          StatusName: "$invoiceStatus.cStatus_Name",
          className: "$invoiceStatus.className",
        }
      },
      {
        $match: {
          InvoiceNo: { $ne: null }
        }
      },
      {
        $sort: {
          InvoiceDate: -1
        }
      }
    ]);

    return invoiceDetails;
  }

  async getCustomerPaymentInvoices(tokenDetails) {
    const selectedCompanyId = tokenDetails?.selectedCompanyId;

    const mastComp = await masterCompanyRepo.findById(selectedCompanyId);
    if (!mastComp) {
      throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, "Company not found.", 404);
    }

    const INVOICE_PAID_ID = mongoose.Types.ObjectId(process.env.INVOICE_PAID_ID);
    const INVOICE_VOID_ID = mongoose.Types.ObjectId(process.env.INVOICE_VOID_ID);
    const INVOICE_FAILD_ID = mongoose.Types.ObjectId(process.env.INVOICE_FAILD_ID);

    const allInvoices = await leadsCustomerProductDetailsRepo.model.aggregate([
      {
        $match: {
          oCompany_Id: mastComp._id
        }
      },
      {
        $lookup: {
          from: "leads_productcategory_product_mappings",
          localField: "oProductCategory_Product_Mapping_Id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "crm_invoices_histories",
          localField: "_id",
          foreignField: "invoiceDetails.oActivation_Id",
          as: "invoice"
        }
      },
      { $unwind: { path: "$invoice", preserveNullAndEmptyArrays: true } },
      {
        $match: {
          "invoice.oPaymentStatus": { $in: [INVOICE_PAID_ID, INVOICE_VOID_ID] }
        }
      },
      {
        $lookup: {
          from: "mast_company_informations",
          localField: "oCompany_Id",
          foreignField: "_id",
          as: "company"
        }
      },
      { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_master_statuses",
          localField: "invoice.oPaymentStatus",
          foreignField: "_id",
          as: "invoiceStatus"
        }
      },
      { $unwind: { path: "$invoiceStatus", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_categories",
          localField: "product.oCategoryID",
          foreignField: "_id",
          as: "categoryDetails"
        }
      },
      { $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: "$invoice._id",
          InvoiceNo: { $ifNull: ["$invoice.iQBInvoiceNo", "$invoice.iInvoiceNo"] },
          InvoiceDate: "$invoice.dCreateAt",
          DueDate: {
            $dateAdd: { startDate: "$invoice.dCreateAt", unit: "day", amount: 30 }
          },
          CompanyName: "$company.company_name",
          ProductName: "$product.cDisplayName",
          Quantity: { $ifNull: ["$invoice.invoiceDetails.iQty", 1] },
          TotalAmount: "$invoice.cTotal",
          FileName: "$invoice.cFileName",
          FilePath: "$invoice.cFilePath",
          PaymentDetails: "$invoice.PaymentDetails",
          PaymentDate: "$invoice.dPaymentDate",
          StatusName: "$invoiceStatus.cStatus_Name",
          className: "$invoiceStatus.className",
          TransactionId: "",
          Payment_Method: "",
          cDisplayName: "$product.cDisplayName",
          product_id: "$product._id",
          categoryName: "$categoryDetails.cCategory_Name",
          categoryID: "$categoryDetails._id",
          PaymentType: { $literal: "direct" },
          PaymentStatusId: "$invoice.oPaymentStatus"
        }
      },
      {
        $unionWith: {
          coll: "payment_history_details",
          pipeline: [
            {
              $match: {
                oCompanyId: mastComp._id,
                bActive: true,
                oPaymentStatus: { $in: [INVOICE_PAID_ID, INVOICE_FAILD_ID] }
              }
            },
            {
              $lookup: {
                from: "leads_productcategory_product_mappings",
                localField: "invoiceDetails.product_id",
                foreignField: "_id",
                as: "product"
              }
            },
            { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "crm_invoices_histories",
                localField: "invoiceIds",
                foreignField: "_id",
                as: "invoice"
              }
            },
            { $unwind: { path: "$invoice", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "mast_company_informations",
                localField: "oCompanyId",
                foreignField: "_id",
                as: "company"
              }
            },
            { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "leads_master_statuses",
                localField: "oPaymentStatus",
                foreignField: "_id",
                as: "invoiceStatus"
              }
            },
            { $unwind: { path: "$invoiceStatus", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: "$invoice._id",
                InvoiceNo: { $ifNull: ["$invoice.iQBInvoiceNo", "$invoice.iInvoiceNo"] },
                InvoiceDate: "$invoice.dCreateAt",
                DueDate: {
                  $dateAdd: { startDate: "$invoice.dCreateAt", unit: "day", amount: 30 }
                },
                CompanyName: "$company.company_name",
                ProductName: "$product.cDisplayName",
                Quantity: { $ifNull: ["$invoice.invoiceDetails.iQty", 1] },
                TotalAmount: "$invoice.cTotal",
                FileName: "$invoice.cFileName",
                FilePath: "$invoice.cFilePath",
                PaymentDetails: "$invoice.PaymentDetails",
                PaymentDate: { $ifNull: ["$dCreatedAt", null] },
                StatusName: "$invoiceStatus.cStatus_Name",
                className: "$invoiceStatus.className",
                TransactionId: { $ifNull: ["$payment_details.transaction_id", ""] },
                Payment_Method: { $ifNull: ["$payment_details.wallet", ""] },
                cDisplayName: "$product.cDisplayName",
                product_id: "$product._id",
                categoryName: "",
                categoryID: "",
                PaymentType: { $literal: "history" },
                PaymentStatusId: "$oPaymentStatus",
                PaymentDate: "$dCreatedAt",
              }
            }
          ]
        }
      }
    ]);

    const paidMap = new Map();
    const finalInvoices = [];

    for (const inv of allInvoices) {
      const isPaid = inv.PaymentStatusId?.toString() === INVOICE_PAID_ID.toString();

      if (isPaid) {
        const key = inv.InvoiceNo;
        const existing = paidMap.get(key);

        if (!existing || new Date(inv.PaymentDate) > new Date(existing.PaymentDate)) {
          paidMap.set(key, inv);
        }
      } else {
        finalInvoices.push(inv);
      }
    }

    finalInvoices.push(...paidMap.values());
    finalInvoices.sort((a, b) => new Date(b.PaymentDate) - new Date(a.PaymentDate));

    return finalInvoices;
  }

  async getCustomerPaymentInvoicesById(productId, tokenDetails) {
    const selectedCompanyId = tokenDetails?.selectedCompanyId;

    const mastComp = await masterCompanyRepo.findById(selectedCompanyId);
    if (!mastComp) {
      throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, "Company not found.", 404);
    }

    const INVOICE_PAID_ID = mongoose.Types.ObjectId(process.env.INVOICE_PAID_ID);
    const INVOICE_VOID_ID = mongoose.Types.ObjectId(process.env.INVOICE_VOID_ID);
    const INVOICE_FAILD_ID = mongoose.Types.ObjectId(process.env.INVOICE_FAILD_ID);

    const allInvoices = await leadsCustomerProductDetailsRepo.model.aggregate([
      {
        $match: {
          oCompany_Id: mastComp._id
        }
      },
      {
        $lookup: {
          from: "leads_productcategory_product_mappings",
          localField: "oProductCategory_Product_Mapping_Id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      { $match: { "product._id": mongoose.Types.ObjectId(productId) } },
      {
        $lookup: {
          from: "crm_invoices_histories",
          localField: "_id",
          foreignField: "invoiceDetails.oActivation_Id",
          as: "invoice"
        }
      },
      { $unwind: { path: "$invoice", preserveNullAndEmptyArrays: true } },
      {
        $match: {
          "invoice.oPaymentStatus": { $in: [INVOICE_PAID_ID, INVOICE_VOID_ID] }
        }
      },
      {
        $lookup: {
          from: "mast_company_informations",
          localField: "oCompany_Id",
          foreignField: "_id",
          as: "company"
        }
      },
      { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_master_statuses",
          localField: "invoice.oPaymentStatus",
          foreignField: "_id",
          as: "invoiceStatus"
        }
      },
      { $unwind: { path: "$invoiceStatus", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_categories",
          localField: "product.oCategoryID",
          foreignField: "_id",
          as: "categoryDetails"
        }
      },
      { $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: "$invoice._id",
          InvoiceNo: { $ifNull: ["$invoice.iQBInvoiceNo", "$invoice.iInvoiceNo"] },
          InvoiceDate: "$invoice.dCreateAt",
          DueDate: {
            $dateAdd: { startDate: "$invoice.dCreateAt", unit: "day", amount: 30 }
          },
          CompanyName: "$company.company_name",
          ProductName: "$product.cDisplayName",
          Quantity: { $ifNull: ["$invoice.invoiceDetails.iQty", 1] },
          TotalAmount: "$invoice.cTotal",
          FileName: "$invoice.cFileName",
          FilePath: "$invoice.cFilePath",
          PaymentDetails: "$invoice.PaymentDetails",
          PaymentDate: "$invoice.dPaymentDate",
          StatusName: "$invoiceStatus.cStatus_Name",
          className: "$invoiceStatus.className",
          TransactionId: "",
          Payment_Method: "",
          cDisplayName: "$product.cDisplayName",
          product_id: "$product._id",
          categoryName: "$categoryDetails.cCategory_Name",
          categoryID: "$categoryDetails._id",
          PaymentType: { $literal: "direct" },
          PaymentStatusId: "$invoice.oPaymentStatus"
        }
      },
      {
        $unionWith: {
          coll: "payment_history_details",
          pipeline: [
            {
              $match: {
                oCompanyId: mastComp._id,
                bActive: true,
                oPaymentStatus: { $in: [INVOICE_PAID_ID, INVOICE_FAILD_ID] }
              }
            },
            {
              $lookup: {
                from: "leads_productcategory_product_mappings",
                localField: "invoiceDetails.product_id",
                foreignField: "_id",
                as: "product"
              }
            },
            { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "crm_invoices_histories",
                localField: "invoiceIds",
                foreignField: "_id",
                as: "invoice"
              }
            },
            { $unwind: { path: "$invoice", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "mast_company_informations",
                localField: "oCompanyId",
                foreignField: "_id",
                as: "company"
              }
            },
            { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "leads_master_statuses",
                localField: "oPaymentStatus",
                foreignField: "_id",
                as: "invoiceStatus"
              }
            },
            { $unwind: { path: "$invoiceStatus", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: "$invoice._id",
                InvoiceNo: { $ifNull: ["$invoice.iQBInvoiceNo", "$invoice.iInvoiceNo"] },
                InvoiceDate: "$invoice.dCreateAt",
                DueDate: {
                  $dateAdd: { startDate: "$invoice.dCreateAt", unit: "day", amount: 30 }
                },
                CompanyName: "$company.company_name",
                ProductName: "$product.cDisplayName",
                Quantity: { $ifNull: ["$invoice.invoiceDetails.iQty", 1] },
                TotalAmount: "$invoice.cTotal",
                FileName: "$invoice.cFileName",
                FilePath: "$invoice.cFilePath",
                PaymentDetails: "$invoice.PaymentDetails",
                PaymentDate: { $ifNull: ["$dCreatedAt", null] },
                StatusName: "$invoiceStatus.cStatus_Name",
                className: "$invoiceStatus.className",
                TransactionId: { $ifNull: ["$payment_details.transaction_id", ""] },
                Payment_Method: { $ifNull: ["$payment_details.wallet", ""] },
                cDisplayName: "$product.cDisplayName",
                product_id: "$product._id",
                categoryName: "",
                categoryID: "",
                PaymentType: { $literal: "history" },
                PaymentStatusId: "$oPaymentStatus",
                PaymentDate: "$dCreatedAt",
              }
            }
          ]
        }
      }
    ]);

    const paidMap = new Map();
    const finalInvoices = [];

    for (const inv of allInvoices) {
      const isPaid = inv.PaymentStatusId?.toString() === INVOICE_PAID_ID.toString();

      if (isPaid) {
        const key = inv.InvoiceNo;
        const existing = paidMap.get(key);

        if (!existing || new Date(inv.PaymentDate) > new Date(existing.PaymentDate)) {
          paidMap.set(key, inv);
        }
      } else {
        finalInvoices.push(inv);
      }
    }

    finalInvoices.push(...paidMap.values());
    finalInvoices.sort((a, b) => new Date(b.PaymentDate) - new Date(a.PaymentDate));

    return finalInvoices;
  }

  async getProductsCustomer(tokenDetails) {
    const loggedInUser = tokenDetails?.idofuser;
    const selectedCompanyId = tokenDetails.selectedCompanyId;

    const mastComp = await masterCompanyRepo.findById(selectedCompanyId);

    if (!loggedInUser) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, "Unauthorized user.", 401);
    }

    const companies = await leadsCustomerProductDetailsRepo.model.aggregate([
      {
        $match: {
          oCompany_Id: mongoose.Types.ObjectId(mastComp?._id)
        }
      },
      {
        $lookup: {
          from: "mast_company_informations",
          localField: "oCompany_Id",
          foreignField: "_id",
          as: "companyDetails"
        }
      },
      { $unwind: { path: "$companyDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_productcategory_product_mappings",
          localField: "oProductCategory_Product_Mapping_Id",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_categories",
          localField: "oCategory_Id",
          foreignField: "_id",
          as: "categoryDetails"
        }
      },
      { $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "crm_mast_additionalcharges",
          let: { chargeIds: "$otherCharges._id" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", { $ifNull: ["$$chargeIds", []] }] }
              }
            },
            {
              $project: {
                _id: 0,
                cadditionalCharges: 1,
                Amount: "$otherCharges.cAmount"
              }
            }
          ],
          as: "additionalChargesInfo"
        }
      },
      {
        $lookup: {
          from: "crm_subscription_contractdetails",
          localField: "_id",
          foreignField: "oActivation_Id",
          as: "crm_subscription_contractdetails"
        }
      },
      { $unwind: { path: "$crm_subscription_contractdetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "crm_fte_contractdetails",
          localField: "_id",
          foreignField: "oActivation_Id",
          as: "crm_fte_contractdetails"
        }
      },
      { $unwind: { path: "$crm_fte_contractdetails", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          resolvedBillingFrequency: {
            $ifNull: [
              "$crm_fte_contractdetails.oBillingFrequency",
              "$crm_subscription_contractdetails.oBillingFrequency"
            ]
          }
        }
      },
      {
        $lookup: {
          from: "crm_mast_frequencies",
          localField: "resolvedBillingFrequency",
          foreignField: "_id",
          as: "crm_mast_frequencies"
        }
      },
      { $unwind: { path: "$crm_mast_frequencies", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "mast_countries",
          localField: "companyDetails.cCountry",
          foreignField: "_id",
          as: "CountryDetails"
        }
      },
      { $unwind: { path: "$CountryDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "useradmin_mast_icons",
          localField: "productDetails.oIconId",
          foreignField: "_id",
          as: "icons"
        }
      },
      { $unwind: { path: "$icons", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_master_statuses",
          localField: "oStatus_Id",
          foreignField: "_id",
          as: "invoiceStatus"
        }
      },
      { $unwind: { path: "$invoiceStatus", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          oStatus_Id: 1,
          "companyDetails.company_name": 1,
          "productDetails.cDisplayName": 1,
          "productDetails._id": 1,
          "categoryDetails.cCategory_Name": 1,
          iBillingFrequency: 1,
          dCreateDateAt: 1,
          frequency: "$crm_mast_frequencies.frequency",
          currencySymbol: "$CountryDetails.currencySymbol",
          cTotal: {
            $cond: {
              if: { $gt: [{ $ifNull: ["$crm_fte_contractdetails.cTotal", null] }, null] },
              then: "$crm_fte_contractdetails.cTotal",
              else: {
                $cond: {
                  if: { $gt: [{ $ifNull: ["$crm_subscription_contractdetails.cTotal", null] }, null] },
                  then: "$crm_subscription_contractdetails.cTotal",
                  else: 0
                }
              }
            }
          },
          additionalChargesInfo: 1,
          iconClass: "$icons.cssClass",
          StatusName: "$invoiceStatus.cStatus_Name",
          className: "$invoiceStatus.className",
          cBasePrice: "$productDetails.cBasePrice",
        }
      }
    ]);

    return companies;
  }

  async getCompanyDetails(tokenDetails) {
    const loggedInUser = tokenDetails?.idofuser;
    const selectedCompanyId = tokenDetails.selectedCompanyId;

    const mastComp = await masterCompanyRepo.findById(selectedCompanyId);

    if (!loggedInUser) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, "Unauthorized user.", 401);
    }

    const pipeline = [
      {
        $match: {
          _id: mastComp._id,
        }
      },
      {
        $lookup: {
          from: "leads_customer_details",
          localField: "oContactPerson",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "crm_billing_addresses",
          localField: "_id",
          foreignField: "oCompany_Id",
          as: "billing",
        },
      },
      { $unwind: { path: "$billing", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "mast_countries",
          localField: "cCountry",
          foreignField: "_id",
          as: "countries",
        },
      },
      { $unwind: { path: "$countries", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "mast_currencies",
          localField: "countries.iCurrency_id",
          foreignField: "_id",
          as: "currency",
        },
      },
      { $unwind: { path: "$currency", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "mast_countries",
          localField: "billing.cBilling_Country",
          foreignField: "_id",
          as: "bcountries",
        },
      },
      { $unwind: { path: "$bcountries", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          company_name: 1,
          cFirst_Name: "$customer.cFirst_Name",
          cLast_Name: "$customer.cLast_Name",
          address: 1,
          address2: 1,
          pin_code: 1,
          cCity: 1,
          cState: 1,
          isMailService: 1,
          cCountry: "$countries._id",
          cCountry_name: "$countries.cCountry",
          cMobile: "$customer.cMobileNo",
          cEmail: "$customer.cEmail",
          cComments: 1,
          web: 1,
          cFax: 1,
          cCompany_Logo: 1,
          oContactPerson: 1,
          cBilling_First_Name: "$billing.cBilling_First_Name",
          cBilling_Last_Name: "$billing.cBilling_Last_Name",
          cBilling_Email: "$billing.cBilling_Email",
          cBilling_MobileNo: "$billing.cBilling_MobileNo",
          cBilling_Address1: "$billing.cBilling_Address1",
          cBilling_Address2: "$billing.cBilling_Address2",
          cBilling_Postal_Code: "$billing.cBilling_Postal_Code",
          cBilling_City: "$billing.cBilling_City",
          cBilling_State: "$billing.cBilling_State",
          cBilling_Country: "$bcountries._id",
          currenyType: "$currency",
        },
      },
      {
        $limit: 1
      }
    ];

    const result = await masterCompanyRepo.model.aggregate(pipeline);
    if (result.length === 0) {
      throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, "Client details not found", 404);
    }

    return result;
  }

  async updateCustomerDetails(req, body, tokenDetails, token) {
    const {
      cBilling_Country,
      cBilling_First_Name,
      cBilling_Last_Name,
      cBilling_Email,
      cBilling_MobileNo,
      cBilling_State,
      cBilling_City,
      cBilling_Postal_Code,
      cBilling_Address1,
      cBilling_Address2,
      cFirst_Name,
      cLast_Name,
      cEmail,
      cDepartment,
      company_name,
      cState,
      cCity,
      address,
      address2,
      pin_code,
      cComments,
      cCompany_Logo,
      web,
      fax,
      cCountry, isMailService, oContactPerson
    } = body;

    const companyId = tokenDetails.selectedCompanyId;
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const countryData = await getCountryData();
    const selectedCountry = countryData.find(country => country._id.toString() === mongoose.Types.ObjectId(cBilling_Country).toString());
    if (!selectedCountry) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "Invalid country selected.", 400);
    }

    const companyDetails = await masterCompanyRepo.findById(companyId);
    if (!companyDetails) throw new Error("Company not found");
    const timestamp = Date.now().toString();
    const contact = await leadsCustomerDetailsRepo.findById(oContactPerson);

    const getCity = await axios.post(
      `${process.env.AUTH_URL}/commonService/getCity/`,
      { ZIPCode: pin_code, countryId: cCountry, country: cState },
      { headers: { 'Content-Type': 'application/json', timestamp, 'x-access-token': token, "is-from": "App" } }
    );

    const updateCustomer = {
      cFirst_Name,
      cLast_Name,
      cEmail,
      cMobileNo: contact.cMobileNo || "",
      cDepartment,
      oCompany_Id: companyId,
    };

    const updateCompany = {
      company_name: company_name,
      cState,
      cCity,
      address: address.trim(),
      address2: address2.trim(),
      pin_code,
      cComments,
      cCompany_Logo,
      web,
      fax,
      oContactPerson,
      cCountry, isMailService,
      phone: contact.cMobileNo,
      contact_person: contact.cFirst_Name,
      contact_person_appt: contact.cLast_Name,
      res_short_name: company_name,
      comp_short_name: company_name,
      email: contact.cEmail,
      city_id: getCity?.data?.data?._id
    };

    const billingAddress = {
      oCompany_Id: mongoose.Types.ObjectId(companyId),
      cBilling_First_Name,
      cBilling_Last_Name,
      cBilling_Email,
      cBilling_Address1,
      cBilling_Address2,
      cBilling_Postal_Code,
      cBilling_City,
      cBilling_State,
      cBilling_Country,
      cBilling_MobileNo,
    };

    const existingAddress = await crmBillingAddressRepo.model.findOne({ oCompany_Id: mongoose.Types.ObjectId(companyId) });

    const [result1, result2] = await Promise.all([
      leadsCustomerDetailsRepo.model.findByIdAndUpdate(oContactPerson, updateCustomer, { new: true }),
      masterCompanyRepo.model.findByIdAndUpdate(companyId, updateCompany, { new: true }),
    ]);

    let qbResponse;

    if (process.env.AUTH_URL) {
      if (companyDetails?.unifiedCompanyId) {
        await axios.put(
          `${process.env.AUTH_URL}/company/update/${companyDetails?.unifiedCompanyId}`,
          { ...updateCompany, projectName: 'crm' },
          { headers: { 'Content-Type': 'application/json', timestamp, 'x-access-token': token, "is-from": "App" } }
        );
      }
    }

    let result3;
    const loggedInUserID = tokenDetails.idofuser;

    if (existingAddress) {
      result3 = await crmBillingAddressRepo.model.findOneAndUpdate(
        { oCompany_Id: mongoose.Types.ObjectId(companyId) },
        billingAddress,
        { new: true }
      );
    } else {
      const saveCRMBillingAddress = new crmBillingAddressRepo.model({
        ...billingAddress,
        oCreatedBy: mongoose.Types.ObjectId(loggedInUserID),
      });
      result3 = await saveCRMBillingAddress.save();
    }
    if (result1 || result2 || result3) {
      return { success: true, message: "Profile updated successfully" };
    }
    return { success: false, message: "Profile update failed" };
  }

  async getCustomerDetails(tokenDetails) {
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const pipeline = [
      {
        $match: { oCompany_Id: new mongoose.Types.ObjectId(selectedCompanyId) },
      },
      {
        $lookup: {
          from: "mast_company_informations",
          localField: "oCompany_Id",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          customer_id: "$customer._id",
          cFirst_Name: 1,
          cLast_Name: 1,
          cEmail: 1,
          cMobileNo: 1,
          cDepartment: 1
        },
      },
    ];
    return leadsCustomerDetailsRepo.model.aggregate(pipeline);
  }

  async syncExistingCustomer(email, token, tokenDetails) {
    const emailLower = email.toLowerCase();
    const employee = await Employee.findOne({ email: emailLower });
    if (!employee) {
      throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, 'Employee not found', 404);
    }

    const companyList = await leadsCustomerDetailsRepo.model.find({ cEmail: emailLower });
    const customerData = [];

    for (const customer of companyList) {
      const companyDetails = await masterCompanyRepo.findById(customer.oCompany_Id);
      if (companyDetails) {
        customerData.push(companyDetails);
      }
    }

    if (customerData.length === 0) {
      throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, 'No matching customer data found', 404);
    }

    const userData = await User.findOne({ empId: employee._id });
    if (!userData) {
      throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, 'User data not found', 404);
    }

    const companyIds = [];
    const timestamp = Date.now().toString();

    for (const customer of customerData) {
      const newCompanyDetails = {
        address1: customer.address || '',
        address2: customer.address2 || '',
        bEnableQuickBook: false,
        comp_short_name: customer.company_name,
        company_file_name: 'No file chosen',
        company_logo: '',
        company_name: customer.company_name,
        oContactPerson: customer.company_name,
        oContactPerson_appt: customer.company_name,
        email: emailLower,
        logo_type: 'square',
        phone: '',
        user_id: userData._id,
      };
      const isExisting = await masterCompanyRepo.model.findOne({ company_name: customer.company_name });
      if (isExisting) {
        companyIds.push(isExisting?._id);
      } else {
        const response = new masterCompanyRepo.model(newCompanyDetails);
        await response.save();
        companyIds.push(response?._id);
      }
    }

    const updateUser = await User.findByIdAndUpdate(userData?._id, { companyId: companyIds, defCompanyId: companyIds[0] }, { new: true });
    return { companyIds, updateUser };
  }

  async getInvoicesCustomerById(productId, token, tokenDetails) {
    const loggedInUser = tokenDetails?.idofuser;
    const selectedCompanyId = tokenDetails?.selectedCompanyId;

    if (!loggedInUser) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, "Unauthorized user.", 401);
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "Invalid productId.", 400);
    }

    const mastComp = await masterCompanyRepo.findById(selectedCompanyId);
    if (!mastComp) {
      throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, "Company not found.", 404);
    }

    const INVOICE_PAID_ID = mongoose.Types.ObjectId(process.env.INVOICE_PAID_ID);
    const INVOICE_VOID_ID = mongoose.Types.ObjectId(process.env.INVOICE_VOID_ID);

    const invoiceDetails = await crmInvoicesHistoryRepo.model.aggregate([
      {
        $match: {
          oUserCompanyId: mongoose.Types.ObjectId(mastComp.oUsercompanyId),
          oPaymentStatus: { $nin: [INVOICE_PAID_ID, INVOICE_VOID_ID] }
        }
      },
      { $unwind: "$invoiceDetails" },
      {
        $lookup: {
          from: "leads_customer_product_details",
          localField: "invoiceDetails.oActivation_Id",
          foreignField: "_id",
          as: "customer_product"
        }
      },
      { $unwind: { path: "$customer_product", preserveNullAndEmptyArrays: true } },
      {
        $match: {
          "customer_product.oCompany_Id": mongoose.Types.ObjectId(selectedCompanyId),
          "customer_product.oProductCategory_Product_Mapping_Id": mongoose.Types.ObjectId(productId)
        }
      },
      {
        $lookup: {
          from: "leads_productcategory_product_mappings",
          localField: "customer_product.oProductCategory_Product_Mapping_Id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "mast_company_informations",
          localField: "customer_product.oCompany_Id",
          foreignField: "_id",
          as: "company"
        }
      },
      { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_categories",
          localField: "product.oCategoryID",
          foreignField: "_id",
          as: "categoryDetails"
        }
      },
      { $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_master_statuses",
          localField: "oPaymentStatus",
          foreignField: "_id",
          as: "invoiceStatus"
        }
      },
      { $unwind: { path: "$invoiceStatus", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          InvoiceNo: {
            $cond: {
              if: {
                $or: [
                  { $eq: ["$iQBInvoiceNo", null] },
                  { $eq: ["$iInvoiceNo", null] }
                ]
              },
              then: null,
              else: { $ifNull: ["$iQBInvoiceNo", "$iInvoiceNo"] }
            }
          },
          oPaymentStatus: 1,
          InvoiceDate: "$dCreateAt",
          DueDate: "$dInvoiceDueAt",
          cCompany_Name: "$company.company_name",
          email: "$company.email",
          address: "$company.address",
          address2: "$company.address2",
          phone: "$company.phone",
          cDisplayName: "$product.cDisplayName",
          product_id: "$product._id",
          qty: "$invoiceDetails.iQty",
          cValue: "$invoiceDetails.cValue",
          subTotal: "$invoiceDetails.cSubTotal",
          total: "$cTotal",
          cBalanceDue: "$cBalanceDue",
          cFileName: "$cFileName",
          cFilePath: "$cFilePath",
          categoryName: "$categoryDetails.cCategory_Name",
          categoryID: "$categoryDetails._id",
          StatusName: "$invoiceStatus.cStatus_Name",
          className: "$invoiceStatus.className",
        }
      },
      {
        $match: {
          InvoiceNo: { $ne: null }
        }
      },
      {
        $sort: {
          InvoiceDate: -1
        }
      }
    ]);

    return invoiceDetails;
  }

  async addActiveCustomerMaster(customer, token) {
    const companyInfo = await masterCompanyRepo.findById(customer.selectedCompanyId);
    const timestamp = Date.now().toString();

    const commonHeaders = {
      'Content-Type': 'application/json',
      timestamp,
    };

    const headers = {
      ...commonHeaders,
      'shared-link': 'true',
      'access-key': process.env.ACCESS_KEY,
    };

    const newCompanyDetails = {
      company_name: customer.company_name,
      address: customer.address,
      address2: customer.address2 || '',
      phone: customer.phone,
      email: customer.email,
      contact_person: customer.firstName,
      contact_person_appt: customer.lastName,
      res_short_name: customer.company_name,
      comp_short_name: customer.cCompanyCode,
      bEnableQuickBook: false,
      pin_code: customer.pin_code,
      pin: customer.pin_code,
      user_id: customer?.tokenDetails?.centralizedUserId
    };

    const companyResp = await axios.post(
      `${process.env.AUTH_URL}/company/create?timestamp=${timestamp}`,
      newCompanyDetails,
      { headers }
    );

    if (companyResp?.data?.Data) {
      const company = companyResp?.data?.Data;
      if (!company?._id) throw new Error('Company creation failed');

      if (process.env.insurservapi_commonService) {
        const insuservClient = {
          "Userid": customer?.user_id ? customer?.user_id : process.env.admin_userid,
          "companyname": customer?.company_name,
          "iIsBillable": 1,
          "shortname": customer?.company_name,
          "phoneno": customer?.phone,
          "emailid": customer?.email,
          "weblink": customer?.web,
          "pincode": customer?.pin_code,
          "FinalFile": "",
          "cityid": "",
          "firstname": customer?.firstName,
          "lastname": customer?.lastName,
          "address1": customer?.address,
          "address2": customer?.address2,
          "iCompany_id_To": companyInfo?.unifiedCompanyId,
          "cInsurServ_Customer_Name": "",
          "cFax": customer?.fax,
          "cPhone_Appt": "",
          "cEmail_Appt": "",
          "cMRC_Customer_Name": "",
          "cSignup_Email": "",
          "bBox_Storage_Required": "",
          "iscovernote": "",
          "istrackmail": "",
          "cCompany_Brand_Header": "",
          "cCompany_Brand_Footer": "",
          "eSignMailTemplate": "",
          "esignMailSubject": "",
          "flag": "",
          "iCompany_id_To_group": companyInfo?.unifiedCompanyId,
          "appid": company?._id
        };

        await axios.post(
          `${process.env.insurservapi_commonService}/savecompany`,
          insuservClient,
          {
            'Content-Type': 'application/json',
          }
        );
      }

      await masterCompanyRepo.model.findByIdAndUpdate(
        customer._id,
        { unifiedCompanyId: mongoose.Types.ObjectId(company._id) },
        { new: true }
      );

      const employeePayload = {
        opt: '1',
        empName: customer.firstName,
        sex: '',
        companyId: company._id,
        mobile: customer.phone,
        address: customer.address,
        email: customer.email,
        cityId: customer?.city_id,
        pincode: customer.pin_code,
        createdBy: customer?.tokenDetails?.centralizedUserId
      };

      const empResp = await axios.post(
        `${process.env.AUTH_URL}/users/createUserEmployee?timestamp=${timestamp}`,
        employeePayload,
        { headers }
      );

      const employee = empResp?.data?.Data;
      if (!employee?._id) throw new Error('Employee creation failed');

      const appResponse = await axios.post(
        `${process.env.AUTH_URL}/password/getDefaultAppDetails?timestamp=${timestamp}`,
        {
          companyId: customer?.tokenDetails?.selectedCompanyId ?? process.env.default_Company,
          projectName: process.env.projectName
        },
        { headers }
      );

      const appRole = appResponse?.data?.result[0];
      const userPayload = {
        loginName: customer.email,
        userType: process.env.User_Type,
        empId: customer.fromSignUp ? employee?._id : process.env.default_EmployeeId,
        superUser: process.env.Super_UserId,
        roleName: appRole?.userRole,
        addtionalRole: appRole?.userRole,
        password: process.env.DEFAULT_USER_PASSWORD,
        companyId: [company._id],
        defCompanyId: company._id,
        isFrom: "crm",
        globalUser: 1,
        isSso_user: 0,
        Doc_id: null,
        MailOption: '0',
        Update_User_id: customer?.tokenDetails?.centralizedUserId ?? null,
        reportsTo: customer?.tokenDetails?.centralizedUserId ?? null,
        createdBy: customer?.tokenDetails?.centralizedUserId ?? null,
        bActive: true,
        ipAddress: null,
        iIsTwoFactorEnabled: null,
        userEmail: customer.email,
        bStatus: 1,
        applicationData: {
          userId: '',
          app_data: [
            {
              app_id: appRole?.appId,
              role: [appRole?.appRole],
              bActive: true,
            },
          ],
          createdBy: customer?.tokenDetails?.centralizedUserId ?? null,
        },
      };

      const userResp = await axios.post(
        `${process.env.AUTH_URL}/users/createUser?timestamp=${timestamp}`,
        userPayload,
        { headers }
      );

      const userId = userResp?.data?.Data?._id;
      if (!userId) throw new Error('User creation failed');

      const previousCompanyIds = await Promise.all(
        (userResp.data.Data.companyId || []).map(async (item) => {
          const companyDoc = await masterCompanyRepo.model.findOne({ unifiedCompanyId: item });
          return {
            _id: item,
            company_name: companyDoc?.company_name || '',
          };
        })
      );

      const updatedCompanyIds = [...(userResp.data.Data.companyId || []), company._id];

      const updatedUserPayload = {
        ...userResp.data.Data,
        companyId: updatedCompanyIds,
        defCompanyId: updatedCompanyIds[0],
        roleName: appRole.userRole,
        previousCompanyId: previousCompanyIds,
        Update_User_id: customer.fromSignUp ? userId : customer?.tokenDetails?.centralizedUserId,
        externalApiCall: true,
        applicationData: {
          userId,
          app_data: [
            {
              app_id: appRole.appId,
              role: [appRole.appRole],
              bActive: true,
            },
          ],
          updatedBy: customer?.tokenDetails?.centralizedUserId,
        },
        updatedBy: customer.fromSignUp ? userId : customer?.tokenDetails?.centralizedUserId,
      };

      await axios.post(
        `${process.env.AUTH_URL}/users/updateUsers/${userId}?timestamp=${timestamp}`,
        updatedUserPayload,
        { headers }
      );

      return {
        company_id: company?._id,
        userId,
      };
    } else {
      return {
        company_id: null,
        userId: null
      };
    }
  }

  async getAllDepartmentsBactive(tokenDetails) {
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const company_Id = tokenDetails.companyId;
    const departments = await crmDepartmentRepo.model.find({ oUserCompanyId: { $in: company_Id }, bActive: true }).sort({ cDepartment: 1 });
    const filteredDepartmentsMap = new Map();

    departments.forEach(dept => {
      const name = dept.cDepartment;
      const companyId = dept.oUserCompanyId?.toString();
      const selectedId = selectedCompanyId?.toString();

      if (!filteredDepartmentsMap.has(name)) {
        filteredDepartmentsMap.set(name, dept);
      } else {
        const existing = filteredDepartmentsMap.get(name);
        const existingCompanyId = existing.oUserCompanyId?.toString();

        if (companyId === selectedId && existingCompanyId !== selectedId) {
          filteredDepartmentsMap.set(name, dept);
        }
      }
    });

    return Array.from(filteredDepartmentsMap.values());
  }

  async AddSubscriptionProduct(body, tokenDetails) {
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const loggedInUserID = tokenDetails.idofuser;
    const productsData = body.products || [];
    const companyId = selectedCompanyId;
    const activeStatus = mongoose.Types.ObjectId(process.env.COMPANY_ACTIVE);

    for (const product of productsData) {
      const prodId = mongoose.Types.ObjectId(product._id);
      const category = await LeadsProductCategoryProductMapping.findById(prodId);
      if (!category) continue;
      const statusId = (product?.FTE || product?.subscription) ? mongoose.Types.ObjectId(process.env.PRODUCT_ACTIVE) : mongoose.Types.ObjectId(process.env.COMPANY_NEWCLIENTADDED);

      const productDetails = new leadsCustomerProductDetailsRepo.model({
        oCompany_Id: companyId,
        oPortal_Id: category?.oPortalID,
        oStatus_Id: statusId,
        oCategory_Id: category?.oCategoryID,
        oProductCategory_Product_Mapping_Id: prodId,
        oUserCompany_Id: category.oUserCompanyId,
        cSoldPrice: product.price,
        iBillingFrequency: product.billingFrequency,
        bIsproductBased: product.isProductBilling,
        cCreatedBy: loggedInUserID
      });

      const savedProduct = await productDetails.save();

      if ((savedProduct && category?.bIsAutoActivate) || product?.FTE || product?.Subscription) {
        await masterCompanyRepo.model.findByIdAndUpdate(companyId, {
          oStatus_Id: activeStatus,
        });
      }
    }
  }

  async loadCustomerTransition(roleName, tokenDetails) {
    const ObjectId = mongoose.Types.ObjectId;
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const userId = tokenDetails.idofuser;
    const roleNameStr = roleName || "";

    let isAdminRole = roleNameStr.toLowerCase().includes("admin");
    let transitionIds = [];

    let customerConfig = await customerTransitionSettingRepo.model.findOne({
      type: "all_transition",
      bActive: true,
      oUserCompanyId: ObjectId(selectedCompanyId),
    });

    if (customerConfig) {
      isAdminRole = true;
    } else {
      const customerConfigs = await customerTransitionSettingRepo.model.find({
        bActive: true,
        oUserCompanyId: ObjectId(selectedCompanyId),
        "cUserRoles.users": userId,
      });

      if (customerConfigs?.length) {
        transitionIds = [
          ...new Set(
            customerConfigs.flatMap(cfg =>
              Array.isArray(cfg.transitonIds) ? cfg.transitonIds : []
            )
          )
        ];
      }
    }

    if (!isAdminRole && transitionIds.length === 0) {
      return [];
    }

    const transition_completed = await getStatusById("Transition", "transition_completed");
    const transition_new = await getStatusById("Transition", "transition_new");
    const transition_cancel = await getStatusById("Transition", "transition_cancel");
    const transition_hold = await getStatusById("Transition", "transition_hold");
    const transition_in_progress = await getStatusById("Transition", "transition_in_progress");
    const approval_pending = await getStatusById("Transition", "transition_approval_pending");

    const matchCondition = {
      "opportunity.oCompany_Id": ObjectId(selectedCompanyId),
      oStatus_Id: {
        $nin: [
          ObjectId(transition_new),
          ObjectId(transition_cancel),
          ObjectId(approval_pending),
        ],
      },
    };

    if (!isAdminRole) {
      matchCondition._id = {
        $in: transitionIds.map(id => ObjectId(id)),
      };
    }

    const pipeline = [
      { $unwind: "$opportunityDetails" },
      {
        $lookup: {
          from: "leads_opportunity_product_company_mappings",
          localField: "opportunityDetails.opportunityId",
          foreignField: "_id",
          as: "opportunity",
        },
      },
      { $unwind: { path: "$opportunity", preserveNullAndEmptyArrays: true } },
      { $match: matchCondition },
      {
        $lookup: {
          from: "phase_template_master_mappings",
          localField: "mappedPhaseTemplate_Id",
          foreignField: "_id",
          as: "mappedProcess"
        }
      },
      { $unwind: { path: "$mappedProcess", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_company_details",
          localField: "opportunity.oCompany_Id",
          foreignField: "_id",
          as: "lead_company"
        }
      },
      { $unwind: { path: "$lead_company", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "mast_company_informations",
          localField: "opportunity.oCompany_Id",
          foreignField: "_id",
          as: "mast_company",
        },
      },
      { $unwind: { path: "$mast_company", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_productcategory_product_mappings",
          localField: "opportunityDetails.productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_categories",
          localField: "product.oCategoryID",
          foreignField: "_id",
          as: "class"
        }
      },
      { $unwind: { path: "$class", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_subclasses",
          localField: "product.oSubClass",
          foreignField: "_id",
          as: "subClass"
        }
      },
      { $unwind: { path: "$subClass", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_billing_units",
          localField: "product.cBillingUnit",
          foreignField: "_id",
          as: "billingUnit"
        }
      },
      { $unwind: { path: "$billingUnit", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "crm_mast_levels",
          localField: "product.oProductLevel",
          foreignField: "_id",
          as: "crm_mast_levels"
        }
      },
      { $unwind: { path: "$crm_mast_levels", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_master_statuses",
          localField: "oStatus_Id",
          foreignField: "_id",
          as: "transition_status",
        },
      },
      { $unwind: { path: "$transition_status", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "transition_company_survey_mappings",
          localField: "_id",
          foreignField: "transitionId",
          as: "survey_details",
        },
      },
      { $unwind: { path: "$survey_details", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "useradmin_mast_users",
          localField: "transition_manager",
          foreignField: "_id",
          as: "transition_manager_details",
        },
      },
      {
        $unwind: { path: "$transition_manager_details", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "useradmin_mast_employees",
          localField: "transition_manager_details.empId",
          foreignField: "_id",
          as: "employee_details",
        },
      },
      {
        $unwind: { path: "$employee_details", preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: "$_id",
          opportunityId: { $first: "$opportunityDetails.opportunityId" },
          opportunityName: { $first: "$opportunity.cOpportunityName" },
          accountName: {
            $first: {
              $ifNull: ["$mast_company.company_name", "$lead_company.company_name"]
            }
          },
          cCompanyCode: {
            $first: {
              $ifNull: ["$mast_company.cCompanyCode", "$lead_company.cCompanyCode"]
            }
          },
          AccountId: {
            $first: {
              $ifNull: ["$mast_company._id", "$lead_company._id"]
            }
          },
          companyId: {
            $first: {
              $ifNull: ["$mast_company._id", "$lead_company._id"]
            }
          },
          products: {
            $push: {
              productId: "$opportunityDetails.productId",
              productName: "$product.cDisplayName",
              cFeaturesDesc: "$product.cFeaturesDesc",
              categoryName: "$class.cCategory_Name",
              subClassName: "$subClass.cSubClassName",
              subClassId: "$subClass._id",
              billingUnitName: "$billingUnit.cBillingUnit",
              levelName: "$crm_mast_levels.cLevels",
            }
          },
          transitionStatus: { $first: "$transition_status.cStatus_Name" },
          transitionClassName: { $first: "$transition_status.className" },
          transitionStatusId: { $first: "$transition_status._id" },
          surveyMappedId: { $first: "$survey_details._id" },
          survey_details: { $push: "$survey_details" },
          surveyResponse: { $push: "$survey_details.recipients_response" },
          dCreatedAt: { $first: "$dCreatedAt" },
          cCreatedBy: { $first: "$cCreatedBy" },
          summary: { $first: "$summary" },
          transitionNo: { $first: "$transitionNo" },
          transition_manager_name: { $first: "$employee_details.empName" },
          transition_manager_emailId: { $first: "$employee_details.email" },
          transition_manager_id: { $first: "$transition_manager_details._id" },
          mappedProcess: { $first: "$mappedProcess.cGroupName" },
          mappedProcessId: { $first: "$mappedProcess._id" },
          cTransition_Name: { $first: "$cTransition_Name" },
          userDetails: {
            $first: {
              _id: "$employee_details._id",
              empName: "$employee_details.email"
            }
          }
        }
      },
      {
        $addFields: {
          isSurvey: {
            $gt: [{ $size: { $ifNull: ["$survey_details", []] } }, 0]
          }
        }
      },
      {
        $project: {
          _id: 1,
          opportunityId: 1,
          cTransition_Name: 1,
          opportunityName: 1,
          accountName: 1,
          AccountId: 1,
          cCompanyCode: 1,
          products: 1,
          transitionStatus: 1,
          transitionClassName: 1,
          transitionStatusId: 1,
          surveyMappedId: 1,
          isSurvey: 1,
          surveyResponse: 1,
          cCreatedBy: 1,
          dCreatedAt: 1,
          transition_manager_name: 1,
          transition_manager_id: 1,
          transition_manager_emailId: 1,
          summary: 1,
          mappedProcess: 1,
          mappedProcessId: 1,
          transitionNo: 1,
          userDetails: 1,
          transition_completed: {
            $cond: {
              if: {
                $in: [
                  "$transitionStatusId",
                  [
                    mongoose.Types.ObjectId(transition_completed)
                  ]
                ]
              },
              then: true,
              else: false
            }
          },
          isHold: {
            $cond: {
              if: {
                $in: [
                  "$transitionStatusId",
                  [
                    mongoose.Types.ObjectId(transition_hold),
                  ]
                ]
              },
              then: true,
              else: false
            }
          },
          isCancel: {
            $cond: {
              if: {
                $in: [
                  "$transitionStatusId",
                  [
                    mongoose.Types.ObjectId(transition_cancel),
                  ]
                ]
              },
              then: true,
              else: false
            }
          },
          isNew: {
            $cond: {
              if: {
                $in: [
                  "$transitionStatusId",
                  [
                    mongoose.Types.ObjectId(transition_new),
                  ]
                ]
              },
              then: true,
              else: false
            }
          },
          isInProgress: {
            $cond: {
              if: {
                $in: [
                  "$transitionStatusId",
                  [
                    mongoose.Types.ObjectId(transition_in_progress),
                  ]
                ]
              },
              then: true,
              else: false
            }
          }
        }
      },
      {
        $sort: {
          dCreatedAt: -1
        }
      },
    ];

    const transitionList = await transitionPhaseTemplateValueMappingsRepo.model.aggregate(pipeline);
    return transitionList;
  }

  async getCardStatusesTransition(type) {
    const pipeline = [
      {
        $match: {
          cStatus_Type: type,
          bActive: true,
          isCustomerVisible: false,
          $or: [
            { bIsSubStatus: false },
            { bIsSubStatus: null },
            { bIsSubStatus: { $exists: false } }
          ]
        }
      },
      {
        $lookup: {
          from: "useradmin_mast_icons",
          localField: "statusIcons",
          foreignField: "_id",
          as: "statusIcons",
        },
      },
      {
        $unwind: {
          path: "$statusIcons",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          statusIcons: "$statusIcons.cssClass",
        },
      },
      {
        $sort: { iSortOrder: 1 },
      },
    ];

    return leadsActivationStatusRepo.model.aggregate(pipeline);
  }

  async loadClientProducts(tokenDetails) {
    const ObjectId = mongoose.Types.ObjectId;
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const approval_pending = await getStatusById("Transition", "transition_approval_pending");
    const transition_new = await getStatusById("Transition", "transition_new");
    const transition_cancel = await getStatusById("Transition", "transition_cancel");

    const pipeline = [
      {
        $unwind: {
          path: "$opportunityDetails",
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $lookup: {
          from: "leads_opportunity_product_company_mappings",
          localField: "opportunityDetails.opportunityId",
          foreignField: "_id",
          as: "opp_details"
        }
      },
      { $unwind: { path: "$opp_details", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "leads_productcategory_product_mappings",
          localField: "opportunityDetails.productId",
          foreignField: "_id",
          as: "prod_details"
        }
      },
      { $unwind: { path: "$prod_details", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "mast_company_informations",
          localField: "opp_details.oCompany_Id",
          foreignField: "_id",
          as: "mast_company"
        }
      },
      {
        $lookup: {
          from: "leads_company_details",
          localField: "opp_details.oCompany_Id",
          foreignField: "_id",
          as: "lead_company"
        }
      },
      {
        $addFields: {
          companyDetails: {
            $ifNull: [
              { $arrayElemAt: ["$mast_company", 0] },
              { $arrayElemAt: ["$lead_company", 0] }
            ]
          }
        }
      },
      {
        $match: {
          "companyDetails._id": ObjectId(selectedCompanyId),
          oStatus_Id: {
            $nin: [
              ObjectId(transition_new),
              ObjectId(transition_cancel),
              ObjectId(approval_pending),
            ],
          },
        }
      },
      {
        $group: {
          _id: "$_id",
          productDetails: {
            $addToSet: {
              _id: "$prod_details._id",
              cDisplayName: "$prod_details.cDisplayName"
            }
          },
          cTransition_Name: { $first: "$cTransition_Name" },
          transitionNo: { $first: "$transitionNo" },
          transitionDetails: { $first: "$transitionDetails" }
        }
      }
    ];

    const response = await transitionPhaseTemplateValueMappingsRepo.model.aggregate(pipeline);

    const uniqueTemplateIds = [
      ...new Set(
        response.flatMap(tr =>
          (tr.transitionDetails || [])
            .map(d => d?.oTemplateId?.toString())
            .filter(Boolean)
        )
      )
    ].map(id => new mongoose.Types.ObjectId(id));

    const templates = await transitionMastTemplatesRepo.model.find({
      _id: { $in: uniqueTemplateIds }
    });

    const result = response.map(item => {
      const clientAccessOptions = [];

      (item.transitionDetails || []).forEach(tr => {
        const template = templates.find(
          t => String(t._id) === String(tr.oTemplateId)
        );

        if (!template) return;

        (template.components || []).forEach(component => {
          (component.rows || []).forEach(row => {
            (row || []).forEach(col => {
              const comp = col?.components?.[0];

              if (
                comp?.key &&
                (
                  comp.key.startsWith("portal_action_") ||
                  comp.key.startsWith("kpi_portal_action_") ||
                  comp.key.startsWith("tollgate_portal_action_")
                )
              ) {
                clientAccessOptions.push(...(comp?.data?.values || []));
              }
            });
          });
        });
      });

      const roles = [
        ...new Map(
          clientAccessOptions
            .filter(opt => opt?.value?.startsWith("client_view_edit_"))
            .map(opt => [opt.value, opt])
        ).values()
      ];

      return {
        _id: item._id,
        productDetails: item.productDetails || [],
        cTransition_Name: item.cTransition_Name,
        transitionNo: item.transitionNo,
        roles,
      };
    });

    return result;
  }

  async upsertCustomerConfigration(body, tokenDetails) {
    const userId = tokenDetails.idofuser;
    const selectedCompanyId = tokenDetails.selectedCompanyId;

    if (body._id) {
      const existingConfig = await customerTransitionSettingRepo.model.findById(body._id);

      if (!existingConfig) {
        throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, "Configuration not found", 404);
      }

      existingConfig.transitonIds = body.transitonIds || existingConfig?.transitonIds;
      existingConfig.cUserRoles = body.cUserRoles || existingConfig?.cUserRoles;
      existingConfig.updatedAt = new Date();
      existingConfig.oUpdatedBy = userId;
      existingConfig.bActive = body.bActive;

      await existingConfig.save();
      return existingConfig;
    }

    const create = new customerTransitionSettingRepo.model({
      ...body,
      dCreatedAt: new Date(),
      oCreatedBy: userId,
      oUserCompanyId: selectedCompanyId
    });

    await create.save();
    return create;
  }

  async loadCustomerApproval(tokenDetails) {
    const selectedCompanyId = tokenDetails.selectedCompanyId;

    const pipeline = [
      {
        $match: {
          oUserCompanyId: new mongoose.Types.ObjectId(selectedCompanyId),
        }
      },
      {
        $lookup: {
          from: "transition_phase_template_value_mappings",
          let: {
            transitionIds: { $ifNull: ["$transitonIds", []] }
          },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", "$$transitionIds"] }
              }
            },
            {
              $project: {
                _id: 1,
                cTransition_Name: 1
              }
            }
          ],
          as: "transitions"
        }
      },
      {
        $unwind: {
          path: "$cUserRoles",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "useradmin_mast_users",
          let: {
            userIds: { $ifNull: ["$cUserRoles.users", []] }
          },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", "$$userIds"] }
              }
            },
            {
              $project: {
                _id: 1,
                loginName: 1
              }
            }
          ],
          as: "cUserRoles.userDetails"
        }
      },
      {
        $group: {
          _id: "$_id",
          type: { $first: "$type" },
          transitonIds: { $first: "$transitonIds" },
          transitions: { $first: "$transitions" },
          cUserRoles: { $push: "$cUserRoles" },
          dCreateAt: { $first: "$dCreateAt" },
          updatedAt: { $first: "$updatedAt" },
          oCreatedBy: { $first: "$oCreatedBy" },
          oUpdatedBy: { $first: "$oUpdatedBy" },
          bActive: { $first: "$bActive" },
          oUserCompanyId: { $first: "$oUserCompanyId" }
        }
      },
      {
        $project: {
          type: 1,
          transitonIds: 1,
          transitions: 1,
          cUserRoles: 1,
          dCreateAt: 1,
          updatedAt: 1,
          bActive: 1
        }
      }, {
        $sort: {
          dCreateAt: -1
        }
      }
    ];

    const result = await customerTransitionSettingRepo.model.aggregate(pipeline);
    return result ?? [];
  }

  async checkTransitionCustomerRole(transitionId, tokenDetails) {
    const selectedCompanyId = tokenDetails.selectedCompanyId;
    const userId = tokenDetails.idofuser;

    let customerRole = await customerTransitionSettingRepo.model.findOne({
      transitonIds: new mongoose.Types.ObjectId(transitionId),
      bActive: true,
      oUserCompanyId: new mongoose.Types.ObjectId(selectedCompanyId)
    });

    if (!customerRole) {
      customerRole = await customerTransitionSettingRepo.model.findOne({
        type: 'all_transition',
        bActive: true,
        oUserCompanyId: new mongoose.Types.ObjectId(selectedCompanyId)
      });
    }

    if (!customerRole) {
      throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, 'No configuration found', 404);
    }

    const matchedRoles = customerRole.cUserRoles.filter(role =>
      role.users.some(u => u.toString() === userId)
    );

    return matchedRoles;
  }
}

module.exports = new CustomerPortalService();
