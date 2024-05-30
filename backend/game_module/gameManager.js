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
  #games=[];
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
    if(this.#userSockets.hasOwnProperty(userId)){
      return socket.close()
    }else{
      this.#userSockets[userId] = socket;
    }
    
   
    if (gameId) {
      const gameData = await getGameData(gameId);
      
      const game = this.#games.find(g => g.gameId === gameId);
  
      if (game) {
        const currentTime = Date.now();
        const playerTimeRemaining = game.player1Id === userId ? game.player1Time : game.player2Time;
        const opponentTimeRemaining = game.player1Id === userId ? game.player2Time : game.player1Time;
        const elapsedTime = currentTime - game.lastMoveTime;
        // console.log(currentTime,"currentTime")
        // console.log(playerTimeRemaining,"playerTimeRemaining")
        // console.log(opponentTimeRemaining,"opponentTimeRemaining")
        // console.log(elapsedTime,"elapsedTime")
  
        // Check if current player's time is over
        if (playerTimeRemaining - elapsedTime <= 0) {
          socket.send(JSON.stringify({ type: 'game_over', winner: game.player1Id === userId ? game.player2Id : game.player1Id }));
          const otherPlayer = game.player1Id == userId ? game.player2 : game?.player1
          otherPlayer?.send(JSON.stringify({ type: 'game_over', winner: game.player1Id === userId ? game.player2Id : game.player1Id }));
          this.#games = this.#games.filter(g => g.gameId !== gameId);
          await updateGameStatus(game.gameId,game.player1Id === userId ? game.player2Id : game.player1Id )
          await removeGame(gameId);
          await saveGamesList(this.#games)
          return;
        }
  
        // Check if opponent's time is over
        if (opponentTimeRemaining - elapsedTime <= 0) {
          socket.send(JSON.stringify({ type: 'game_over', winner: userId }));
          const otherPlayer = game.player1Id == userId ? game.player2 : game?.player1
          otherPlayer?.send(JSON.stringify({ type: 'game_over', winner: userId }));
          this.#games = this.#games.filter(g => g.gameId !== gameId);
          await updateGameStatus(game.gameId,game.player1Id === userId ? game.player2Id : game.player1Id )
          await removeGame(gameId);
          await saveGamesList(this.#games)
          return;
        }
  
        // Update game time for the rejoining user
        if (game.player1 === userId) {
          game.player1Time -= elapsedTime;
        } else {
          game.player2Time -= elapsedTime;
        }
        game.lastMoveTime = currentTime;
  
        // Send the game state to the rejoining user
        socket.send(JSON.stringify({
          type: 'resume_game',
          board: game.board,
          moves: game.moves,
          gameId: game.gameId,
          turn: game.turn,
          userId: userId,
          opponentId: game.player1Id === userId ? game.player2Id : game.player1Id
        }));
        
        this.#addHandler(socket, userId);
        this.#games = this.#games.filter(g => g.gameId !== gameId);
        const newGame = new Game(
          this.#userSockets[game.player1Id],
          game.player1Id,
          this.#userSockets[game.player2Id],
          game.player2Id,
          game,
          gameId
        );
        this.#games.push(newGame);
      }

      else {
        
        socket.send(JSON.stringify({ type: "error", message: "Game not found" }));
      }






    }
    
    
    
    
    
    
    else {
     
        await addActiveUser( {userId });
      
      this.#addHandler(socket, userId);
    }
  }

  async removeUser(socket) {
    for (const [userId, userSocket] of Object.entries(this.#userSockets)) {
      if (userSocket === socket) {
        console.log(`Removing user with userId: ${userId}`);
        
        // Delete the user from the #userSockets
        const game = this.#games?.find((g)=> g?.player1Id === userId || g?.player2Id == userId)
        if(game){
          if(game?.player1Id === userId){
            game?.player2?.send(JSON.stringify({
              type:"opponent_disconnected"
            }))
          }else{
            game?.player1?.send(JSON.stringify({
              type:"opponent_disconnected"       
            }))
          }
        }
        delete this.#userSockets[userId];
        
        // Remove the active user from Redis
        await removeActiveUser(userId);
        return;
  
      }
  }
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
          // await removeGame(game.gameId);
          this.#games = this.#games.filter(g => g.gameId !== game.gameId);
          await saveGamesList(this.#games)
        }
      }
    });
  }
}

module.exports = GameManager;
