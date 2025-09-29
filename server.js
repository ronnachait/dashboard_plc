import { createServer } from "http";
import express from "express";
import next from "next";
import { WebSocketServer } from "ws";

const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || 3000; // 👈 ต้องใช้ PORT ของ Azure

const app = next({ dev });
const handle = app.getRequestHandler();

const clients = new Set();

async function start() {
  console.log("📦 Server.js loaded, starting...");
  await app.prepare();

  const expressApp = express();
  expressApp.use(express.json());

  // ✅ health check
  expressApp.get("/healthz", (_, res) => res.status(200).send("ok"));

  // ✅ next routes
  expressApp.all("*", (req, res) => handle(req, res));

  // ✅ http + websocket
  const server = createServer(expressApp);

  const wss = new WebSocketServer({ server });
  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.on("close", () => clients.delete(ws));
  });

  server.listen(port, () => {
    console.log(`🚀 App ready on http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error("🔥 Fatal server error:", err);
});
