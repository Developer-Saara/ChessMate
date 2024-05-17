const User = require("../../models/user")


exports.getAllUsers = async (req,res,next)=>{
    try {
        
        const page = parseInt(req.query.page) || 1; // Page number, default is 1
        const limit = parseInt(req.query.limit) || 10; // Number of users per page, default is 10
    
        // Calculate the skip value based on page number and limit
        const skip = (page - 1) * limit;
    
        // Query users with pagination
        const users = await User.find().skip(skip).limit(limit);
    
        // Count total number of users
        const totalUsers = await User.countDocuments();
    
        // Calculate total number of pages
        const totalPages = Math.ceil(totalUsers / limit);
    
        res.status(200).json({
          users,
          currentPage: page,
          totalPages,
          totalUsers
        });

    } catch (error) {
        return res.status(500).json({
            msg : 'Something went wrong',
        })
    }

}


exports.getAUser = async (req,res,next)=>{
    const userId = req.params.userId

    try {
        const user  = await User.findById(userId) 

        if(user){
            return res.status(200).json({
                msg : "success",
                user
            })
        }else{
            return res.status(404).json({
                msg : "user not found"
            })
        }

    } catch (error) {
        console.log("error in getting a user",error);
        res.status(500).json({
            msg:"Something went wrong"
        })       
    }
}