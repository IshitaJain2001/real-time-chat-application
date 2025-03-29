require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ MongoDB Connection
if (!process.env.MONGO_URI) {
  console.error("❌ MongoDB URI not found. Make sure you have a .env file with MONGO_URI.");
  process.exit(1); // Stop execution if URI is missing
}
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Failed:", err));

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

// ✅ Chat Schema
const chatSchema = new mongoose.Schema({
  room: String,
  sender: String,
  receiver: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});

const Chat = mongoose.model("Chat", chatSchema);

// ✅ Dummy users list
let users = [
  { username: "Alice" },
  { username: "Bob" },
  { username: "Charlie" },
];

// ✅ API to get users list
app.get("/users", (req, res) => {
  res.json(users);
});

// ✅ API to get chat messages from MongoDB
app.get("/chats/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;
  const room = [user1, user2].sort().join("-");

  try {
    const messages = await Chat.find({ room }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Error fetching chat messages" });
  }
});

io.on("connection", (socket) => {
  console.log("⚡ A user connected:", socket.id);

  // ✅ User joining a chat room
  socket.on("join_chat", ({ room }) => {
    socket.join(room);
    console.log(`👥 User joined room: ${room}`);
  });

  // ✅ Handling message sending (MongoDB me save karna)
  socket.on("send_message", async (data) => {
    const { sender, receiver, message, room } = data;

    // Create & save message in MongoDB
    const newMessage = new Chat({ room, sender, receiver, message });

    try {
      await newMessage.save();

      // ✅ Send message to frontend
      io.to(room).emit("receive_message", newMessage);
    } catch (error) {
      console.error("❌ Error saving message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

server.listen(3000, () => console.log("🚀 Server running on port 3000"));
