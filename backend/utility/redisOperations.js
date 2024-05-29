const redisClient = require('./redisClient');

const GAMES_KEY = 'active_games';
const ACTIVE_USERS_KEY = 'active_users';

const saveGameData = async (gameId, gameData) => {
  try {
    const gameDataStr = JSON.stringify(gameData);
    await redisClient.hSet('games', gameId.toString(), gameDataStr);
    // console.log(`Saved game data for gameId: ${gameId}, data: ${gameDataStr}`);
  } catch (error) {
    console.error('Error saving game data:', error);
  }
};

const getGameData = async (gameId) => {
  try {
    const gameDataStr = await redisClient.hGet('games', gameId?.toString());
    // console.log(`Fetched game data for gameId: ${gameId}, data: ${gameDataStr}`);
    return JSON.parse(gameDataStr);
  } catch (error) {
    console.error('Error fetching game data:', error);
    return null;
  }
};

const updateGameStatus = async (gameId, status) => {
  try {
    const gameState = await getGameData(gameId);
    gameState.status = status;
    await saveGameData(gameId, gameState);
    // console.log(`Updated game status for gameId: ${gameId}, status: ${status}`);
  } catch (error) {
    console.error('Error updating game status:', error);
  }
};

const updateGameWinner = async (gameId, winner) => {
  try {
    const gameState = await getGameData(gameId);
    gameState.winner = winner;
    await saveGameData(gameId, gameState);
    // console.log(`Updated game winner for gameId: ${gameId}, winner: ${winner}`);
  } catch (error) {
    console.error('Error updating game winner:', error);
  }
};

const removeGame = async (gameId) => {
  try {
    await redisClient.del(gameId.toString());
    // console.log(`Removed game with gameId: ${gameId}`);
  } catch (error) {
    console.error('Error removing game:', error);
  }
};

// player1Id: '66547e4f0e66ee82e515a65f',
// player2Id: '6654802f0e66ee82e515a671',
// gameTime: 1200000,
// player1Time: 600000,
// player2Time: 600000,
// activePlayer: '66547e4f0e66ee82e515a65f',
// lastMoveTime: 1716889832502
const saveGamesList = async (games) => {
  // console.log(games)
  // const {player1Id,player2Id,gameTime,player1Time,player2Time,activePlayer,lastMoveTime,player2,player1}=games;
  try {
    const {} =games;
    const gamesStr = JSON.stringify(games);
    await redisClient.set(GAMES_KEY, gamesStr);
    // console.log(`Saved games list: ${gamesStr}`);
  } catch (error) {
    console.error('Error saving games list:', error);
  }
};

const getGamesList = async () => {
  try {
    const gamesStr = await redisClient.get(GAMES_KEY);
    // console.log(`Fetched games list: ${gamesStr}`);
    return JSON.parse(gamesStr);
  } catch (error) {
    console.error('Error fetching games list:', error);
    return null;
  }
};

const saveActiveUsers = async (users) => {
  try {
    const usersStr = JSON.stringify(users);
    await redisClient.set(ACTIVE_USERS_KEY, usersStr);
    // console.log(`Saved active users: ${usersStr}`);
  } catch (error) {
    console.error('Error saving active users:', error);
  }
};

const getActiveUsers = async () => {
  try {
    const usersStr = await redisClient.get(ACTIVE_USERS_KEY);
    // console.log(`Fetched active users: ${usersStr}`);
    return JSON.parse(usersStr);
  } catch (error) {
    console.error('Error fetching active users:', error);
    return null;
  }
};

const getActiveUserById = async (userId) => {
  try {
    const users = await getActiveUsers();
    if (!users) {
      return null;
    }
    const user = users.find(user => user.userId === userId);
    // console.log(`Fetched user with userId: ${userId}, user: ${JSON.stringify(user)}`);
    return user || null;
  } catch (error) {
    console.error('Error fetching active user by ID:', error);
    return null;
  }
};

const addActiveUser = async (user) => {
  try {
    const users = await getActiveUsers() || [];
    users.push(user);
    await saveActiveUsers(users);
    // console.log(`Added active user: ${JSON.stringify(user)}`);
  } catch (error) {
    console.error('Error adding active user:', error);
  }
};

const removeActiveUser = async (userId) => {
  try {
    let users = await getActiveUsers() || [];
    users = users.filter(user => user.userId !== userId);
    await saveActiveUsers(users);
    // console.log(`Removed active user with userId: ${userId}`);
  } catch (error) {
    console.error('Error removing active user:', error);
  }
};

module.exports = {
  saveGameData,
  getGameData,
  updateGameStatus,
  updateGameWinner,
  removeGame,
  saveGamesList,
  getGamesList,
  saveActiveUsers,
  getActiveUsers,
  addActiveUser,
  removeActiveUser,
  getActiveUserById
};
