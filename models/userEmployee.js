const mongoose = require('mongoose');

let collection_name = "mast_company_informations"
const employeeSchema = new mongoose.Schema({
    empCode: {
        type: String,
        maxLength: 10
    },
    empName: {
        type: String,
        required: true,
        maxLength: 100
    },
    email: {
        type: String,
        required: true
    },
    sex: {
        type: String,
        // required: true, 
        // maxLength: 1
    },
    dateOfBirth: {
        type: Date,
        required: false
    },
    dateOfJoining: {
        type: Date,
        required: false
    },
    designation: {
        type: String,
        required: false,
        maxLength: 40
    },
    deptName: {
        type: String,
        required: false,
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        // required: true,
        ref: collection_name
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    bActive: {
        type: Boolean,
        default: true,
    },

    iDesignation_id: {
        type: Number
    },
    iDept_Group_id: {
        type: Number
    },
    cEmp_DisplayDetail: {
        type: String,
        maxLength: 250
    },
    mobile: {
        type: String,
        maxLength: 50
    },
    address: {
        type: String,
        // required : true
    },
    cityId: {
        type: mongoose.Schema.Types.ObjectId,
        // required: true,
        ref: 'useradmin_mast_city'
    },
    pincode: {
        type: String,
        required: false
    },
    phone: {
        type: Number,
        // required : true
    },
    iHR_Emp_id: {
        type: Number
    },
    bconc_auth: {
        type: Number
    },
    bconc_authEmployee: {
        type: Number
    }
});

// Create the MongoDB model
const Employee = mongoose.model('useradmin_mast_employees', employeeSchema);

module.exports = Employee;
