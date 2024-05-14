const express = require("express")


const router = express.Router()

const authControllers = require("../controllers/authControllers")


router.post("/login",authControllers.adminLogin)
router.post("/changepassword",authControllers.changePassword)

module.exports = router