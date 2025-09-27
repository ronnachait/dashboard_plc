// server.ts (ใช้ TypeScript จะได้ type ครบ)
import { createServer } from "http";
import next from "next";
import { WebSocketServer } from "ws";

const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  // 🟢 Attach WebSocket server
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("🔌 Client connected");

    ws.send(
      JSON.stringify({ event: "WELCOME", payload: "Hello from WebSocket" })
    );

    ws.on("message", (msg) => {
      console.log("📨 Received:", msg.toString());
      ws.send(JSON.stringify({ event: "ECHO", payload: msg.toString() }));
    });

    ws.on("close", () => {
      console.log("❌ Client disconnected");
    });
  });

  server.listen(port, () => {
    console.log(`🚀 Server ready at http://localhost:${port}`);
  });
});
