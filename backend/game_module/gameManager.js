const GameOne2One = require("../models/game");
const Game = require("./game");
class GameManager {
  #games;
  #users;
  #pendingUser;

  constructor() {
    this.#games = [];
    this.#users = [];
    this.#pendingUser = { socket: null, userId: null };
    this.checkGameTimeLimits();
  }

  checkGameTimeLimits() {
    setInterval(() => {
      this.#games.forEach(async (game, index) => {
        if (game.hasExceededTimeLimit()) {
          console.log(
            `Game between ${game.player1Id} and ${game.player2Id} has exceeded 10 minutes`
          );
          // Inform players about game timeout
          game.player1.send(JSON.stringify({ type: "game_timeout" }));
          game.player2.send(JSON.stringify({ type: "game_timeout" }));
          const dbGame = await GameOne2One.findById(game.gameId);
          if (!dbGame) {
            throw new Error("Game document not found in the database");
          }

          // Update the game status to "timeout" in the database
          dbGame.status = "timeout";
          await dbGame.save();


          //TODO update to database about status of the game 
          

          // Remove the game from the list of active games
          this.#games.splice(index, 1);
        }
      });
    }, 5000); // Check every 5 seconds
  }

  addUsers(socket, userId) {
    const game = this.#games.find(
      (game) => game.player1Id === userId || game.player2Id === userId
    );
    if (game) {
      if (game.player1Id === userId) {
        game.player1Id = userId;
        game.player1 = socket;
        game.player2Id = game.player2Id;
        game.player2 = game.player2;
        this.#addHandler(socket, userId);
        socket.send(JSON.stringify({
          moves:game.moves,
          board: game.board
        }))
        // this.#addHandler(game.player2,game.player2Id)
      } else {
        game.player2Id = userId;
        game.player2 = socket;
        game.player1Id = game.player1Id;
        (game.player1Id = game), player1;
        this.#addHandler(socket, userId);
        // this.#addHandler(game,player1,game.player1Id)
      }
    } else {
      this.#users.push({ socket, userId });
      this.#addHandler(socket, userId);
    }
  }

  removeUsere(socket) {
    this.#users = this.#users.filter((user) => user != socket);
  }

  #addHandler(socket, userId) {
    socket.on("message", (data) => {
      const message = JSON.parse(data.toString());
      console.log(message);
      if (message.type === "init_game") {
        if (this.#pendingUser.socket) {
          //start game
          // console.log( this.#pendingUser.userId,userId);
          const game = new Game(
            this.#pendingUser.socket,
            this.#pendingUser.userId,
            socket,
            userId
          );
          this.#games.push(game);
          this.#pendingUser = { socket: null, userId: null };
        } else {
          this.#pendingUser.socket = socket;
          this.#pendingUser.userId = userId;
        }
      }

      if (message.type === "move") {
        const game = this.#games.find(
          (game) => game.player1 === socket || game.player2 === socket
        );
        if (game) {
          game.makeMove(socket, message.move);
        }
      }
    });
  }
}

module.exports = GameManager;
