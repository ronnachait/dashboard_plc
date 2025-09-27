import net from "net";
import Modbus from "jsmodbus";

// สร้าง TCP Server
const server = new net.Server();
const holdingRegisters = Buffer.alloc(10000);
const coils = Buffer.alloc(1000);

// ค่า mock เริ่มต้น
holdingRegisters.writeUInt16BE(25, 100 * 2); // D100
holdingRegisters.writeUInt16BE(5, 101 * 2); // D101

const serverTCP = new Modbus.server.TCP(server, {
  holding: holdingRegisters,
  coils: coils,
});

serverTCP.on("connection", () => {
  console.log("📡 Mock PLC connected");
});

// อัพเดทค่าเรื่อย ๆ
setInterval(() => {
  const temp = 20 + Math.floor(Math.random() * 10);
  const pressure = 3 + Math.floor(Math.random() * 5);
  holdingRegisters.writeUInt16BE(temp, 100 * 2);
  holdingRegisters.writeUInt16BE(pressure, 101 * 2);
}, 5000);

server.listen(5020, () => {
  console.log("✅ Mock PLC listening on port 5020");
});
