const express = require("express")

const router = express.Router()

const adminMiddleware = require("../../utility/adminAuthenticator")
const adminnUserController = require("../controllers/user")


router.get("/getAllUsers/:page/:limit",adminMiddleware,adminnUserController.getAllUsers)


module.exports = router


