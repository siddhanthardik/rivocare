const socketIO = require('socket.io');

let io;

// To track online users: map of userId -> Set of socketIds
// This allows one user to have multiple active sessions (e.g. mobile & web)
const userSockets = new Map();

module.exports = {
  init: (server, allowedOrigins) => {
    const origins = allowedOrigins || [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:5174'
    ];

    io = socketIO(server, {
      cors: {
        origin: origins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('register', (userId) => {
        if (!userId) return;
        
        socket.join(userId); // Use user's ID as a room for targeted broadcasts
        console.log(`User ${userId} registered socket ${socket.id}`);
        
        if (!userSockets.has(userId)) {
          userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket.id);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Remove socket from user map
        for (const [userId, sockets] of userSockets.entries()) {
          if (sockets.has(socket.id)) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
              userSockets.delete(userId);
            }
            break;
          }
        }
      });
    });

    return io;
  },
  
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  },

  isUserOnline: (userId) => {
    return userSockets.has(userId.toString());
  }
};
