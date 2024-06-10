const twilio = require('twilio');
const bcrypt = require("bcrypt");
const User = require('../../models/user');
require('dotenv').config()
const jwt = require("jsonwebtoken")
const generateJwt = require("../../utility/jwtGenerator")
const sendEmail = require("../../utility/mailSender")
const axios = require("axios")

const accountSid = process.env.TWILIO_SID;
const authToken =  process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

function calculateAge(dobString) {
    const dob = new Date(dobString);
    const currentDate = new Date();
    let age = currentDate.getFullYear() - dob.getFullYear();
    const monthDifference = currentDate.getMonth() - dob.getMonth();
    const dayDifference = currentDate.getDate() - dob.getDate();
    // Adjust age if the current date is before the birth date in the current year
    if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
      age--;
    }
  
    return age;
  }

const restricted_states = ['Telangana', 'Sikkim', 'Nagaland', 'Odisha', 'Assam', 'Arunachal Pradesh' , 'Andhra Pradesh' ]

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
            return res.status(403).json({ message: 'Phone number already registered.' });
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
        // await sendOTP(phoneNumber, otp);
        await newUser.save();

        // Send OTP via SMS

        res.status(200).json({ message: 'User signed up successfully. OTP sent.' });
    } catch (error) {
        console.error('Error signing up:', error);
        res.status(500).json({ message: 'Failed to sign up.' });
    }
};


exports.loginUser = async (req,res,next)=>{
    const { phoneNumber} = req.body;
    try {
        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(403).json({ message: 'Phone number not registered.' });
        }

        // Generate a new OTP
        const otp = generateOTP();

        // Update the OTP and OTP timestamp in the user document
        user.otp = otp;
        user.otpTimestamp = Date.now();
        await sendOTP(phoneNumber, otp);
        await user.save();

        res.status(200).json({ message: 'OTP sent successfully.' });
    } catch (error) {
        console.error('Error resending OTP:', error);
        res.status(500).json({ message: 'Failed to resend OTP.' });
    }
}


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

        res.status(200).json({ message: 'New OTP sent successfully.' });
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
            return res.status(404).json({ message: 'Phone number not registered.' });
        }

        // Check if OTP is correct
        if (user.otp !== otp) {
            return res.status(403).json({ message: 'Invalid OTP.' });
        }

        // Check if OTP is expired
        const otpAge = Date.now() - user.otpTimestamp;
        const otpValidityPeriod = 5 * 60 * 1000; // 5 minutes in milliseconds
        if (otpAge > otpValidityPeriod) {
            // OTP expired
            return res.status(403).json({ message: 'OTP expired. Please request a new OTP.' });
        }

        // OTP verification successful
        // Delete OTP and OTP timestamp from user document
        user.otp = undefined;
        user.otpTimestamp = undefined;
        await user.save();

        const userId = user._id

        const token = jwt.sign({ userId }, process.env.AUTH_SECRETE_KEY);

        res.status(200).json({ message: 'OTP verification successful' ,token,username : user.username,phNumber:user.phoneNumber,userId:user._id });
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
                msg : "Something went wrong"
            })
        }
    
    } catch (error) {
        console.log("error in verify email",error);
        return res.status(500).json({
            msg : "Something went wrong"
        })
    }

}

exports.verifyAadhar = async (req,res,next)=>{
    const {aadharNumber,consent,userId} = req.body
    // console.log(aadharNumber)
    try {
        const user = await User.findById(userId)
        console.log(user)
        // console.log(user)
        const response = await axios.post( 
            "https://api.gridlines.io/aadhaar-api/boson/generate-otp",
            {
                aadhaar_number: aadharNumber,
                consent
            },
            {
                headers: {
                    'X-Auth-Type': 'API-Key',
                    'X-API-Key': process.env.ONGRIND_KEY
                }
            }
        );

        console.log("response from aadhar",response.data,aadharNumber);

        if(response?.data.status===200 && response?.data?.data.code==='1001'){
            user.aadharNumber.number = aadharNumber
           await  user.save()
            res.status(200).json({
                msg :response?.data?.data.message,
                transaction_id :response?.data?.data.transaction_id
            })
            return
        }else{
            res.status(403).json({
                msg : response?.error?.message
            })
        }
        
    } catch (error) {
        console.log("from adhar verify",error);
        res.status(500).json({
            msg:"something went wrong"     
    })
    return 
    }
}

exports.verifyAadharOtp = async (req,res,next)=>{
    const {userId,otp,transaction_id} = req.body

    try {
        const user = await User.findById(userId)
        console.log(user);
        if (!user) {
            res.status(404).json({
                msg  : "user not found"
            })
            return 
        }
        const response = await axios.post(
            "https://api.gridlines.io/aadhaar-api/boson/submit-otp",
            {
                otp: otp,
                include_xml: true,
                share_code: "1234"
            },
            {
                headers: {
                    "X-Auth-Type": "API-Key",
                    "X-API-Key": process.env.ONGRIND_KEY,
                    "X-Transaction-ID": transaction_id,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }
        );

        // console.log("from verify aadhar otp",response.data);

        if (response?.data.status === 200 && response?.data?.data.code === '1002') {
            const aadharData = response?.data?.data.aadhaar_data 
            // console.log(response?.data?.data);
            if(calculateAge(aadharData?.date_of_birth)<18){
                return res.json({
                    statusCode : 401,
                    msg :"minor"
                })
            }else if(restricted_states.includes(aadharData?.state)){
                return res.json({
                    statusCode : 401,
                    msg :"belongs to restricted_states"
                })
            }else if(aadharData?.name?.toLowerCase()?.includes(user.username)){
                return res.json({
                    statusCode : 401,
                    msg :"name doesn't matching"
                })
            }
            else{
                const requiredObj = {
                    document_type:aadharData?.document_type ,
                    reference_id: aadharData?.reference_id,
                    name: aadharData?.name,
                    date_of_birth:aadharData?.date_of_birth ,
                    gender: aadharData?.gender,
                    house: aadharData?.house,
                    street: aadharData?.street,
                    district: aadharData?.district,
                    landmark: aadharData?.landmark,
                    post_office_name: aadharData?.post_office_name,
                    state: aadharData?.state,
                    pincode: aadharData?.pincode,
                    country: aadharData?.country,
                    vtc_name: aadharData?.vtc_name,
                }
                // console.log(requiredObj, user.aadharNumber.details,aadharData)
                user.aadharNumber.verified = true
                user.aadharNumber.details = requiredObj
                
                await user.save()

                return res.json({
                    statusCode : 200,
                    msg :"your aadhar is verified"
                })
            }
        } else {
            return res.json({
                statusCode : 403,
                msg :response?.error?.message
            })
        }

    } catch (error) {
        console.log("from aadhar otp verify",error.response.data.error);
       return  res.status(500).json({
            msg:"something went wrong"     
    })
   
    }
}


