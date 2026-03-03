const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
app.use(cors());
app.use(express.static("../client"));

// MongoDB
mongoose.connect("mongodb+srv://amar12441s8_db_user:WZEuHtxnJu8u7cD0@cluster0.gpgwuqb.mongodb.net/chatapp")
.then(() => console.log("MongoDB Atlas Connected"))
.catch(err => console.log(err));
const messageSchema = new mongoose.Schema({
    name: String,
    text: String,
    room: String,
    time: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", messageSchema);

let users = [];

io.on("connection", (socket) => {

    socket.on("joinRoom", async ({ name, room }) => {

        socket.username = name;
        socket.room = room;

        socket.join(room);
        users.push({ id: socket.id, name, room });

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

    // 🔥 FIXED DELETE
    socket.on("deleteMessage", async (id) => {

        if (!id) return;

        const msg = await Message.findById(id);

        if (!msg) return;

        // Only sender can delete
        if (msg.name !== socket.username) return;

        await Message.deleteOne({ _id: id });

        io.to(socket.room).emit("messageDeleted", id.toString());
    });

    socket.on("disconnect", () => {
        users = users.filter(u => u.id !== socket.id);
    });

});

const PORT = process.env.PORT || 5000;
const path = require("path");

// Serve static frontend files
app.use(express.static(path.join(__dirname, "../client")));

// Route for homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});