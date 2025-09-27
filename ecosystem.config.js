module.exports = {
  apps: [
    {
      name: "nextjs",
      script: "./server.js", // มาจาก .next/standalone
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 3000, // Azure จะ set PORT ให้อัตโนมัติ
        DATABASE_URL: process.env.DATABASE_URL,
        PI_API_KEY: process.env.PI_API_KEY,
      },
    },
    {
      name: "dashboard",
      script: "server-custom.js",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 3000,
      },
    },
  ],
};
