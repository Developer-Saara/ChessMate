const twilio = require('twilio');
const bcrypt = require("bcrypt");
const User = require('../../models/user');
require('dotenv').config()
const jwt = require("jsonwebtoken")
const generateJwt = require("../../utility/jwtGenaerator")
const sendEmail = require("../../utility/mailSender")

const accountSid = process.env.TWILIO_SID;
const authToken =  process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const users = {};

const generateOTP = () => Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');

// Send OTP via SMS
const sendOTP = (phoneNumber, otp) => {
    return client.messages.create({
        body: `Your OTP for signup is: ${otp}`,
        to: phoneNumber,
        from: process.env.TWILIO_PHONE_NUMBER
    });
};


exports.postSignUp = async (req, res, next) => {
    const { phoneNumber, username} = req.body;

    try {
        // Check if the phone number is already registered
        const existingUser = await User.findOne({ phoneNumber });
        if (existingUser) {
            return res.status(400).json({ message: 'Phone number already registered.' });
        }

        // Generate OTP
        const otp = generateOTP();

    

        // Save the user to the database
        const newUser = new User({
            phoneNumber,
            username,
            otp : otp.toString(),
            otpTimestamp : Date.now()
        });
        await sendOTP(phoneNumber, otp);
        await newUser.save();

        // Send OTP via SMS

        res.json({ message: 'User signed up successfully. OTP sent.' });
    } catch (error) {
        console.error('Error signing up:', error);
        res.status(500).json({ message: 'Failed to sign up.' });
    }
};


exports.resendOtp = async (req, res, next) => {
    const { phoneNumber } = req.body;

    try {
        // Find the user by phone number
        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(400).json({ message: 'Phone number not registered.' });
        }

        // Generate a new OTP
        const otp = generateOTP();

        // Update the OTP and OTP timestamp in the user document
        user.otp = otp;
        user.otpTimestamp = Date.now();
        await sendOTP(phoneNumber, otp);
        await user.save();

        // Send the new OTP via SMS

        res.json({ message: 'New OTP sent successfully.' });
    } catch (error) {
        console.error('Error resending OTP:', error);
        res.status(500).json({ message: 'Failed to resend OTP.' });
    }
};



exports.verifyOtp = async (req, res, next) => {
    const { phoneNumber, otp } = req.body;

    try {
        // Find the user by phone number
        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(400).json({ message: 'Phone number not registered.' });
        }

        // Check if OTP is correct
        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        // Check if OTP is expired
        const otpAge = Date.now() - user.otpTimestamp;
        const otpValidityPeriod = 5 * 60 * 1000; // 5 minutes in milliseconds
        if (otpAge > otpValidityPeriod) {
            // OTP expired
            return res.status(400).json({ message: 'OTP expired. Please request a new OTP.' });
        }

        // OTP verification successful
        // Delete OTP and OTP timestamp from user document
        user.otp = undefined;
        user.otpTimestamp = undefined;
        await user.save();

        const userId = user._id

        const token = jwt.sign({ userId }, process.env.AUTH_SCRETE_KEY);

        res.json({ message: 'OTP verification successful. Signup complete!' ,token,username : user.username,phNumber:user.phoneNumber });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ message: 'Failed to verify OTP.' });
    }
};



exports.sendVerifyEmail = (req,res,next)=>{
    const {userId,email} = req.body
    
    const token = generateJwt({userId,email},5)

    const verificationLink = `http://localhost/user/auth/verify?token=${token}`;
    const body = `Click <a href="${verificationLink}">here</a> to verify your email.`

    try {
        const result = sendEmail(email,"Verify your email",body)
        if(result){
           return  res.status(200).json({
                msg : "Email sent successfully"
            })
        }else{
            return  res.status(500).json({
                msg : "Something went wrong"
            })
        }

    } catch (error) {
        console.log("log from email sending",error);
        return  res.status(500).json({
            msg : "Something went wrong"
        })
    }
}


exports.verifyEmail = async (req,res,next)=>{
    const userDetails = req.user
    
    try {
        const user = await User.findById(userDetails.userId)
        if (user) {
            user.email= userDetails.email

            await user.save()

            return res.status(201).json({
                msg : "Email verified successfully"
            })
        }else{
            return res.status(500).json({
                msg : "Somthing went wrong"
            })
        }
    
    } catch (error) {
        console.log("error in verify email",error);
        return res.status(500).json({
            msg : "Somthing went wrong"
        })
    }

}