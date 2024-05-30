const GameOne2One = require("../models/game")


const updateGameStatus = async (gameId,winnerPlayer)=>{
    const dbGame = await GameOne2One.findById(gameId);
    if (dbGame) {
      dbGame.status = "finished";
      dbGame.winner = winnerPlayer;
      await dbGame.save();
    }
}



module.exports = {
    updateGameStatus
}