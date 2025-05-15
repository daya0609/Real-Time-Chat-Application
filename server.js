require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { createClient } = require('redis');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// MongoDB connection
require('./config/db');
// Redis client
const redisClient = require('./config/redis');

// Use environment variable for Redis URL
const redis = require('redis').createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});
redis.connect();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));

// Socket.IO logic will go here
const Message = require('./models/Message');

// JWT authentication for Socket.IO
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    socket.user = payload.username;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Redis Pub/Sub for scaling
let isSubInitialized = false;
if (!isSubInitialized) {
  const sub = redis.duplicate();
  sub.connect();
  sub.subscribe('chat', (message) => {
    const msg = JSON.parse(message);
    io.to(msg.room).emit('message', msg);
  });
  isSubInitialized = true;
}

// Active users and room management in Redis
function addUserToRoom(username, room) {
  redis.sAdd(`room:${room}:users`, username);
  redis.sAdd('activeUsers', username);
}
function removeUserFromRoom(username, room) {
  redis.sRem(`room:${room}:users`, username);
}

io.on('connection', (socket) => {
  // Join a room dynamically
  socket.on('joinRoom', async (room) => {
    socket.join(room);
    addUserToRoom(socket.user, room);
    // Optionally notify others in the room
    socket.to(room).emit('message', {
      sender: 'System',
      content: `${socket.user} joined the room`,
      timestamp: new Date()
    });
    // Send last 20 messages from cache or DB
    let msgs = await redis.lRange(`room:${room}:messages`, -20, -1);
    if (!msgs.length) {
      const dbMsgs = await Message.find({ room }).sort({ timestamp: 1 }).limit(20);
      msgs = dbMsgs.map(m => JSON.stringify(m));
      if (msgs.length) redis.rPush(`room:${room}:messages`, ...msgs);
    }
    socket.emit('roomHistory', msgs.map(m => JSON.parse(m)));
  });

  // Leave a room dynamically
  socket.on('leaveRoom', (room) => {
    socket.leave(room);
    removeUserFromRoom(socket.user, room);
    socket.to(room).emit('message', {
      sender: 'System',
      content: `${socket.user} left the room`,
      timestamp: new Date()
    });
  });

  // Real-time message broadcasting
  socket.on('message', async (data) => {
    const msg = {
      room: data.room,
      sender: socket.user,
      content: data.content,
      timestamp: new Date()
    };
    await Message.create(msg);
    redis.rPush(`room:${data.room}:messages`, JSON.stringify(msg));
    redis.lTrim(`room:${data.room}:messages`, -20, -1);
    redis.publish('chat', JSON.stringify(msg));
    
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) removeUserFromRoom(socket.user, room);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
