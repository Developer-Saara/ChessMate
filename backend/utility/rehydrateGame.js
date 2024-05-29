const { Chess } = require("chess.js");
const Game = require("../models/game");

const rehydrateGame = (gameData, userSockets) => {
  if (!gameData) return null;

  const game = new Game(
    userSockets[gameData.player1] || null,
    gameData.player1,
    userSockets[gameData.player2] || null,
    gameData.player2
  );
  // console.log(gameData.board);
  game.chess = new Chess(gameData?.board);
  game.board = game?.chess?.board()
  game.moves = gameData.moves;
  game.start_time = new Date(gameData.createdAt);
  game.gameId = gameData.gameId;
  game.gameTime = gameData.gameTime;
  game.player1Time = gameData.player1Time;
  game.player2Time = gameData.player2Time;
  game.activePlayer = gameData.activePlayer;
  game.lastMoveTime = gameData.lastMoveTime;

  return game;
};

module.exports = rehydrateGame;
