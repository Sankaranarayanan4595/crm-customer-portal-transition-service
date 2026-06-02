const mongoose = require('mongoose');

const CRMTaxesSchema = new mongoose.Schema({
  cTaxName: {
    type: String,
    required: true
  },
  cTaxPercentage: {
    type: String,
    required: true
  },
  oTaxType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "crm_mast_taxtypes",
    required: true,
  },
  dCreateAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },  
  bActive: {
    type: Boolean,
    default: true,
  },
  oUserCompanyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "mast_company_informations",
    required: true,
  },
});

const CRMTaxes = mongoose.model('crm_mast_taxes', CRMTaxesSchema);

module.exports = CRMTaxes;
