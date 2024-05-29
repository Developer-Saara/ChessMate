const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require("mongoose")
const cors = require("cors")
require('dotenv').config()

const GameManager  = require('./game_module/gameManager');
const userAuthRoutes = require('./user/routes/autRoutes')
const adminAuthRoutes = require("./admin/routes/authRoutes")
const adminRoutes = require("./admin/routes/adminRoutes")
const userRoutes = require("./user/routes/userRoutes")
const cronJob = require("./crons/startTournament");
const User = require('./models/user');
const Game = require('./models/game');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(bodyParser.json());
app.use(cors())

app.use("/user/auth",userAuthRoutes)
app.use("/admin/auth",adminAuthRoutes)
app.use("/admin",adminRoutes)
app.use("/user",userRoutes)


const gameManager = new GameManager();

wss.on('connection', async function connection(ws,req) {
  const urlParams = new URLSearchParams(req.url.split('?')[1]);
  const userId = urlParams.get('userId');
  const gameId = urlParams.get('gameId');
  
  try {
    const user = await User.findById(userId);
    const Gamedata = await Game.findById(gameId)
    if (user && Gamedata) {
      gameManager.addUsers(ws, userId, gameId);
      console.log('WebSocket client connected', userId);
    } 
    else if(user){
      gameManager.addUsers(ws, userId, null);
      console.log('WebSocket client connected', userId);

    }
    else {
      ws.send(JSON.stringify({
        type: "Unauthorized"
      }));
      console.log('Unauthorized connection attempt', userId);
      ws.close(); // Close the WebSocket connection
    }
  } catch (error) {
    console.error('Error finding user:', error);
    ws.send(JSON.stringify({
      type: "Error",
      message: "Internal server error"
    }));
    ws.close(); // Close the WebSocket connection on error
  }


  ws.on('close', function close() {
    gameManager.removeUser(ws)
    console.log('WebSocket client disconnected');
  });
});


app.get('/', (req, res) => {
  res.send('Hello World!');
});



mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.klwsiwa.mongodb.net/chessgame?&retryWrites=true&w=majority&appName=Cluster0`).then(()=>{
  console.log("connected to database");
  server.listen(5000, () => {
    console.log('HTTP and WebSocket server running on http://localhost:5000');
  });
  // cronJob()
}).catch((err)=>{
  console.log("Error in connecting database",err);
})


