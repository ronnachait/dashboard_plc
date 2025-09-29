import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // 👈 ให้ build เป็น standalone
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      serialport: false,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig;
