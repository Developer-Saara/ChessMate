const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Admin = require('../models/admin');
require('dotenv').config()
const secretKey = process.env.AUTH_SCRETE_KEY; // Replace this with your actual secret key

function authenticateToken(req, res, next) {
  // Gather the JWT token from the request headers
  // console.log(req.headers.authorization);
  // const authHeader = req.headers['authorization'];
  const token = req.headers.authorization;


  // If there is no token, return an error
  if (token == null) {
    // console.log("from null");
    return res.status(401).json({
      msg : "Unautherised user"
    }); // Unauthorized
  }

  // Verify the token
  jwt.verify(token, secretKey, async (err, user) => {
    // If there is an error, return an error
    if (err) {
      // console.log("from error",err);
      return res.status(401).json({
        msg : "Unautherised user"
      }); 
    }

    const vuser = await Admin.findOne({adminId : user.adminId}) 

    if(vuser){
      req.user = user;
      next();
    }else{
      // console.log("from user no found");
      return res.status(401).json({
        msg : "Unautherised user"
      }); 
    }

  });
}

module.exports = authenticateToken;
