const mongoose = require('mongoose');

const CRMTermsSchema = new mongoose.Schema({
  cTermName: {
    type: String,
    required: true
  },
  cTermDays: {
    type: Number,
    required: true
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
  isDefault: {
    type: Boolean,
    default: false,
  },
});

const CRMTerms = mongoose.model('crm_mast_terms', CRMTermsSchema);

module.exports = CRMTerms;
