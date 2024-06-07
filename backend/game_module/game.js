const { Chess } = require("chess.js");
const redisUtils = require('../utility/redisOperations'); // Adjust the path as needed
const GameOne2One = require("../models/game");

class Game {
  gameId;
  player1;
  player2;
  player1Id;
  player2Id;
  moves;
  chess
  board;
  start_time;
  status
  gameTime
  player1Time
  player2Time
  activePlayer
  lastMoveTime
  player1Points = 0;// track points 
  player2Points = 0;
  player1CapturedPieces = [];// track piece removed 
  player2CapturedPieces = [];
  #moveCount = 0;
  
  static pieceValues = {
    p: 1, // Pawn
    n: 3, // Knight
    b: 3, // Bishop
    r: 5, // Rook
    q: 9, // Queen
    k: 0  // King (capturing the king ends the game)
  };

  constructor(player1, player1Id, player2, player2Id, redisData,gameId) {
    
    if(redisData && gameId ){
      this.chess = new Chess(redisData?.board)
      this.board = this.chess.fen()
      this.gameId = gameId
      this.player1 = player1;
      this.player2 = player2;
      this.player1Id = player1Id;
      this.player2Id = player2Id;
      this.#moveCount = redisData?.moves?.length
      this.start_time = redisData?.createdAt
      this.player1Time = redisData?.player1Time
      this.player2Time = redisData?.player2Time
      this.gameTime = redisData?.gameTime
      this.moves =redisData?.moves
      this.status = redisData?.status
      this.activePlayer = redisData?.activePlayer;
      this.lastMoveTime = redisData?.lastMoveTime
      this.player1Points = redisData?.player1Points || 0;
      this.player2Points = redisData?.player2Points || 0;
      this.player1CapturedPieces = redisData?.player1CapturedPieces || [];
      this.player2CapturedPieces = redisData?.player2CapturedPieces || [];
    }else{
      this.chess = new Chess()
      this.board = this.chess.fen()
      this.player1 = player1;
      this.player2 = player2;
      this.player1Id = player1Id;
      this.player2Id = player2Id;
      this.moves = [];
      this.start_time = new Date();
      this.status = "ongoing"
  
      this.player1Time = 10 * 60 * 1000; // 10 minutes in milliseconds
      this.player2Time = 10 * 60 * 1000; // 10 minutes in milliseconds
      this.gameTime = 20 * 60 * 1000;    // 20 minutes in milliseconds
  
      this.activePlayer = player1Id; // Assume player 1 starts
      this.lastMoveTime = Date.now();
      this.player1Points = 0;
      this.player2Points = 0;
      this.player1CapturedPieces = [];
      this.player2CapturedPieces = [];
    }
  }

  async initializeGame() {
    try {
      const newGame = new GameOne2One({
        player1: this.player1Id,
        player2: this.player2Id,
        status: "ongoing",
        board: this.board,
        createdAt: this.start_time
      });

      const savedGame = await newGame.save();
      this.gameId = savedGame._id.toHexString();

      // Save initial game state to Redis
      await redisUtils.saveGameData(this.gameId, {
        gameId:this.gameId,
        player1: this.player1Id,
        player2: this.player2Id,
        status: "ongoing",
        board: this.chess.fen(), 
        moves: this.moves,
        turn : this.chess.turn(),
        activePlayer : this.activePlayer,
        createdAt: this.start_time, 
        gameTime : this.gameTime,
        player1Time: this.player1Time,
        player2Time : this.player2Time,
        lastMovetime : this.lastMoveTime,
        player1Points: this.player1Points,
        player2Points: this.player2Points,
        player1CapturedPieces: this.player1CapturedPieces,
        player2CapturedPieces: this.player2CapturedPieces
      });

      this.player1.send(
        JSON.stringify({
          type: "init_game",
          payload: {
            color: "white",
          },
          gameId: this.gameId,
          userId: this.player1Id,
          opponentId : this.player2Id,
          player1Time: this.player1Time,
          player2Time : this.player2Time,
          gameTime : this.gameTime,
          player1Points: this.player1Points,
        player2Points: this.player2Points,
        player1CapturedPieces: this.player1CapturedPieces,
        player2CapturedPieces: this.player2CapturedPieces
        })
      );

      this.player2.send(
        JSON.stringify({
          type: "init_game",
          payload: {
            color: "black",
          },
          gameId: this.gameId,
          userId: this.player2Id,
          opponentId : this.player1Id,
          player1Time: this.player1Time,
          player2Time : this.player2Time,
          gameTime : this.gameTime,
          player1Points: this.player1Points,
        player2Points: this.player2Points,
        player1CapturedPieces: this.player1CapturedPieces,
        player2CapturedPieces: this.player2CapturedPieces
        })
      );

      // this.updateBoardInterval();
    } catch (error) {
      console.error("Error initializing game:", error);
    }
  }

  async updateBoardInterval() {
    this.intervalId = setInterval(async () => {
      try {
        const gameState = await redisUtils.getGameState(this.gameId);

        // Check if the game is over
        if (!gameState || gameState?.status === "finished" || gameState?.status === "timeout" ) {
          clearInterval(this.intervalId);
          console.log("Board update interval stopped because the game is over");
          return;
        }

        // Update the board state
        gameState.board = this.chess.fen();

        // Save the updated game state to Redis
        await redisUtils.saveGameState(this.gameId, gameState);

        console.log("Board updated successfully");
      } catch (error) {
        console.error("Error updating board:", error);
      }
    }, 60000);
  }

  hasExceededTimeLimit() {
    const currentTime = new Date();
    const elapsedTime = currentTime - this.start_time;
    const timeLimit = 20 * 60 * 1000; // 20 minutes in milliseconds TODO: have change dynamically according to game type
    return elapsedTime > timeLimit;
  }

