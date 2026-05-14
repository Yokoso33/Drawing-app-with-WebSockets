import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

const CanvasApp = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState('brush');
  const [shapes, setShapes] = useState([]);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPath, setCurrentPath] = useState([]);
  const [socket, setSocket] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState([]);

  // Initialize canvas only once
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;
    
    // Set initial background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('initial-shapes', (initialShapes) => {
      console.log('Received initial shapes:', initialShapes.length);
      setShapes(initialShapes);
    });

    newSocket.on('shape-added', (shape) => {
      console.log('Shape added from server:', shape.id);
      // Replace temporary shape with server shape or add new one
      setShapes(prev => {
        // Remove any temporary shapes with the same data (optional)
        // and add the server shape
        return [...prev.filter(s => !s.id.startsWith('temp-')), shape];
      });
    });

    newSocket.on('canvas-cleared', () => {
      console.log('Canvas cleared from server');
      setShapes([]);
      clearLocalCanvas();
    });

    newSocket.on('shape-removed', (shapeId) => {
      console.log('Shape removed from server:', shapeId);
      setShapes(prev => prev.filter(shape => shape.id !== shapeId));
    });

    newSocket.on('users-updated', (users) => {
      setConnectedUsers(users);
    });

    return () => newSocket.close();
  }, []);

  // Redraw everything whenever shapes change
  useEffect(() => {
    redrawCanvas();
  }, [shapes]);

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    const pos = getMousePos(e);
    setIsDrawing(true);
    setStartPos(pos);

    if (tool === 'brush') {
      setCurrentPath([pos]);
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const ctx = canvasRef.current.getContext('2d');
    const pos = getMousePos(e);

    if (tool === 'brush') {
      // For brush, we need to draw in real-time without clearing the canvas
      // This gives the user immediate visual feedback
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (currentPath.length > 0) {
        ctx.beginPath();
        ctx.moveTo(currentPath[currentPath.length - 1].x, currentPath[currentPath.length - 1].y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
      
      setCurrentPath(prev => [...prev, pos]);
    } else {
      // For shapes (rectangle, circle, line), use the existing approach
      // First, redraw all existing shapes
      redrawCanvas();

      // Then draw the temporary shape on top
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      switch (tool) {
        case 'rectangle':
          ctx.strokeRect(
            startPos.x,
            startPos.y,
            pos.x - startPos.x,
            pos.y - startPos.y
          );
          break;
        
        case 'circle':
          const radius = Math.sqrt(
            Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2)
          );
          
          // Draw the circle outline
          ctx.beginPath();
          ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
          
          // Draw dashed line from center to current mouse position
          drawDashedLine(ctx, startPos.x, startPos.y, pos.x, pos.y);
          break;
        
        case 'line':
          ctx.beginPath();
          ctx.moveTo(startPos.x, startPos.y);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
          break;
        
        default:
          break;
      }
    }
  };

  const drawDashedLine = (ctx, fromX, fromY, toX, toY, dashLength = 5) => {
    ctx.save();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.restore();
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Redraw all saved shapes
    shapes.forEach(shape => {
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([]);
      
      switch (shape.type) {
        case 'brush':
          if (shape.points && shape.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(shape.points[0].x, shape.points[0].y);
            for (let i = 1; i < shape.points.length; i++) {
              ctx.lineTo(shape.points[i].x, shape.points[i].y);
            }
            ctx.stroke();
          }
          break;
        
        case 'rectangle':
          ctx.strokeRect(
            shape.startX,
            shape.startY,
            shape.endX - shape.startX,
            shape.endY - shape.startY
          );
          break;
        
        case 'circle':
          const radius = Math.sqrt(
            Math.pow(shape.endX - shape.startX, 2) + 
            Math.pow(shape.endY - shape.startY, 2)
          );
          ctx.beginPath();
          ctx.arc(shape.startX, shape.startY, radius, 0, 2 * Math.PI);
          ctx.stroke();
          break;
        
        case 'line':
          ctx.beginPath();
          ctx.moveTo(shape.startX, shape.startY);
          ctx.lineTo(shape.endX, shape.endY);
          ctx.stroke();
          break;
        
        default:
          break;
      }
    });
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    
    const pos = getMousePos(e);

    // Only create a new shape if we actually drew something meaningful
    let newShape = null;
    let shouldSendShape = false;
    
    switch (tool) {
      case 'brush':
        if (currentPath.length > 2) { // Need at least 2 points for a brush stroke
          newShape = {
            type: 'brush',
            points: [...currentPath],
            color: color,
            lineWidth: brushSize
          };
          shouldSendShape = true;
          
          // For brush, we need to redraw the canvas to ensure the brush stroke
          // is properly integrated with other shapes
          setTimeout(() => {
            redrawCanvas();
          }, 0);
        }
        break;
      
      case 'rectangle':
        // Only create rectangle if it has some size
        if (Math.abs(pos.x - startPos.x) > 5 || Math.abs(pos.y - startPos.y) > 5) {
          newShape = {
            type: 'rectangle',
            startX: startPos.x,
            startY: startPos.y,
            endX: pos.x,
            endY: pos.y,
            color: color,
            lineWidth: brushSize
          };
          shouldSendShape = true;
        }
        break;
      
      case 'circle':
        const radius = Math.sqrt(
          Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2)
        );
        if (radius > 5) { // Only create circle if radius is meaningful
          newShape = {
            type: 'circle',
            startX: startPos.x,
            startY: startPos.y,
            endX: pos.x,
            endY: pos.y,
            color: color,
            lineWidth: brushSize
          };
          shouldSendShape = true;
        }
        break;
      
      case 'line':
        // Only create line if it has some length
        if (Math.abs(pos.x - startPos.x) > 5 || Math.abs(pos.y - startPos.y) > 5) {
          newShape = {
            type: 'line',
            startX: startPos.x,
            startY: startPos.y,
            endX: pos.x,
            endY: pos.y,
            color: color,
            lineWidth: brushSize
          };
          shouldSendShape = true;
        }
        break;
      
      default:
        break;
    }

    if (newShape && shouldSendShape) {
      // For brush, add a temporary shape locally for immediate feedback
      if (tool === 'brush') {
        const tempShape = {
          ...newShape,
          id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: socket?.id || 'local',
          timestamp: new Date()
        };
        setShapes(prev => [...prev, tempShape]);
      }
      
      // Send to server
      if (socket) {
        console.log('Sending new shape to server');
        socket.emit('new-shape', newShape);
      } else {
        // Only add locally if no socket (offline mode)
        const shapeWithId = {
          ...newShape,
          id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: 'local',
          timestamp: new Date()
        };
        setShapes(prev => [...prev, shapeWithId]);
      }
    }

    setIsDrawing(false);
    setCurrentPath([]);
  };

  const clearCanvas = () => {
    if (socket) {
      socket.emit('clear-canvas');
    } else {
      clearLocalCanvas();
      setShapes([]);
    }
  };

  const clearLocalCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const undoLast = () => {
    if (socket) {
      console.log('Sending undo request');
      socket.emit('undo-shape');
    } else if (shapes.length > 0) {
      // Local undo if no socket
      setShapes(prev => prev.slice(0, -1));
    }
  };

  const saveCanvas = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = 'collaborative-drawing.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="app">
      <h1>Collaborative Canvas Drawing App</h1>
      
      <div className="connection-status">
        <div className={`status ${socket ? 'connected' : 'disconnected'}`}>
          {socket ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
        <div className="user-count">
          👥 {connectedUsers.length} user(s) online
        </div>
      </div>
      
      <div className="toolbar">
        <div className="tool-group">
          <label>Tool:</label>
          <select 
            value={tool} 
            onChange={(e) => setTool(e.target.value)}
            className="tool-select"
          >
            <option value="brush">Brush</option>
            <option value="rectangle">Rectangle</option>
            <option value="circle">Circle</option>
            <option value="line">Line</option>
          </select>
        </div>

        <div className="tool-group">
          <label>Color:</label>
          <input 
            type="color" 
            value={color} 
            onChange={(e) => setColor(e.target.value)}
            className="color-picker"
          />
        </div>

        <div className="tool-group">
          <label>Brush Size: {brushSize}px</label>
          <input 
            type="range" 
            min="1" 
            max="50" 
            value={brushSize} 
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="brush-slider"
          />
        </div>

        <div className="tool-group">
          <button onClick={undoLast} className="btn btn-undo" disabled={shapes.length === 0}>
            Undo Last Shape
          </button>
          <button onClick={clearCanvas} className="btn btn-clear">
            Clear Canvas
          </button>
          <button onClick={saveCanvas} className="btn btn-save">
            Save Image
          </button>
        </div>
      </div>

      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          className="drawing-canvas"
        />
      </div>

      <div className="instructions">
        <h3>Instructions:</h3>
        <ul>
          <li>Select a tool from the dropdown</li>
          <li>Choose color and brush size</li>
          <li>Click and drag to draw</li>
          <li><strong>Brush:</strong> See real-time drawing as you move the mouse</li>
          <li><strong>Real-time Collaboration:</strong> Multiple users can draw simultaneously</li>
          <li><strong>For Circle:</strong> Dashed line shows the radius from center to cursor</li>
          <li>All shapes are synchronized across all users</li>
          <li><strong>Undo:</strong> Removes the last shape from the canvas (any user's shape)</li>
          <li>Use Clear Canvas to clear for all users</li>
          <li>Save your drawing as PNG</li>
        </ul>
      </div>
    </div>
  );
};

export default CanvasApp;