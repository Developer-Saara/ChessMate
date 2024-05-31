const express =  require("express")

const router = express.Router()

const adminMiddleware = require("../../utility/adminAuthenticator")
const tournamentController = require("../controllers/tournament")
const adminnUserController = require("../controllers/user")


router.get("/user/getAllUsers/:page/:limit",adminMiddleware,adminnUserController.getAllUsers)
router.get("/user/get-one-user/:userId",adminMiddleware,adminnUserController.getAUser)


router.post("/tournament/createTournament",adminMiddleware,tournamentController.createTournament)
router.get("/tournament/get-all-tournament/:page/:limit",adminMiddleware,tournamentController.getAllTournament)
router.delete("/tournament/delete/:tournament_id",adminMiddleware,tournamentController.deleteTornament)
router.put("/tournament/update/:tournament_id",adminMiddleware,tournamentController.updateTournament)


module.exports = router