const { Chess } = require("chess.js");
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
    this.updateBoardInterval()
    const newGame = new GameOne2One({
        player1: this.player1Id,
        player2: this.player2Id,
        status:"ongoing",
        board: this.#board,
        createdAt : this.#start_time
    })

    newGame.save()

    this.gameId = newGame._id

    this.player1.send(
      JSON.stringify({
        type: "init_game",
        payload: {
          whiteColor: "white",
        },
        gameId :this.gameId
      })
    );
    this.player2.send(
      JSON.stringify({
        type: "init_game",
        payload: {
          blackColor: "black",
        },
        gameId :this.gameId
      })
    );
  }

  async updateBoardInterval() {
    this.intervalId = setInterval(async () => {
        try {
          // Find the game by its ID
          const game = await GameOne2One.findById(this.gameId);
          if (!game) {
            throw new Error("Game not found");
          }
    
          // Check if the game is over
          if (game.status === "finished" || game.status === "timeout") {
            // If the game is over, stop the interval
            clearInterval(this.intervalId);
            console.log("Board update interval stopped because the game is over");
            return;
          }
    
          // Update the board state
          game.board = this.#board;
    
          // Save the updated game document to the database
          await game.save();
    
          console.log("Board updated successfully");
        } catch (error) {
          console.error("Error updating board:", error);
        }
      }, 60000);
  }

  hasExceededTimeLimit() {
    const currentTime = new Date();
    const elapsedTime = currentTime - this.#start_time;
    const timeLimit = 10 * 60 * 1000; // 10 minutes in milliseconds TODO: have change dynamically according to game type
    return elapsedTime > timeLimit;
  }

  async makeMove(socket, move) {
    //for validation of right player
    if (this.#moveCount % 2 === 0 && socket !== this.player1) {
      return;
    }
    if (this.#moveCount % 2 === 1 && socket !== this.player2) {
      return;
    }
    try {
      this.#board.move(move);
      this.#moves.push(move);
    } catch (error) {
      console.log(error);
      return;
    }

    if (this.#board.isCheckmate()) {
        this.player1.send(
            JSON.stringify({
              type: "game_over",
              payload: {
                winner: this.#board.turn() === "w" ? "black" : "white",
              },
            })
          );
          this.player2.send(
            JSON.stringify({
              type: "game_over",
              payload: {
                winner: this.#board.turn === "w" ? "black" : "white",
              },
            })
        );
    }

    if (this.#board.isGameOver()) {
        
      this.player1.send(
        JSON.stringify({
          type: "game_over",
          payload: {
            winner: this.#board.turn() === "w" ? "black" : "white",
          },
        })
      );
      this.player2.send(
        JSON.stringify({
          type: "game_over",
          payload: {
            winner: this.#board.turn === "w" ? "black" : "white",
          },
        })
      );

      const dbGame = await GameOne2One.findById(this.gameId);
        dbGame.status = "finished"
        // dbGame.winner = 
        dbGame.save()
      return;
    }

    if (this.#moveCount % 2 === 0) {
      this.player2.send(
        JSON.stringify({
          type: "move",
          move,
        })
      );
    } else {
      this.player1.send(
        JSON.stringify({
          type: "move",
          move,
        })
      );
    }
    console.log(this.#moves);
    this.#moveCount++;
   
  }
}

module.exports = Game;
