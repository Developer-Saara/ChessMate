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