const Tournament = require("../../models/tournament");


function calculateLevels(totalUsers) {
    // Maximum number of users per level (e.g., 2 users per match)
    const usersPerMatch = 2;

    // Calculate the number of levels
    let levels = 0;
    let remainingUsers = totalUsers;
    
    while (remainingUsers > 0) {
        remainingUsers = Math.ceil(remainingUsers / usersPerMatch);
        levels++;
    }
    
    return levels;
}


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
            numberOfUserAllowed : parseInt(numberOfUserAllowed),
            numberOfLevels : calculateLevels(numberOfUserAllowed)
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

exports.getAllTournament = async (req,res,next)=>{
    try {
        const page = parseInt(req.query.page) || 1; // Page number, default is 1
        const limit = parseInt(req.query.limit) || 10; // Number of users per page, default is 10
    
        // Calculate the skip value based on page number and limit
        const skip = (page - 1) * limit;
    
        // Query users with pagination 
        const tournaments = await Tournament.find().skip(skip).limit(limit); // for users exclude sensitive info 
    
        // Count total number of users
        const totalTournaments = await Tournament.countDocuments();
    
        // Calculate total number of pages
        const totalPages = Math.ceil(totalTournaments / limit);

       res.status(200).json({
            tournaments,
            currentPage: page,
            totalPages,
            totalTournaments
          });
    } catch (error) {
        return res.status(500).json({
            msg : 'Something went wrong',
        })
    }
}