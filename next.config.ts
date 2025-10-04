/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sattstorage.blob.core.windows.net",
        port: "",
        pathname: "/grease-pictures/**",
      },
    ],
  },
};
https: module.exports = nextConfig;
