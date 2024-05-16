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

wss.on('connection', function connection(ws,req) {
  const userId = new URLSearchParams(req.url.split('?')[1]).get('userId');
  console.log('WebSocket client connected',userId);
  gameManager.addUsers(ws,userId);

  ws.on('close', function close() {
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
}).catch((err)=>{
  console.log("Error in connecting database",err);
})


