import { createServer } from "http";
import express from "express";
import next from "next";
import { WebSocketServer } from "ws";

const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || 3000;

// ✅ ชี้ dir ให้ถูกต้องเวลา build (ใช้ .next/standalone ใน production)
const dir = dev ? "." : __dirname;

// ✅ Init Next.js
const app = next({ dev, dir });
const handle = app.getRequestHandler();

async function start() {
  try {
    await app.prepare();

    // ✅ Express server
    const server = express();

    // 🔗 Next.js routes
    server.all("*", (req, res) => handle(req, res));

    // ✅ สร้าง HTTP server ร่วม
    const httpServer = createServer(server);

    // ✅ Attach WebSocket ไปที่ server เดียวกัน
    const wss = new WebSocketServer({ server: httpServer });

    const clients = new Set();

    wss.on("connection", (ws) => {
      clients.add(ws);
      console.log("🔌 WS client connected, total:", clients.size);

      ws.on("message", (msg) => {
        try {
          const data = JSON.parse(msg.toString());
          console.log("📨 WS received:", data);

          // broadcast กลับไปทุก client
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

    // ✅ Start server
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
