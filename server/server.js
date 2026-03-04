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

/* ------------------ MongoDB ------------------ */

mongoose.connect("YOUR_MONGODB_URL_HERE")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

const messageSchema = new mongoose.Schema({
  name: String,
  text: String,
  room: String,
  time: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", messageSchema);

/* ------------------ USERS ------------------ */

let users = [];

/* ------------------ SOCKET ------------------ */

io.on("connection", (socket) => {

  socket.on("joinRoom", async ({ name, room }) => {

    socket.username = name;
    socket.room = room;

    socket.join(room);

    users.push({
      id: socket.id,
      name,
      room
    });

    const oldMessages = await Message.find({ room });

    oldMessages.forEach(msg => {
      socket.emit("message", msg);
    });

    io.to(room).emit("roomUsers",
      users.filter(u => u.room === room)
    );
  });

  socket.on("sendMessage", async ({ message }) => {

    const newMsg = new Message({
      name: socket.username,
      text: message,
      room: socket.room
    });

    const savedMsg = await newMsg.save();

    io.to(socket.room).emit("message", savedMsg);

  });

  socket.on("deleteMessage", async (id) => {

    const msg = await Message.findById(id);

    if (!msg) return;

    if (msg.name !== socket.username) return;

    await Message.deleteOne({ _id: id });

    io.to(socket.room).emit("messageDeleted", id.toString());

  });

  socket.on("disconnect", () => {

    users = users.filter(u => u.id !== socket.id);

  });

});

/* ------------------ FRONTEND ------------------ */

app.use(express.static(path.join(__dirname, "../client")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

/* ------------------ SERVER ------------------ */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});