const express =  require("express")

const router = express.Router()

const adminMiddleware = require("../../utility/adminAuthenticator")
const tournamnetController = require("../controllers/tournament")
const adminnUserController = require("../controllers/user")


router.get("/user/getAllUsers/:page/:limit",adminMiddleware,adminnUserController.getAllUsers)
router.get("/user/get-one-user/:userId",adminMiddleware,adminnUserController.getAUser)


router.post("/tournament/createTournament",adminMiddleware,tournamnetController.createTournament)
router.get("/tournament/get-all-tournament/:page/:limit",adminMiddleware,tournamnetController.getAllTournament)


module.exports = router