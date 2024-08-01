const express=require("express");
const http=require("http");
const socket=require("socket.io");
const {Chess}=require("chess.js");
const path=require("path");
const app=express();
const server=http.createServer(app);
const io=socket(server);
const chess=new Chess();
let players={};
let currentPlayer="w";
app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));
app.get("/",(req,res)=>{
  res.render("index",{title:"Chess Game"});
})
io.on("connection", (uniqueSocket) => {
  console.log("connected");

  if (!players.white) {
    players.white = uniqueSocket.id;
    uniqueSocket.emit("playerRole", "White");
    console.log(`Player assigned: White, Socket ID: ${uniqueSocket.id}`);
  } else if (!players.black) {
    players.black = uniqueSocket.id;
    uniqueSocket.emit("playerRole", "Black");
    console.log(`Player assigned: Black, Socket ID: ${uniqueSocket.id}`);
  } else {
    uniqueSocket.emit("spectatorRole");
    console.log(`Spectator connected, Socket ID: ${uniqueSocket.id}`);
  }

  uniqueSocket.on("disconnect", () => {
    if (uniqueSocket.id === players.white) {
      delete players.white;
      console.log("White player disconnected");
    } else if (uniqueSocket.id === players.black) {
      delete players.black;
      console.log("Black player disconnected");
    }
  });

  uniqueSocket.on("move", (move) => {
    try {
      if (chess.turn() === 'w' && uniqueSocket.id !== players.white) return;
      if (chess.turn() === 'b' && uniqueSocket.id !== players.black) return;
      const result = chess.move(move);
      if (result) {
        currentPlayer = chess.turn();
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        console.log("invalid move:", move);
        uniqueSocket.emit("invalidMove", move);
      }
    } catch (error) {
      console.log("invalid move:", move);
      uniqueSocket.emit("invalidMove", move);
    }
  });
});

server.listen(3000,()=>{
  console.log("server is listening");
})