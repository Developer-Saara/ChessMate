const jwt = require("jsonwebtoken")
require("dotenv").config()


const secret = process.env.AUTH_SECRETE_KEY


const generateJwt = (payload,expiresIn)=>{
    const expirationTimeInSeconds = expiresIn ? expiresIn * 60 : null;
    const options = {
        algorithm: 'HS256',
        expiresIn: expirationTimeInSeconds // Set expiresIn only if it's provided
      };
    try {
        const token = jwt.sign(payload,secret,options)
        return token
    } catch (error) {
        console.log(error);
        return 
    }
}


module.exports = generateJwt