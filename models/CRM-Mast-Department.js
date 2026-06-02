const mongoose = require('mongoose');

const CRMDepartmentSchema = new mongoose.Schema({
  cDepartment: {
    type: String,
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
});

const CRMDepartment = mongoose.model('crm_mast_departments', CRMDepartmentSchema);

module.exports = CRMDepartment;
