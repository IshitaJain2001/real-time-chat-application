import dotenv from "dotenv";
import http from "http";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { Server } from "socket.io";


const app = express();
app.use(express.json());
app.use(cors({ origin:"http://localhost:5173" , credentials: true }));
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin:"http://localhost:5173", credentials: true },
});



mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
    server.listen(3000, () => {
      console.log("Server running on port 3000");
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
});

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  message: { type: String, required: true },
  room: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Message = mongoose.model("Message", messageSchema);

app.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "username");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Error fetching users" });
  }
});

app.get("/chats/:user/:selectedUser", async (req, res) => {
  const { user, selectedUser } = req.params;
  if (!user || !selectedUser) {
    return res.status(400).json({ error: "Invalid users" });
  }
  const chatRoom = [user, selectedUser].sort().join("-");
  try {
    const messages = await Message.find({ room: chatRoom }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Error fetching messages" });
  }
});

io.on("connection", (socket) => {
  console.log("User connected: " + socket.id);

  socket.on("join_chat", ({ room }) => {
    if (room) {
      socket.join(room);
    }
  });

  socket.on("send_message", async (data) => {
    const { sender, receiver, message, room } = data;
    if (!sender || !receiver || !message || !room) {
      return;
    }
    try {
      const newMessage = new Message({ sender, receiver, message, room });
      await newMessage.save();
      io.to(room).emit("receive_message", newMessage);
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);
  });
});