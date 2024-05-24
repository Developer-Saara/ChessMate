const redisClient = require('./redisClient'); // Adjust the path as needed

const saveGameState = async (gameId, gameState) => {
  await redisClient.hSet(gameId.toString(), 'state', JSON.stringify(gameState));
};

const getGameState = async (gameId) => {
  const gameState = await redisClient.hGet(gameId.toString(), 'state');
  return JSON.parse(gameState);
};

const updateGameStatus = async (gameId, status) => {
  const gameState = await getGameState(gameId);
  gameState.status = status;
  await saveGameState(gameId, gameState);
};

const updateGameWinner = async (gameId, winner) => {
  const gameState = await getGameState(gameId);
  gameState.winner = winner;
  await saveGameState(gameId, gameState);
};

const removeGame = async (gameId) => {
  await redisClient.del(gameId.toString());
};

module.exports = {
  saveGameState,
  getGameState,
  updateGameStatus,
  updateGameWinner,
  removeGame
};
