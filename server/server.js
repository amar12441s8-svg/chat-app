const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(cors());
app.use(express.json());

/* ---------------- MONGODB ---------------- */

mongoose.connect(
"mongodb+srv://amar12441s8_db_user:WZFuHtxnJu8u7cD0@cluster0.gpgwuqb.mongodb.net/chat",
{
useNewUrlParser: true,
useUnifiedTopology: true
}
)
.then(()=>console.log("MongoDB Atlas Connected"))
.catch(err=>console.log(err));

/* ---------------- MESSAGE MODEL ---------------- */

const messageSchema = new mongoose.Schema({
name:String,
text:String,
room:String,
time:{type:Date,default:Date.now}
});

const Message = mongoose.model("Message",messageSchema);

let users = [];

/* ---------------- SOCKET ---------------- */

io.on("connection",(socket)=>{

console.log("User Connected");

socket.on("joinRoom",async({name,room})=>{

socket.username=name;
socket.room=room;

socket.join(room);

users.push({
id:socket.id,
name,
room
});

const oldMessages = await Message.find({room});

oldMessages.forEach(msg=>{
socket.emit("message",msg);
});

io.to(room).emit(
"roomUsers",
users.filter(u=>u.room===room)
);

});

socket.on("sendMessage",async({message})=>{

const newMsg = new Message({
name:socket.username,
text:message,
room:socket.room
});

const savedMsg = await newMsg.save();

io.to(socket.room).emit("message",savedMsg);

});

socket.on("disconnect",()=>{
users = users.filter(u=>u.id!==socket.id);
});

});

/* ---------------- FRONTEND ---------------- */

app.use(express.static(path.join(__dirname,"../client")));

app.get("/",(req,res)=>{
res.sendFile(path.join(__dirname,"../client/index.html"));
});

/* ---------------- SERVER ---------------- */

const PORT = process.env.PORT || 10000;

server.listen(PORT,()=>{
console.log("Server running on port "+PORT);
});
const PORT = process.env.PORT || 10000;
