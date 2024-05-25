const { Chess } = require("chess.js");
const redisUtils = require('../utility/redisOperations'); // Adjust the path as needed
const GameOne2One = require("../models/game");

class Game {
  gameId;
  player1;
  player2;
  player1Id;
  player2Id;
  #moves;
  #board;
  #start_time;
  #moveCount = 0;

  constructor(player1, player1Id, player2, player2Id) {
    this.player1 = player1;
    this.player2 = player2;
    this.player1Id = player1Id;
    this.player2Id = player2Id;
    this.#board = new Chess();
    this.#moves = [];
    this.#start_time = new Date();

    this.initializeGame();
  }

  async initializeGame() {
    try {
      const newGame = new GameOne2One({
        player1: this.player1Id,
        player2: this.player2Id,
        status: "ongoing",
        board: this.#board,
        createdAt: this.#start_time
      });

      const savedGame = await newGame.save();
      this.gameId = savedGame._id;

      // Save initial game state to Redis
      await redisUtils.saveGameState(this.gameId, {
        player1: this.player1Id,
        player2: this.player2Id,
        status: "ongoing",
        board: this.#board.fen(),
        moves: this.#moves,
        createdAt: this.#start_time
      });

      this.player1.send(
        JSON.stringify({
          type: "init_game",
          payload: {
            color: "white",
          },
          gameId: this.gameId,
          userId: this.player1Id,
          opponentId : this.player2Id
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
          opponentId : this.player1Id
        })
      );

      this.updateBoardInterval();
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
        gameState.board = this.#board.fen();

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
    const elapsedTime = currentTime - this.#start_time;
    const timeLimit = 20 * 60 * 1000; // 20 minutes in milliseconds TODO: have change dynamically according to game type
    return elapsedTime > timeLimit;
  }

  async makeMove(socket, move) {
    if (this.#moveCount % 2 === 0 && socket !== this.player1) {
      socket.send(JSON.stringify({
        type: "not_your_turn"
      }))
      return;
    }
    if (this.#moveCount % 2 === 1 && socket !== this.player2) {
      socket.send(JSON.stringify({
        type: "not_your_turn"
      }))
      return;
    }
    try {
      this.#board.move(move);
      this.#moves.push(move);
      await redisUtils.saveGameState(this.gameId, {
        player1: this.player1Id,
        player2: this.player2Id,
        status: "ongoing",
        board: this.#board.fen(),
        moves: this.#moves,
        createdAt: this.#start_time
      });
    } catch (error) {
      console.log(error);
      return;
    }

    if (this.#board.isCheckmate()) {
      this.sendGameOverMessage('checkmate');
      return;
    }

    if (this.#board.isThreefoldRepetition() || this.#board.isInsufficientMaterial() || this.#board.isDraw()) {
      this.sendGameOverMessage('draw');
      return;
    }

    if (this.#board.isStalemate()) {
      this.sendGameOverMessage('stalemate');
      return;
    }

    if (this.#moveCount % 2 === 0) {
      this.player2.send(
        JSON.stringify({
          type: "move",
          move,
          color: "white"
        })
      );
    } else {
      this.player1.send(
        JSON.stringify({
          type: "move",
          move,
          color: "black"
        })
      );
    }

    console.log(this.#moves);
    this.#moveCount++;
  }

  async sendGameOverMessage(result) {
    const winnerColor = this.#board.turn() === "w" ? "black" : "white";
    const winnerPlayer = this.#board.turn() === "w" ? this.player2Id : this.player1Id;

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
