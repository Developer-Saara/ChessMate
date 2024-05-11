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
    password: {
        type: String,
        required: true
    },
    
},{timestamps});

// Create a model from the schema
const User = mongoose.model('User', userSchema);

module.exports = User;