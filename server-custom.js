// server-custom.js
import { createServer } from "http";
import next from "next";
import { WebSocketServer } from "ws";
import express from "express";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

app.prepare().then(() => {
  const expressApp = express();
  const server = createServer(expressApp);

  // ✅ WebSocket server share port
  const wss = new WebSocketServer({ server });
  const clients = new Set();

  wss.on("connection", (ws) => {
    clients.add(ws);
    console.log("🔌 WS connected:", clients.size);

    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        console.log("📨 WS msg:", data);

        // broadcast to all
        for (const c of clients) {
          if (c.readyState === 1) c.send(JSON.stringify(data));
        }
      } catch (err) {
        console.error("❌ Invalid WS message:", err.message);
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
      console.log("❌ WS disconnected:", clients.size);
    });
  });

  // ✅ HTTP relay endpoint (แทน 8091 เดิม)
  expressApp.use(express.json());
  expressApp.post("/broadcast", (req, res) => {
    const { event, payload } = req.body;
    const msg = JSON.stringify({ event, payload });
    for (const c of clients) {
      if (c.readyState === 1) c.send(msg);
    }
    res.json({ ok: true });
  });

  // ✅ Next.js handle
  expressApp.all("*", (req, res) => handle(req, res));

  server.listen(port, () => {
    console.log(`🚀 Server ready on http://localhost:${port}`);
  });
});
