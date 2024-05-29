const GameOne2One = require("../models/game");
const Game = require("./game");
const {
  getActiveUserById,
  addActiveUser,
  removeActiveUser,
  saveGameData,
  getGameData,
  updateGameStatus,
  removeGame,
  getGamesList,
  saveGamesList
} = require('../utility/redisOperations');
const redisClient = require('../utility/redisClient');
const rehydrateGame = require("../utility/rehydrateGame")

class GameManager {
  #games= [];
  #userSockets;
  #users;
  #pendingUser;
  constructor() {
    this.#userSockets = {};
    this.#pendingUser = {socket : null , userId : null}
    this.initializeGames();
    // this.checkGameTimeLimits();
  }

  // Initialize games from Redis on server start
  async initializeGames() {
    const games = await getGamesList();
    this.#games = (games || []).map(gameData => rehydrateGame(gameData,this.#userSockets));
    this.#pendingUser = {socket : null , userId : null}
  }
  async addUsers(socket, userId, gameId ) {
    // Store the socket with the userId
    this.#userSockets[userId] = socket;
    // console.log("uluuuuuuuuuuuuuuuuuuuu",socket);
    ;
   
    if (gameId) {
      const gameData = await getGameData(gameId);
      // console.log("apmooooo",this.#userSockets[gameData.player2]===socket,userId)

    
    
      console.log(gameData.player1,gameData.player2);   console.log("socketid",this.#userSockets[gameData.player1]===socket,userId)
   
      if(gameData && gameData.player1 === userId && this.#userSockets[gameData.player2]){
        socket.send(JSON.stringify({
          type: 'resume_game',
          board: gameData?.board, 
          moves: gameData?.moves,
          gameId: gameData?.gameId, 
          turn : gameData?.turn,
          userId:userId,
          opponentId : gameData?.player2
        }));
        this.#addHandler(socket,userId)
       this.#games= this.#games.filter((elem)=>elem?.gameId !==gameId)
        const game = new Game(this.#userSockets[gameData.player1],userId,this.#userSockets[gameData.player2],gameData.player2,gameData,gameId)
        this.#games.push(game)
        // this.#userSockets[userId] = socket;
      }
      else if(gameData && gameData.player2 === userId && this.#userSockets[gameData.player1]){
        socket.send(JSON.stringify({
          type: 'resume_game',
          board: gameData?.board, 
          moves: gameData?.moves,
          gameId: gameData?.gameId, 
          turn : gameData?.turn,
          userId:userId,
          opponentId : gameData?.player1
        }));
        this.#addHandler(socket,userId)
        this.#games= this.#games.filter((elem)=>elem?.gameId !==gameId)
        const game = new Game(this.#userSockets[gameData.player1],gameData?.player1,this.#userSockets[gameData.player2],userId,gameData,gameId)
        this.#games.push(game)
      }

     
       else {
        socket.send(JSON.stringify({ type: "error", message: "Game not found" }));
      }
    } else {
      const existingUser = await getActiveUserById(userId);
      if (existingUser) {
        existingUser.socket = socket;
        await addActiveUser(existingUser);
      } else {
        await addActiveUser({ socketId: socket.id, userId });
      }
      this.#addHandler(socket, userId);
    }
  }

  async removeUser(socket) {
    const userId = socket.userId;
    delete this.#userSockets[userId];
    await removeActiveUser(userId);
  }

  #addHandler(socket, userId) {
    socket.on("message",async (data) => {
      const message = JSON.parse(data.toString());
      console.log(message);
      if (message.type === "init_game") {
        if (this.#pendingUser.socket) {
          //start game
          // console.log( this.#pendingUser.socket,userId);
          const game = new Game(
            this.#pendingUser.socket,
            this.#pendingUser.userId,
            socket,
            userId,
            null
          );

          // console.log(`Adding game to games array with gameId: ${game}`);
          await game.initializeGame(); // Ensure gameId is set

          console.log(`Adding game to games array with gameId: ${game.gameId}`);

          this.#games.push(game);

          await saveGamesList(this.#games)
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
        // console.log("from move userId",userId);
        // console.log("from move",gameId);
        const gameData = this.#games.find((g)=> g.gameId == gameId)
        // console.log("from move",gameData?.chess.ascii());
        if (gameData) {
          // const game = rehydrateGame(gameData, this.#userSockets);
          gameData.makeMove(socket, message.move);
        }
      }
      if (message.type === "game_over") {
        const gameId = message.gameId
        const gameData = await getGameData(gameId);
        if (gameData) {
          const game = rehydrateGame(gameData, this.#userSockets);
          await game.sendGameOverMessage(message.result);
          await removeGame(game.gameId);
          this.#games = this.#games.filter(g => g.gameId !== game.gameId);
        }
      }
    });
  }
}

module.exports = GameManager;
