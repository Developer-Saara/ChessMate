const jwt = require('jsonwebtoken');
require('dotenv').config()
const secretKey = process.env.AUTH_SECRETE_KEY; // Replace this with your actual secret key

function authenticateToken(req, res, next) {
  // Gather the JWT token from the request headers
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // If there is no token, return an error
  if (token == null) {
    return res.sendStatus(401); // Unauthorized
  }

  // Verify the token
  jwt.verify(token, secretKey, (err, user) => {
    // If there is an error, return an error
    if (err) {
      return res.sendStatus(403); // Forbidden
    }

    // If the token is valid, attach the user object to the request
    req.user = user;
    next(); // Proceed to the next middleware or route handler
  });
}

module.exports = authenticateToken;
