module.exports = {
  apps: [
    {
      name: "next",
      script: "node_modules/next/dist/bin/next",
      args: "start -p " + (process.env.PORT || 3000),
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "ws",
      script: "ws-server.js",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
