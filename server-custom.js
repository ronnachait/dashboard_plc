import { createServer } from "http";
import express from "express";
import next from "next";
import { WebSocketServer } from "ws";

const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || 3000;

// ✅ ใช้ root project เสมอ
const app = next({ dev, dir: "." });
const handle = app.getRequestHandler();

async function start() {
  try {
    await app.prepare();

    const server = express();

    // 🩺 Health Check endpoint
    server.get("/healthz", (req, res) => {
      res.status(200).send("ok");
    });

    // 🔗 Next.js routes
    server.all("*", (req, res) => handle(req, res));

    const httpServer = createServer(server);

    const wss = new WebSocketServer({ server: httpServer });
    const clients = new Set();

    wss.on("connection", (ws) => {
      clients.add(ws);
      console.log("🔌 WS client connected, total:", clients.size);

      ws.on("message", (msg) => {
        try {
          const data = JSON.parse(msg.toString());
          console.log("📨 WS received:", data);

          const payload = JSON.stringify(data);
          clients.forEach((client) => {
            if (client.readyState === 1) client.send(payload);
          });
        } catch (err) {
          console.error("❌ WS parse error:", err?.message || err);
        }
      });

      ws.on("close", () => {
        clients.delete(ws);
        console.log("❌ WS client disconnected, total:", clients.size);
      });
    });

    httpServer.listen(port, () => {
      console.log(`🚀 Server ready on http://localhost:${port}`);
      console.log(`🔗 WS ready on ws://localhost:${port}`);
    });
  } catch (err) {
    console.error("❌ Server failed:", err);
    process.exit(1);
  }
}

start();
