const redisClient = require('./redisClient');


const GAMES_KEY = 'active_games';
const ACTIVE_USERS_KEY = 'active_users';

//redis operation on game state 
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

const saveGamesList = async (games) => {
  await redisClient.set(GAMES_KEY, JSON.stringify(games));
};

// Get the list of active games
const getGamesList = async () => {
  const games = await redisClient.get(GAMES_KEY);
  return JSON.parse(games);
};

// Save the pending user

// Save the list of active users
const saveActiveUsers = async (users) => {
  await redisClient.set(ACTIVE_USERS_KEY, JSON.stringify(users));
};

// Get the list of active users
const getActiveUsers = async () => {
  const users = await redisClient.get(ACTIVE_USERS_KEY);
  return JSON.parse(users);
};

// Add an active user
const addActiveUser = async (user) => {
  const users = await getActiveUsers() || [];
  users.push(user);
  await saveActiveUsers(users);
};

// Remove an active user
const removeActiveUser = async (userId) => {
  let users = await getActiveUsers() || [];
  users = users.filter(user => user.userId !== userId);
  await saveActiveUsers(users);
};

module.exports = {
  saveGameState,
  getGameState,
  updateGameStatus,
  updateGameWinner,
  removeGame,
  saveGamesList,
  getGamesList,
  saveActiveUsers,
  getActiveUsers,
  addActiveUser,
  removeActiveUser
};