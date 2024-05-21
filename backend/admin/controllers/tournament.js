const Tournament = require("../../models/tournament");


function calculateLevels(totalUsers) {
    // Validate input
    if (totalUsers <= 0) {
        throw new Error('Total number of users must be a positive integer');
    }

    // Calculate the number of levels using logarithm
    const levels = Math.ceil(Math.log2(totalUsers));

    return levels;
}


exports.createTournament = async (req,res,next)=>{
    //TODO : status,winner,players these have default values include it in database schema of tournament
    const {regStartDate,regEndDate,type,durationOfEachMatch,numberOfUserAllowed,regFee,prizeMoney,tournamentSatrtDateAndTime,eachLevelPrizeMoney} = req.body;
    console.log(tournamentSatrtDateAndTime);
    
    try {
        console.log("started creating");
        const tournament = new Tournament({
            regStartDate : new Date(regStartDate),
            regEndDate: new Date(regEndDate),
            startDateAndTime : new Date(tournamentSatrtDateAndTime) ,
            durationOfEachMatch,
            type,
            regFee:parseInt(regFee),
            prizeMoney : parseInt(prizeMoney),

            numberOfUserAllowed : parseInt(numberOfUserAllowed),
            numberOfLevels : calculateLevels(numberOfUserAllowed),
            eachLevelPrizeMoney : eachLevelPrizeMoney

        })
        console.log("done till creating");
        await tournament.save()
        console.log("done savinng");
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


exports.deleteTornament = async (req,res,next)=>{
    const {tournament_id} = req.params
    console.log(tournament_id);

    try {
        const result = await Tournament.findByIdAndDelete(tournament_id)
        if(result){
            return res.status(204).json({
                msg  : "tournament deleted successfully"
            })
        }
        else{
            return res.status(404).json({
                msg  : "not found"
            })
        }

    } catch (error) {
        console.log("error on deleting tournament",error);
        return res.status(500).json({
            msg  : "Something went wrong"
        })
    }

}

exports.updateTournament = async (req,res,next)=>{
    const { tournament_id } = req.params;
    const updateData = req.body;

  try {
    const updatedTournament = await Tournament.findByIdAndUpdate(
        tournament_id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    res.status(200).json({
        msg : "tournament updated successfully"
    });
  } catch (error) {
    console.error('Error updating tournament:', error);
    res.status(500).json({ message: 'Error updating tournament', error });
  }
}