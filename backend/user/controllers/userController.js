const Tournament = require("../../models/tournament")
const User = require("../../models/user")



exports.getUserDetails = async (req,res,next)=>{
    const userId = req.params

    try {
        const user = await User.findById(userId)
        if(user){
            res.status(200).json({
                name : user.username,
                email : user.email,
                phNo : user.phoneNumber,
                aadharNumber : user.aadharNumber,
                bankDetails : user.bankDetails
            })
        }else{
            return res.status(404).json({
                msg :"User not found"
            })
        }
    } catch (error) {
        console.log("error in get user details");
        return res.status(50).json({
            msg :"Something went wrong"
        })
    }
}


exports.getAllTournaments = async (req,res,next)=>{
    try {
        const tournaments = await Tournament.find({status : "ongoing"}) || []
        res.status(200).json({
            msg :"success",
            tournaments
        })
    } catch (error) {
        console.log("error in getting tournaments ",error);
        res.status(500).json({
            msg :"Something went wrong"
        })
    }
}