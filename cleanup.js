// cleanup.js
import pkg from "pg";
const { Client } = pkg;

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL, // ตั้งค่าใน Azure App Service -> Configuration
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const res = await client.query(`
      DELETE FROM plc_logs
      WHERE created_at < NOW() - INTERVAL '30 days';
    `);

    console.log(`✅ Deleted ${res.rowCount} old records`);
  } catch (err) {
    console.error("❌ Cleanup error:", err);
  } finally {
    await client.end();
  }
}

main();
