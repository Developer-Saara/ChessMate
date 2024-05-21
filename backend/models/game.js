const  mongoose = require("mongoose")

const gameSchema = new mongoose.Schema({
    // //temp users
    // player1:{
    //   type:Number,
      // required : true
    // },
    // player2:{
    //   type:Number,
    //   // required : true
    // },
    winner:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'User'
    },

    player1: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to player 1
    player2: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to player 2
    board: [{Object}], // Represents the chessboard with piece positions
    status: { type: String, enum: ['ongoing', 'finished',"timeout"], default: 'ongoing' }, // Game status
    createdAt: { type: Date, default: Date.now }, // Timestamp of game creation
  });


const GameOne2One = mongoose.model('GameOne2One', gameSchema);

module.exports = GameOne2One;