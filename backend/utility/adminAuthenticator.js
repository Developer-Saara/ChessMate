const jwt = require('jsonwebtoken');
const User = require('../models/user');
require('dotenv').config()
const secretKey = process.env.AUTH_SECRETE_KEY; // Replace this with your actual secret key

function authenticateToken(req, res, next) {
  // Gather the JWT token from the request headers
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // If there is no token, return an error
  if (token == null) {
    return res.status(401).json({
      msg : "Unautherised user"
    }); // Unauthorized
  }

  // Verify the token
  jwt.verify(token, secretKey, async (err, user) => {
    // If there is an error, return an error
    if (err) {
      return res.status(401).json({
        msg : "Unautherised user"
      }); 
    }

    const vuser = await User.findById(user.adminId) 

    if(vuser){
      req.user = user;
      next();
    }else{
      return res.status(401).json({
        msg : "Unautherised user"
      }); 
    }

  });
}

module.exports = authenticateToken;
