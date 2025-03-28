require("dotenv").config();
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { Server } = require("socket.io");

const app = express();
app.use(cors({
  origin: "http://localhost:5173", // अपने React App के URL को allow करो
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
const server = http.createServer(app);
 
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // React frontend ka URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});


app.use(express.json());

// 🟢 MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log("MongoDB Connection Error ❌:", err));

// 🔹 User Model
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
});
const User = mongoose.model("User", UserSchema);

// 🔹 Chat Model
const ChatSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});
const Chat = mongoose.model("Chat", ChatSchema);

// 🔹 Signup Route
app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword });
    res.json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error signing up", error });
  }
});

// 🔹 Login Route
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    res.json({ username, token: "mock-token" });
  } catch (error) {
    res.status(500).json({ message: "Login error", error });
  }
});

// 🔹 Fetch Users Route
app.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "username");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
});

// 🔹 Fetch Chats Route
app.get("/chats/:user1/:user2", async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    const chats = await Chat.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    }).sort({ timestamp: 1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching chats", error });
  }
});

// 🔹 Socket.io for Real-time Messaging
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_chat", (data) => {
    socket.join(data.room);
  });

  socket.on("send_message", async (data) => {
    try {
      const chat = await Chat.create(data);
      io.to(data.room).emit("receive_message", chat);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// 🔹 Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
