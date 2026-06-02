const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
    bActive: {
        type: Boolean,
        default: true
    },
    dCreatedAt: {
        type: Date,
        default: Date.now,
    },
    oCompanyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "mast_company_informations",
    },
    invoiceIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "crm_invoices_histories",
    }],
    oPaymentStatus: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "leads_master_statuses",
    },
    invoiceDetails: [
        {
            product_id: {
                type: mongoose.Schema.Types.ObjectId,
                // required: true,
                ref: "leads_productcategory_product_mappings",
            },
            qty: { type: Number },
            cAmount: { type: Number },
        }
    ],
    cTotal: {
        type: Number
    },
    TransactionId: {
        type: String
    },
    Payment_Method: {
        type: String
    },
    payment_details:{
        type: mongoose.Schema.Types.Mixed,
    }
}, {
    versionKey: false
});

const PaymentHistoryDetails = mongoose.model("payment_history_details", PaymentSchema);

module.exports = PaymentHistoryDetails;
