const express =  require("express")

const router = express.Router()

const adminMiddleware = require("../../utility/adminAuthenticator")
const tournamnetController = require("../controllers/tournament")

router.post("/createTournament",adminMiddleware,tournamnetController.createTournament)


module.exports = router;