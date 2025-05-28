const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3005;
const path = require('path');

let socketList = {}; // socket.id => { userName, video, audio, roomId }
let notesByRoom = {}; // roomId => shared meeting notes

app.use(express.static(path.join(__dirname, 'public')));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Health Check Route
app.get('/ping', (req, res) => {
  res.status(200).send({ success: true });
});

// Socket.IO Logic
io.on('connection', (socket) => {
  console.log(`New User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    const user = socketList[socket.id];
    if (user && user.roomId) {
      const { roomId, userName } = user;
      delete socketList[socket.id];
      socket.to(roomId).emit('FE-user-leave', { userId: socket.id, userName });

      // Send updated participant list
      const users = Object.entries(socketList)
        .filter(([_, data]) => data.roomId === roomId)
        .map(([id, info]) => ({ userId: id, info }));
      io.to(roomId).emit('FE-update-participants', users);
    }

    console.log('User disconnected:', socket.id);
  });

  socket.on('BE-check-user', ({ roomId, userName }) => {
    let error = false;
    io.in(roomId).allSockets().then((clients) => {
      for (const client of clients) {
        if (socketList[client]?.userName === userName) {
          error = true;
          break;
        }
      }
      socket.emit('FE-error-user-exist', { error });
    });
  });

  socket.on('BE-join-room', ({ roomId, userName }) => {
    socket.join(roomId);
    socketList[socket.id] = { userName, video: true, audio: true, roomId };

    const users = Object.entries(socketList)
      .filter(([_, data]) => data.roomId === roomId)
      .map(([id, info]) => ({ userId: id, info }));

    socket.to(roomId).emit('FE-user-join', users);
    io.to(roomId).emit('FE-update-participants', users);

    // Send latest shared notes if available
    if (notesByRoom[roomId]) {
      socket.emit('FE-notes-sync', notesByRoom[roomId]);
    }
  });

  socket.on('BE-call-user', ({ userToCall, from, signal }) => {
    io.to(userToCall).emit('FE-receive-call', {
      signal,
      from,
      info: socketList[socket.id],
    });
  });

  socket.on('BE-accept-call', ({ signal, to }) => {
    io.to(to).emit('FE-call-accepted', {
      signal,
      answerId: socket.id,
    });
  });

  socket.on('BE-send-message', ({ roomId, msg, sender }) => {
    io.in(roomId).emit('FE-receive-message', { msg, sender });
  });

  socket.on('BE-leave-room', ({ roomId }) => {
    delete socketList[socket.id];
    socket.leave(roomId);

    socket.to(roomId).emit('FE-user-leave', { userId: socket.id });

    // Send updated participant list
    const users = Object.entries(socketList)
      .filter(([_, data]) => data.roomId === roomId)
      .map(([id, info]) => ({ userId: id, info }));
    io.to(roomId).emit('FE-update-participants', users);
  });

  socket.on('BE-toggle-camera-audio', ({ roomId, switchTarget }) => {
    if (socketList[socket.id]) {
      if (switchTarget === 'video') {
        socketList[socket.id].video = !socketList[socket.id].video;
      } else if (switchTarget === 'audio') {
        socketList[socket.id].audio = !socketList[socket.id].audio;
      }

      socket.to(roomId).emit('FE-toggle-camera', {
        userId: socket.id,
        switchTarget,
      });
    }
  });

  // 💡 Shared Notes Handling
  socket.on('BE-update-notes', ({ roomId, notes }) => {
    notesByRoom[roomId] = notes;
    socket.to(roomId).emit('FE-notes-sync', notes);
  });

  // 🔁 Optional Pin Broadcast (not required if local-only)
  socket.on('BE-pin-participant', ({ roomId, pinnedId }) => {
    socket.to(roomId).emit('FE-pin-participant', { pinnedId });
  });
});

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
