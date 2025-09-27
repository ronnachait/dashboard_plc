"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// server.ts (ใช้ TypeScript จะได้ type ครบ)
var http_1 = require("http");
var next_1 = require("next");
var ws_1 = require("ws");
var port = process.env.PORT || 3000;
var dev = process.env.NODE_ENV !== "production";
var app = (0, next_1.default)({ dev: dev });
var handle = app.getRequestHandler();
app.prepare().then(function () {
    var server = (0, http_1.createServer)(function (req, res) {
        handle(req, res);
    });
    // 🟢 Attach WebSocket server
    var wss = new ws_1.WebSocketServer({ server: server });
    wss.on("connection", function (ws) {
        console.log("🔌 Client connected");
        ws.send(JSON.stringify({ event: "WELCOME", payload: "Hello from WebSocket" }));
        ws.on("message", function (msg) {
            console.log("📨 Received:", msg.toString());
            ws.send(JSON.stringify({ event: "ECHO", payload: msg.toString() }));
        });
        ws.on("close", function () {
            console.log("❌ Client disconnected");
        });
    });
    server.listen(port, function () {
        console.log("\uD83D\uDE80 Server ready at http://localhost:".concat(port));
    });
});
