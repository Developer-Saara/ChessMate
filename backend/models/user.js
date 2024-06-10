const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: Number,
        required: true,
        unique: true
    },
    email: {
        type: String,
    },
    aadharNumber: {
        number: {
            type: Number,
            default: null
        },
        verified: {
            type: Boolean,
            default: false
        },
        details: {
            type : Object
        }
    },
    bankDetails: {
        acNumber: {
            type: Number,
            default: null
        },
        ifsc: {
            type: String,
            default: null
        }
    },
    otp: {
        type: String,
    },
    otpTimestamp: {
        type: Date,
    },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
