const express = require("express")

const router = express.Router()


const userAuthenticator = require("../../utility/authMiddleWare")
const userController = require("../controllers/userController")


router.get("/profile/getUserDetails/:",userAuthenticator,userController.getUserDetails)
router.get("/getAllTournaments",userController.getAllTournaments)


module.exports = router