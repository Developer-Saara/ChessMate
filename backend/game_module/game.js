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
  gameTime
  player1Time
  player2Time
  activePlayer
  lastMoveTime
  #moveCount = 0;
  

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
      this.activePlayer = redisData?.activePlayer
      this.lastMoveTime = redisData?.lastMoveTime
    }else{
      this.chess = new Chess()
      this.board = this.chess.fen()
      this.player1 = player1;
      this.player2 = player2;
      this.player1Id = player1Id;
      this.player2Id = player2Id;
      this.moves = [];
      this.start_time = new Date();
  
      this.player1Time = 10 * 60 * 1000; // 10 minutes in milliseconds
      this.player2Time = 10 * 60 * 1000; // 10 minutes in milliseconds
      this.gameTime = 20 * 60 * 1000;    // 20 minutes in milliseconds
  
      this.activePlayer = player1Id; // Assume player 1 starts
      this.lastMoveTime = Date.now();
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
        createdAt: this.start_time, 
        gameTime : this.gameTime,
        player1Time: this.player1Time,
        player2Time : this.player2Time,
        lastMovetime : this.lastMoveTime ,
        activePlayer :this.activePlayer
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
          gameTime : this.gameTime
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
          gameTime : this.gameTime
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
        if (!gameState || gameState.status === "finished" || gameState.status === "timeout" ) {
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
      this.chess.move(move);
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
    const opponentTime = this.activePlayer === this.player2Id ? this.player2Time : this.player1Time;
    const UserTime = this.activePlayer === this.player2Id ? this.player2Time : this.player1Time;
  

    


    opponent.send(
      JSON.stringify({
        type: "move",
        move,
        color: this.activePlayer === this.player2Id ? "white" : "black",
        gameTime: this.gameTime,
        opponentTime: opponentTime,
        UserTime:UserTime
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
      lastMoveTime:this.lastMoveTime
    });
  }

  async sendGameOverMessage(result) {
    const winnerColor = this.chess.turn() === "w" ? "black" : "white";
    const winnerPlayer = this.chess.turn() === "w" ? this.player2Id : this.player1Id;

    this.player1.send(
      JSON.stringify({
        type: "game_over",
        result,
        payload: {
          winner: winnerPlayer,
          winnerColor,
        },
      })
    );

    this.player2.send(
      JSON.stringify({
        type: "game_over",
        result,
        payload: {
          winner: winnerPlayer,
          winnerColor,
        },
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

    // Remove the game from Redis
    await redisUtils.removeGame(this.gameId);
  }
}

module.exports = Game;
