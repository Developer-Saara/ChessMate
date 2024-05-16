const express = require("express")

const router = express.Router()


const userAutheticator = require("../../utility/authMiddleWare")
const userController = require("../controllers/userController")

router.get("/profile/getUserDetails",userAutheticator,userController.getUserDeatils)

module.exports = router