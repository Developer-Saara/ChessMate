const express = require("express")


const router = express.Router()

const authController = require('../controllers/authController')
const userAutheticator = require("../../utility/authMiddleWare")


router.post('/signup',authController.postSignUp)
router.post("/login",authController.loginUser)
router.post("/verifyOtp",authController.verifyOtp)
router.post("/resendOtp",authController.resendOtp)
router.post("/sendVerification",userAutheticator,authController.sendVerifyEmail)
router.get("/verify-email",userAutheticator,authController.verifyEmail)
router.post("/verify-aadhar",authController.verifyAadhar)
router.post("/verify-aadhar-otp",authController.verifyAadharOtp)




module.exports = router 