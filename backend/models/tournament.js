const mongoose = require("mongoose")

const tournamentSchema = new mongoose.Schema({
    regStartDate:{
        type : Date,
        required : true
    },
    regEndDate : {
        type : Date,
        required:true,
    },
    satrtDateAndTime : {
        type : Date,
        required : true
    },
    durationOfEachMatch:{
        type : String,
        default : "10min"
    },
    type :{
        type: String,
        enum : ["daily","monthly","weekly"],
        required : true
    },
    status :{
        type :String,
        enum :["upcoming","ongoing","completed"],
        default :"upcoming"
    },
    regFee :{
        type : Number,
        required : true
    },
    prizeMoney:{
        type : Number,
        required : true
    },
    numberOfUserAllowed:{
        type : Number,
        required : true
    },
    winner:{
        type: mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
    regPlayes : {
        type : [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        default: []
    }

});

const Tournament = mongoose.model("Tornaments",tournamentSchema)


module.exports = Tournament;