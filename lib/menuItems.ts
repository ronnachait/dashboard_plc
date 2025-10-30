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
  Thermometer,
  FolderKanban,
  Settings,
  CircleCheckBig,
  Cog,
  Users,
} from "lucide-react";

export const menuItems = [
  {
    label: "Dashboard",
    Icon: Gauge,
    path: "/plc",
  },

  // 📊 Report Dropdown
  {
    label: "Report",
    Icon: FolderKanban,
    children: [
      { label: "Daily Report", Icon: CircleCheckBig, path: "/daily-check" },
      { label: "Problem Report", Icon: Cog, path: "/problem/report" },
      { label: "Fuel Use", Icon: Fuel, path: "/fuel-use" },
      { label: "Temp / Pressure", Icon: Thermometer, path: "/temp-pressure" },
      { label: "Maintenance", Icon: Construction, path: "/maintenance" },
      { label: "Grease", Icon: Bubbles, path: "/grease" },
    ],
  },

  // ⚙️ System Dropdown
  {
    label: "System",
    Icon: Settings,
    children: [
      { label: "Raspberry Pi5", Icon: Router, path: "/pi-moniter" },
      { label: "History", Icon: History, path: "/history" },
      { label: "Backup", Icon: DatabaseBackup, path: "/backup" },
      { label: "Users", Icon: Users, path: "/users" },
    ],
  },

  // 🚪 Logout
  {
    label: "Logout",
    Icon: LogOut,
    path: "/logout",
    isLogout: true,
  },
];
