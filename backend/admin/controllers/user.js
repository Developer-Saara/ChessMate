const User = require("../../models/user")


exports.getAllUsers = async (req,res,next)=>{
    try {
        
        const users = await User.find();

        if (users){
            return res.status(200).json({
                msg : 'success',
                users
            })
        }else{
            return res.status(200).json({
                msg : 'success',
                users : []
            })
        }

    } catch (error) {
        return res.status(500).json({
            msg : 'Something went wrong',
        })
    }

}