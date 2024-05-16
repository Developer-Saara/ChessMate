const express =  require("express")

const router = express.Router()

const adminMiddleware = require("../../utility/adminAuthenticator")
const tournamnetController = require("../controllers/tournament")
const adminnUserController = require("../controllers/user")


router.get("/user/getAllUsers/:page/:limit",adminMiddleware,adminnUserController.getAllUsers)
router.post("/tournament/createTournament",adminMiddleware,tournamnetController.createTournament)


module.exports = router