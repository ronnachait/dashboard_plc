// lib/menuItems.ts
import {
  Gauge,
  Fuel,
  Router,
  History,
  DatabaseBackup,
  LogOut,
  Bubbles,
  Construction,
} from "lucide-react";

export const menuItems = [
  { label: "Dashboard", Icon: Gauge, path: "/plc" },
  { label: "Fuel Use", Icon: Fuel, path: "/fuel-use" },
  { label: "Maintenance", Icon: Construction, path: "/maintenance" },
  { label: "Grease", Icon: Bubbles, path: "/grease" },
  { label: "Raspberry Pi5", Icon: Router, path: "/pi-moniter" },
  { label: "History", Icon: History, path: "/history" },
  { label: "Backup", Icon: DatabaseBackup, path: "/backup" },
  { label: "Logout", Icon: LogOut, path: "/logout", isLogout: true }, // ✅ เผื่อ Logout
];
