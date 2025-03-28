const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server,{
  cors:{
    origin:"http://localhost:5173"
  }
});

// Add some random users initially
let users = [
  { username: 'JohnDoe', socketId: null },
  { username: 'JaneSmith', socketId: null },
  { username: 'MikeTyson', socketId: null },
  { username: 'SaraLee', socketId: null },
  { username: 'JakePaul', socketId: null }
];

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // New user joins, add them to the list of users
  socket.on('setUsername', (username) => {
    // Check if the username exists
    const userIndex = users.findIndex(user => user.username === username);

    if (userIndex === -1) {
      // Add new user and set socketId to the connected socket ID
      users.push({ username, socketId: socket.id });
    } else {
      // Update existing user with their socketId
      users[userIndex].socketId = socket.id;
    }
    
    // Emit user list to all connected clients
    io.emit('userList', users.map(user => user.username));
    console.log(`${username} has joined`);
  });

  // Receive message from user and send to specific user by socket ID
  socket.on('sendMessageToUser', (data) => {
    const { recipientSocketId, message, sender } = data;

    // Send message to specific user by their socket ID
    io.to(recipientSocketId).emit('message', { user: sender, message });
    console.log('Message sent to', recipientSocketId);
  });

  // User disconnects
  socket.on('disconnect', () => {
    // Remove the disconnected user from the list
    users = users.filter(user => user.socketId !== socket.id);
    io.emit('userList', users.map(user => user.username));  // Update user list for all clients
    console.log('A user disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
