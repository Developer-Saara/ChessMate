const Tournament = require("../../models/tournament");




exports.createTournament = async (req,res,next)=>{
    //TODO : status,winner,players these have default values include it in database schema of tournament
    const {regStartDate,regEndDate,type,durationOfEachMatch,numberOfUserAllowed,regFee,prizeMoney,tournamentSatrtDateAndTime} = req.body;
    
    try {
        const tournament = new Tournament({
            regStartDate : new Date(regStartDate),
            regEndDate: new Date(regEndDate),
            satrtDateAndTime : new Date(tournamentSatrtDateAndTime) ,
            durationOfEachMatch,
            type,
            regFee:parseInt(regFee),
            prizeMoney : parseInt(prizeMoney),
            numberOfUserAllowed : parseInt(numberOfUserAllowed)
        })
        await tournament.save()
        return res.status(201).json({
            msg : "Tournament created successfully"
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg : "Something went wrong"
        })
    }

}