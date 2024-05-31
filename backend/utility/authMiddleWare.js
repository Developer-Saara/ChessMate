const jwt = require('jsonwebtoken');
const User = require('../models/user');
require('dotenv').config()
const secretKey = process.env.AUTH_SCRETE_KEY; // Replace this with your actual secret key

// console.log(secretKey);

function authenticateToken(req, res, next) {
  // Gather the JWT token from the request headers
  // const authHeader = req.headers['authorization'];
  const token = req.headers.authorization;

  // If there is no token, return an error
  if (token == null) {
    return res.status(401).json({
      msg : "Unauthorized user"
    }); // Unauthorized
  }

  // Verify the token
  jwt.verify(token, secretKey, async (err, user) => {
    // If there is an error, return an error
    if (err) {
      return res.status(401).json({
        msg : "Unauthorized user"
      }); 
    }
    // console.log(user);
    const vuser = await User.findById(user.userId) 

    if(vuser){
      req.user = user;
      next();
    }else{
      return res.status(401).json({
        msg : "Unauthorized user"
      }); 
    }

  });
}

module.exports = authenticateToken;
