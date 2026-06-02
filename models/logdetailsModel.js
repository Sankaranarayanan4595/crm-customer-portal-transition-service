const mongoose = require('mongoose');

const logDetailsSchema = new mongoose.Schema({   
    userId : {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "useradmin_mast_users" 
    },
    sessionId : {
        type : String,
        required : true
    },
    ipAddress : {
        type : String,
    },
    macId : {
        type : String
    },
    remarks : {
        type : String
    },
    active: {
        type: Boolean,
        default : true
    },
    loginTime : {
        type: Date,
        default: Date.now, 
    },
    logoutTime : {
        type: Date,
        required: true
    },
    createdAt : {
        type: Date,
        default: Date.now
    },
    updatedAt : {
        type: Date,
        default: Date.now 
    }
});

const logDetail = mongoose.model('useradmin_sessionlogs', logDetailsSchema);

module.exports = logDetail;
