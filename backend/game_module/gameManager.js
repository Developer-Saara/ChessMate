const GameOne2One = require("../models/game");
const Game = require("./game");
const redisUtils = require('../utility/redisOperations');

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
        if (game.status === "finished") {
          console.log(
            `Game between ${game.player1Id} and ${game.player2Id} has exceeded 10 minutes`
          );
        
          // Remove the game from the list of active games
          this.#games.splice(index, 1);
        }
      });
    }, 5000); // Check every 5 seconds
  }

  addUsers(socket, userId , gameId=null) {
    const game = this.#games.find(
      (game) => game.gameId === gameId
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
        game.player1Id = game.player1;
        this.#addHandler(socket, userId);
        socket.send(JSON.stringify({
          moves:game.moves,
          board: game.board
        }))
        // this.#addHandler(game,player1,game.player1Id)
      }
    } else {
      this.#users.push({ socket, userId });
      this.#addHandler(socket, userId);
    }
  }

  removeUser(socket) {
    this.#users = this.#users.filter((user) => user != socket);
  }

  #addHandler(socket, userId) {
    socket.on("message",async (data) => {
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

          // console.log(`Adding game to games array with gameId: ${game}`);
          await game.initializeGame(); // Ensure gameId is set

          console.log(`Adding game to games array with gameId: ${game.gameId}`);

          this.#games.push(game);
          this.#pendingUser = { socket: null, userId: null };
        } else {
          this.#pendingUser.socket = socket;
          this.#pendingUser.userId = userId;
          socket.send(JSON.stringify({
            type : "pending"
          }))
        }
      }

      if (message.type === "move") {
        const gameId = message.gameId
      
        const game = this.#games.find(
          (game) => game.gameId === gameId
        );
        // console.log(game);
        if (game) {
          game.makeMove(socket, message.move);
        }
      }
      if (message.type === "game_over") {
        const game = this.#games.find(
          (game) => game.player1 === socket || game.player2 === socket
        );
        if (game) {
          await game.sendGameOverMessage(message.result);

          // Remove the game from Redis
          await redisUtils.removeGame(game.gameId);

          // Remove the game from the list of active games
          this.#games = this.#games.filter(g => g.gameId !== game.gameId);
        }
      }
    });
  }
}

module.exports = GameManager;
