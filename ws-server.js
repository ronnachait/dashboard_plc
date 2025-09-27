// ws-server.js
import { WebSocketServer } from "ws";
import express from "express";

const PORT = 8090;
const clients = new Set();

// Start WebSocket server
const wss = new WebSocketServer({ port: PORT });
console.log(`🚀 WebSocket server running at ws://localhost:${PORT}`);

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log("🔌 Client connected, total:", clients.size);

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      console.log("📨 Received from client:", data);

      // forward ไปทุก client ที่ connect (รวม Dashboard)
      broadcast(data.event, data.payload);
    } catch (err) {
      console.error("❌ Invalid WS message:", err.message);
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("❌ Client disconnected, total:", clients.size);
  });
});

// Broadcast function
function broadcast(event, payload) {
  const msg = JSON.stringify({ event, payload });
  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(msg);
    }
  });
}

// ✅ HTTP Relay server
const app = express();
app.use(express.json());

app.post("/broadcast", (req, res) => {
  const { event, payload } = req.body;
  broadcast(event, payload);
  res.json({ ok: true });
});

app.listen(8091, () => {
  console.log("🌐 Relay HTTP server on http://localhost:8091");
});
