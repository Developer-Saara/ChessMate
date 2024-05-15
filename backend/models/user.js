const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    phoneNumber :{
        type : Number,
        required : true,
        unique : true
    },
    email: {
        type: String,
        unique: true
    },
    otp :{
        type :Number,
    },
    otpTimestamp:{
        type: Date,
        default : Date.now()
    },

},{timestamps : true});

// Create a model from the schema
const User = mongoose.model('User', userSchema);

module.exports = User;