  async makeMove(socket, move) {
    const currentTime = Date.now();
    const timeSpent = currentTime - this.lastMoveTime;
    
      console.log("player1time",this.player1Time);
      console.log("player2time",this.player2Time);
      console.log("game",this.gameTime);
      console.log("game",timeSpent);
      
    if (this.#moveCount % 2 === 0 &&  socket !== this.player1) {
      socket.send(JSON.stringify({
        type: "not_your_turn"
      }))
      return;
    }
    if (this.#moveCount % 2 === 1 &&  socket !== this.player2) {
      socket.send(JSON.stringify({
        type: "not_your_turn"
      }))
      return;
    }


    try {
      const moveResult = this.chess.move(move);
      if (moveResult.captured) {
        const capturedValue = Game.pieceValues[moveResult.captured.toLowerCase()];
        const capturedPiece = { piece: moveResult.captured, color: moveResult.color === 'w' ? 'b' : 'w' };
        if (this.activePlayer === this.player1Id) {
          this.player1Points += capturedValue;
          this.player2CapturedPieces.push(capturedPiece);
        } else {
          this.player2Points += capturedValue;
          this.player1CapturedPieces.push(capturedPiece);
        }
      }
      this.moves.push(move);
      
    } catch (error) {
      console.log(error);
      return;
    }

    if (this.activePlayer === this.player1Id) {
      this.player1Time -= timeSpent;
      this.activePlayer = this.player2Id;
    } else {
      this.player2Time -= timeSpent;
      this.activePlayer = this.player1Id;
    }
   
    this.lastMoveTime = currentTime;
    this.gameTime -= timeSpent;
  
    // Check if any timer has run out
    if (this.player1Time <= 0 || this.player2Time <= 0 || this.gameTime <= 0) {
      await this.sendGameOverMessage('timeout');
      return;
    }

    if (this.chess.isCheckmate()) {
      this.sendGameOverMessage('checkmate');
      return;
    }

    if (this.chess.isThreefoldRepetition() || this.chess.isInsufficientMaterial() || this.chess.isDraw()) {
      this.sendGameOverMessage('draw');
      return;
    }

    if (this.chess.isStalemate()) {
      this.sendGameOverMessage('stalemate');
      return;
    }

    const opponent = this.activePlayer === this.player2Id ? this.player2 : this.player1;
    const activePlayer = this.activePlayer === this.player2Id ? this.player1 : this.player2
    const opponentTime = this.activePlayer === this.player2Id ? this.player2Time : this.player1Time;
  

    activePlayer.send(JSON.stringify({
      type:"update_score",
      player1Points:this.player1Points,
      player2Points:this.player2Points,
      player1CapturedPieces: this.player1CapturedPieces,
      player2CapturedPieces: this.player2CapturedPieces
    }))


    opponent.send(
      JSON.stringify({
        type: "move",
        move,
        color: this.activePlayer === this.player2Id ? "white" : "black",
        gameTime: this.gameTime,
        opponentTime: opponentTime,
        player1Points: this.player1Points,
        player2Points: this.player2Points,
        player1CapturedPieces: this.player1CapturedPieces,
        player2CapturedPieces: this.player2CapturedPieces
      })
    );

    this.#moveCount++;
    await redisUtils.saveGameData(this.gameId, {
      gameId:this.gameId,
      player1: this.player1Id,
      player2: this.player2Id,
      status: "ongoing",
      board: this.chess.fen(),
      moves: this.moves,
      turn : this.chess.turn(),
      createdAt: this.start_time,
      gameTime : this.gameTime,
      player1Time: this.player1Time,
      player2Time : this.player2Time,
      activePlayer : this.activePlayer,
      lastMoveTime:this.lastMoveTime,
      player1Points: this.player1Points,
      player2Points: this.player2Points,
      player1CapturedPieces: this.player1CapturedPieces,
      player2CapturedPieces: this.player2CapturedPieces
    });
  }

  async sendGameOverMessage(result) {
    const winnerColor = this.chess.turn() === "w" ? "black" : "white";
    const winnerPlayer = this.chess.turn() === "w" ? this.player2Id : this.player1Id;

    if (result === 'draw') {
      // Determine winner by points in case of a draw
      if (this.player1Points > this.player2Points) {
        winnerPlayer = this.player1Id;
      } else if (this.player2Points > this.player1Points) {
        winnerPlayer = this.player2Id;
      } else {
        // If points are equal, it's a tie
        winnerPlayer = null;
      }
    }

    this.player1.send(
      JSON.stringify({
        type: "game_over",
        result,
        payload: {
          winner: winnerPlayer,
          winnerColor,
          player1Points: this.player1Points,
          player2Points: this.player2Points
        }
      })
    );

    this.player2.send(
      JSON.stringify({
        type: "game_over",
        result,
        payload: {
          winner: winnerPlayer,
          winnerColor,
          player1Points: this.player1Points,
          player2Points: this.player2Points
        }
      })
    );
    //TODO : check its ok to not update in redis 
    // await redisUtils.updateGameStatus(this.gameId, "finished");
    // await redisUtils.updateGameWinner(this.gameId, winnerPlayer);
5
    // Update the status in MongoDB
    const dbGame = await GameOne2One.findById(this.gameId);
    if (dbGame) {
      dbGame.status = "finished";
      dbGame.winner = winnerPlayer;
      await dbGame.save();
    }

    this.status = "finished"
    
    // Remove the game from Redis
    await redisUtils.removeGame(this.gameId);
  }
}

module.exports = Game;
