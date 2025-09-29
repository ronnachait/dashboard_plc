import { createServer } from "http";
import express from "express";
import next from "next";
import { WebSocketServer } from "ws";

const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || 3000;

// ✅ Init Next.js
const app = next({ dev });
const handle = app.getRequestHandler();

// เก็บ client ที่ connect
const clients = new Set();

async function start() {
  await app.prepare();

  const expressApp = express();
  expressApp.use(express.json());

  // ✅ Health check (เอาไว้ให้ workflow ping ได้)
  expressApp.get("/healthz", (req, res) => {
    res.status(200).send("ok");
  });

  // ✅ Relay endpoint
  expressApp.post("/broadcast", (req, res) => {
    const { event, payload } = req.body;
    broadcast(event, payload);
    res.json({ ok: true });
  });

  // ✅ Next.js routes
  expressApp.all("*", (req, res) => handle(req, res));

  // ✅ HTTP + WebSocket ใช้ server เดียว
  const server = createServer(expressApp);

  const wss = new WebSocketServer({ server });
  wss.on("connection", (ws) => {
    clients.add(ws);
    console.log("🔌 WS client connected:", clients.size);

    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        console.log("📨 WS received:", data);
        broadcast(data.event, data.payload);
      } catch (err) {
        console.error("❌ WS parse error:", err.message);
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
      console.log("❌ WS client disconnected:", clients.size);
    });
  });

  function broadcast(event, payload) {
    const msg = JSON.stringify({ event, payload });
    clients.forEach((c) => {
      if (c.readyState === 1) c.send(msg);
    });
  }

  server.listen(port, () => {
    console.log(`🚀 App ready on http://localhost:${port}`);
    console.log(`🔗 WS ready on ws://localhost:${port}`);
  });
}

start();
