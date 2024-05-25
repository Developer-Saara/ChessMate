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
    },
    aadharNumber : {
       number  : {type : Number,default : null},
       verified : {type : Boolean,default : false}
    },
    bankDetails : {
        acNumber : {type : Number , default : null},
        ifsc : {type: String , default : null}
    },
    otp :{
        type :String,
    },
    otpTimestamp:{
        type: Date,
    },

},{timestamps : true});

// Create a model from the schema
const User = mongoose.model('User', userSchema);

module.exports = User;