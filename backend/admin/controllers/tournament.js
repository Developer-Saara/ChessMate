



exports.createTournament = async (req,res,next)=>{
    //TODO : status,winner,players these have default values include it in database schema of tournament
    const {regStartDate,regEndDate,type,durationOfEachMatch,usersAllowed,regFee,prizeMoney,tournamentSatrtDateAndTime} = req.body;
}