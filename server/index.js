// DSS Video Call Server (DentalPaas)

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(morgan('dev'));

const PORT = process.env.PORT || 5000;

// Root route
app.get('/', (req, res) => {
  res.send('DentalPaas Video Server is running');
});

// Rooms structure to track participants by roomId
const rooms = {};

/**
 * Utility to clean empty rooms
 */
function cleanEmptyRooms() {
  for (const roomId in rooms) {
    if (rooms[roomId].length === 0) {
      delete rooms[roomId];
    }
  }
}

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // User joins a room
  socket.on('join-room', ({ roomId, userName }, callback) => {
    socket.join(roomId);
    console.log(`${userName} joined room ${roomId}`);

    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push({ socketId: socket.id, userName });

    // Notify others in the room
    socket.to(roomId).emit('user-joined', {
      socketId: socket.id,
      userName,
    });

    // Send back all existing users (except self)
    const otherUsers = rooms[roomId].filter((user) => user.socketId !== socket.id);
    io.to(socket.id).emit('all-users', { users: otherUsers });

    if (callback) callback({ success: true });
  });

  // Relay WebRTC signaling signals
  socket.on('send-signal', ({ userToSignal, callerId, signal }) => {
    io.to(userToSignal).emit('user-signal', { signal, callerId });
  });

  socket.on('return-signal', ({ callerId, signal }) => {
    io.to(callerId).emit('receive-returned-signal', {
      signal,
      id: socket.id,
    });
  });

  // Chat messaging relay
  socket.on('send-message', ({ roomId, userName, message }) => {
    io.to(roomId).emit('receive-message', {
      userName,
      message,
    });
  });

  // Camera toggle broadcast
  socket.on('toggle-camera', ({ roomId, userName, isCameraOn }) => {
    socket.to(roomId).emit('camera-toggled', { socketId: socket.id, userName, isCameraOn });
  });

  // Mic toggle broadcast
  socket.on('toggle-mic', ({ roomId, userName, isMicOn }) => {
    socket.to(roomId).emit('mic-toggled', { socketId: socket.id, userName, isMicOn });
  });

  // Screen share toggle broadcast
  socket.on('screen-share', ({ roomId, userName, isScreenSharing }) => {
    socket.to(roomId).emit('screen-share-toggled', { socketId: socket.id, userName, isScreenSharing });
  });

  // Pin/unpin video
  socket.on('pin-video', ({ roomId, socketIdToPin }) => {
    io.to(roomId).emit('video-pinned', { socketIdToPin });
  });

  // Meeting notes sync
  socket.on('meeting-notes-update', ({ roomId, notes }) => {
    socket.to(roomId).emit('meeting-notes-updated', { notes });
  });

  /**
   * Microservice bot join
   * The bot should connect as a real socket client from backend,
   * but here we simulate a bot user by generating a user with socket.id.
   * Ideally, you run the bot as a separate client and connect it normally.
   */
  socket.on('BE-microservice-bot-join', ({ roomId }) => {
    console.log(`Microservice bot joining room ${roomId}`);

    // Add bot to room participants with actual socket.id (same socket)
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push({ socketId: socket.id, userName: 'DentalBot' });

    socket.join(roomId);

    // Notify room that bot joined
    io.to(roomId).emit('user-joined', {
      socketId: socket.id,
      userName: 'DentalBot',
    });

    io.to(roomId).emit('FE-microservice-bot-joined');
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    // Remove user from all rooms they were in
    for (const roomId in rooms) {
      const prevLength = rooms[roomId].length;
      rooms[roomId] = rooms[roomId].filter((user) => user.socketId !== socket.id);
      if (rooms[roomId].length !== prevLength) {
        io.to(roomId).emit('user-disconnected', socket.id);
      }
    }

    cleanEmptyRooms();
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

server.listen(PORT, () => {
  console.log(`🚀 DentalPaas Server listening on port ${PORT}`);
});
