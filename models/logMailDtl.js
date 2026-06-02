const mongoose = require('mongoose');

const mailLogSchema = new mongoose.Schema({

    from: {
        email: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        }
    },
    email: {
        type: Array,
        required: true
    },

    ccEmail: {
        type: Array,
        required: false
    },

    bccEMail: {
        type: Array,
        required: false
    },

    subject: {
        type: String,
        required: false
    },

    message: {
        type: String,
        required: false
    },

    apiBodyData: {
        type: String,
        required: false
    },

    apiResult: {
        type: String,
        required: false
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'useradmin_mast_users'
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

const mailLog = mongoose.model('mail_service_logs', mailLogSchema);

module.exports = mailLog;