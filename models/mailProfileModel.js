const mongoose = require('mongoose');

const mailProfileSchema = new mongoose.Schema({

    profileName : {
        type : String,
        required : true
    },

    fromEmail : {
        type : String
    },

    sendGirdKey : {
        type : String
    },

    remarks : {
        type : String
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },

    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

const mailProfile = mongoose.model('useradmin_mail_profile', mailProfileSchema);

module.exports = mailProfile;