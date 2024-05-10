const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require("mongoose")


const GameManager  = require('./game_module/gameManager');
const authRoutes = require('./routes/autRoutes')



const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(bodyParser.json());
app.use("/user",authRoutes)

const gameManager = new GameManager();

wss.on('connection', function connection(ws,req) {
  const userId = new URLSearchParams(req.url.split('?')[1]).get('userId');
  console.log('WebSocket client connected',userId);
  gameManager.addUsers(ws);

  ws.on('close', function close() {
    console.log('WebSocket client disconnected');
  });
});

// Define your HTTP routes here using Express
app.get('/', (req, res) => {
  res.send('Hello World!');
});

server.listen(5000, () => {
  console.log('HTTP and WebSocket server running on http://localhost:5000');
});

