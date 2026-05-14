# Collaborative Canvas Drawing App 🎨

A real-time collaborative drawing application that allows multiple users to draw simultaneously on a shared canvas using WebSocket technology.

## ✨ Features

- **Real-time Collaboration**: Multiple users can draw on the same canvas simultaneously
- **Multiple Drawing Tools**:
  - Freehand Brush
  - Rectangle
  - Circle (with radius guide line)
  - Line
- **Customizable**:
  - Color picker
  - Adjustable brush size (1-50px)
- **Canvas Operations**:
  - Clear canvas (affects all users)
  - Undo last shape (removes most recent shape from any user)
  - Save drawing as PNG image
- **Real-time User Status**:
  - Live user count
  - Connection status indicator

## 🚀 Technologies Used

### Frontend

- React.js
- HTML5 Canvas API
- Socket.io-client

### Backend

- Node.js
- Express.js
- Socket.io

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## 🛠️ Installation

### 1. Clone the repository

````bash
git clone <your-repository-url>
cd canvas-app

## 2. Install Dependencies

```bash
npm install
````

This will install all required dependencies including:

- **express** — Web server
- **socket.io** & **socket.io-client** — WebSocket communication
- **cors** — Cross-origin resource sharing
- **concurrently** — Run multiple scripts
- **nodemon** — Auto-restart server on changes

---

## 3. Project Structure

```
canvas-app/
├── public/
├── src/
│   ├── App.js          # Main React component
│   ├── App.css         # Styling
│   └── index.js        # Entry point
├── server.js           # WebSocket server
├── package.json
└── README.md
```

---

## 🏃‍♂️ Running the Application

### Start Both Server and Client (Recommended)

```bash
npm start
```

This will start:

- **Frontend:** http://localhost:3000
- **Backend WebSocket:** http://localhost:3001

### Start Separately (for Debugging)

**Terminal 1 — Backend Server:**

```bash
npm run server
```

**Terminal 2 — React Client:**

```bash
npm run client
```

---

## 🎮 How to Use

### Drawing Tools

- **Select Tool:** Choose from Brush, Rectangle, Circle, or Line from the dropdown
- **Choose Color:** Click the color picker to select your drawing color
- **Adjust Size:** Use the slider to change brush size (1–50px)
- **Draw:** Click and drag on the canvas to draw

### Special Features

- **Circle Tool:** Displays a dashed guide line showing the radius from center to cursor
- **Brush Tool:** Shows real-time drawing preview as you move the mouse

### Canvas Controls

- **Undo:** Removes the most recently added shape from the canvas (works across all users)
- **Clear Canvas:** Removes all drawings for all users
- **Save Image:** Downloads the current canvas as a PNG file

---

## 👥 Testing Multi-User Collaboration

1. Open the app in two different browsers (Chrome, Firefox, Edge)
2. Navigate to `http://localhost:3000` in both
3. You should see the connection status showing **🟢 Connected**
4. Draw in one browser — the drawing appears instantly in the other browser
5. User count shows how many people are currently online

### Test on Different Devices (Same Network)

Find your computer's IP address:

- **Windows:** `ipconfig` (look for IPv4 Address)
- **Mac/Linux:** `ifconfig` or `ip addr`
  Update the socket connection in `src/App.js`:

```javascript
const newSocket = io("http://YOUR_IP_ADDRESS:3001");
```

Access from other devices: `http://YOUR_IP_ADDRESS:3000`

---

## 🔧 Troubleshooting

### Port Conflicts

If ports 3000 or 3001 are already in use:

**Windows:**

```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Mac/Linux:**

```bash
lsof -i :3000
kill -9 <PID>
```

### Missing Dependencies

If you encounter module not found errors:

```bash
rm -rf node_modules package-lock.json
npm install
```

### WebSocket Connection Issues

- Ensure both server and client are running
- Check firewall settings for ports 3000 and 3001
- Verify the socket connection URL in `App.js` matches your server

---

## 📡 WebSocket Events

### Client to Server

| Event          | Description              |
| -------------- | ------------------------ |
| `new-shape`    | Send a newly drawn shape |
| `clear-canvas` | Clear entire canvas      |
| `undo-shape`   | Remove the last shape    |

### Server to Client

| Event            | Description                          |
| ---------------- | ------------------------------------ |
| `initial-shapes` | Send existing shapes to new user     |
| `shape-added`    | Broadcast new shape to all users     |
| `canvas-cleared` | Notify all users canvas was cleared  |
| `shape-removed`  | Notify all users a shape was removed |
| `users-updated`  | Update user count for all clients    |

---

## 🎨 Canvas Features

### Shape Persistence

- All drawings are stored server-side
- New users see the complete drawing history
- Shapes remain visible across tool changes

### Drawing Logic

| Tool          | Behavior                                             |
| ------------- | ---------------------------------------------------- |
| **Brush**     | Stores points and redraws as connected lines         |
| **Rectangle** | Stores start/end coordinates                         |
| **Circle**    | Stores center and radius (calculated from start/end) |
| **Line**      | Stores start and end points                          |

### Performance Optimizations

- Efficient canvas redrawing using stored shape data
- Temporary shape preview without affecting saved drawings
- Debounced drawing events for smooth performance

---

## 📱 Browser Support

- Chrome _(recommended)_
- Firefox
- Edge
- Safari _(latest version)_

---

## 🐛 Known Issues

- Mobile touch support is limited (desktop-optimized)
- Very large brush sizes (50px) may cause performance issues on older devices

---

## 🔮 Future Enhancements

- Touch screen support for mobile devices
- Additional drawing tools (polygon, star, text)
- Fill color and gradient support
- Layer system
- Drawing history timeline
- Export as SVG or PDF
- User authentication and saved drawings
