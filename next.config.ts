import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // 👈 สำคัญสำหรับ Azure
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      serialport: false, // 👈 บอก Webpack ว่าไม่ต้องหา module นี้
    };
    return config;
  },
};

export default nextConfig;
