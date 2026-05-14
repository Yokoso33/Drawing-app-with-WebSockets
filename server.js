const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'build')));

// Store all drawings
let allShapes = [];
let connectedUsers = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Add user to connected users
  connectedUsers.set(socket.id, {
    id: socket.id,
    connectedAt: new Date()
  });

  // Send current drawing state to new user
  socket.emit('initial-shapes', allShapes);
  
  // Notify all clients about updated user count
  io.emit('users-updated', Array.from(connectedUsers.values()));

  // Handle new shape from client
  socket.on('new-shape', (shapeData) => {
    // Add unique ID and user info to shape
    const shapeWithId = {
      ...shapeData,
      id: `${socket.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: socket.id,
      timestamp: new Date()
    };
    
    allShapes.push(shapeWithId);
    
    // Broadcast to all other clients (including the sender with the final ID)
    io.emit('shape-added', shapeWithId);
    
    console.log('Shape added. Total shapes:', allShapes.length, 'Shape ID:', shapeWithId.id);
  });

  // Handle clear canvas
  socket.on('clear-canvas', () => {
    allShapes = [];
    io.emit('canvas-cleared');
    console.log('Canvas cleared');
  });

  // Handle undo - FIXED: Remove the last shape from ALL shapes, not just user's shapes
  socket.on('undo-shape', () => {
    console.log('Undo requested by:', socket.id);
    console.log('Current shapes before undo:', allShapes.length);
    
    if (allShapes.length > 0) {
      // Remove the last shape from ALL shapes (regardless of which user created it)
      const lastShape = allShapes[allShapes.length - 1];
      const shapeId = lastShape.id;
      
      console.log('Removing last shape:', shapeId, 'created by:', lastShape.userId);
      
      // Remove the shape from all shapes
      allShapes = allShapes.slice(0, -1);
      
      // Broadcast removal to all clients
      io.emit('shape-removed', shapeId);
      console.log('Shape removed. Total shapes:', allShapes.length);
    } else {
      console.log('No shapes to undo');
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    connectedUsers.delete(socket.id);
    io.emit('users-updated', Array.from(connectedUsers.values()));
  });
});

// Serve React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});