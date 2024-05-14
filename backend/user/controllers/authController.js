const twilio = require('twilio');
const bcrypt = require("bcrypt")
require('dotenv').config()

/*
TODO: configure twilio
const accountSid = 'YOUR_TWILIO_ACCOUNT_SID';
const authToken = 'YOUR_TWILIO_AUTH_TOKEN';
const client = twilio(accountSid, authToken);
*/

const users = {};

const generateOTP = () => Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');

// Send OTP via SMS
const sendOTP = (phoneNumber, otp) => {
    return client.messages.create({
        body: `Your OTP for signup is: ${otp}`,
        to: phoneNumber,
        from: 'YOUR_TWILIO_PHONE_NUMBER'
    });
};


exports.postSignUp = async (req,res,next)=>{
    const { phoneNumber, username, password } = req.body;

    console.log(password,phoneNumber,username);

    try {
        // Check if the phone number is already registered
    if (users[phoneNumber]) {
        return res.status(400).json({ message: 'Phone number already registered.' });
    }

    // Generate OTP
    const otp = generateOTP();

    const salt = await bcrypt.genSalt(10)

    const hashedPassWord = await bcrypt.hash(password,salt)

    // Save the OTP in memory (You should use a database in a real-world scenario)
    users[phoneNumber] = { otp, timestamp: Date.now(),password:hashedPassWord,username};;

    // Send OTP via SMS
    sendOTP(phoneNumber, otp)
        .then(() => {
            res.json({ message: 'OTP sent successfully.' });
        })
        .catch(err => {
            console.error('Error sending OTP:', err);
            res.status(500).json({ message: 'Failed to send OTP.' });
        });

    } catch (error) {
        console.error('Error signup:', error);
        res.status(500).json({ message: 'Failed to signup.' });
    }

}

exports.verifyOtp = (req,res,next)=>{
    const { phoneNumber, otp } = req.body;

    // Check if OTP exists for the given phone number 
    if (!users[phoneNumber]) {
        return res.status(400).json({ message: 'Phone number not registered.' });
    }

    const { otp: savedOTP, timestamp } = users[phoneNumber];

    // Check if OTP is correct
    if (savedOTP === otp) {
        // Check if OTP is expired (more than 5 minutes old)
        const otpAge = Date.now() - timestamp;
        const otpValidityPeriod = 5 * 60 * 1000; // 5 minutes in milliseconds
        if (otpAge <= otpValidityPeriod) {
            // OTP verification successful and within validity period
            //TODO : save details in database and delete in memory user with this phonenumber
            //* WE will get the userid after saving the details of user in database
            //TODO : const token = jwt.sign({ userId }, process.env.AUTH_SCRETE_KEY, { expiresIn: '1h' });
            res.json({ message: 'OTP verification successful. Signup complete!' });
        } else {
            // OTP expired
            res.status(400).json({ message: 'OTP expired. Please request a new OTP.' });
        }
    } else {
        // Invalid OTP
        res.status(400).json({ message: 'Invalid OTP.' });
    }
}