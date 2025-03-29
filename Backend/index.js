const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Frontend ka URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

// Dummy users list
let users = [
  { username: "Alice" },
  { username: "Bob" },
  { username: "Charlie" },
];

let chatMessages = {}; // { "Alice-Bob": [{ sender, receiver, message }], ... }

// ✅ API to get users list
app.get("/users", (req, res) => {
  res.json(users);
});

// ✅ API to get chat messages between two users
app.get("/chats/:user1/:user2", (req, res) => {
  const { user1, user2 } = req.params;
  const room = [user1, user2].sort().join("-");
  res.json(chatMessages[room] || []);
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // ✅ User joining a chat room
  socket.on("join_chat", ({ room }) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
  });

  // ✅ Handling message sending
  socket.on("send_message", (data) => {
    const { sender, receiver, message, room } = data;

    // Store message
    if (!chatMessages[room]) {
      chatMessages[room] = [];
    }
    chatMessages[room].push({ sender, receiver, message });

    // Broadcast to the room
    io.to(room).emit("receive_message", { sender, receiver, message });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(3000, () => console.log("Server running on port 3000"));
