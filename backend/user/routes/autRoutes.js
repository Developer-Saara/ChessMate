const express = require("express")


const router = express.Router()

const authController = require('../controllers/authController')
const userAutheticator = require("../../utility/authMiddleWare")


router.post('/signup',authController.postSignUp)
router.post("/verifyOtp",authController.verifyOtp)
router.post("/resendOtp",authController.resendOtp)
router.post("/sendVerification",userAutheticator,authController.sendVerifyEmail)
router.get("/verify-email",userAutheticator,authController.verifyEmail)




module.exports = router 