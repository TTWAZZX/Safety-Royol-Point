import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
    ca: (process.env.AIVEN_CA_CERT || '').replace(/\\n/g, '\n'),
  },
});

export default async function handler(req, res) {
  try {
    const result = await pool.query("SELECT now() as now"); // เช็คว่า DB ตอบได้ไหม
    res.status(200).json({
      ok: true,
      now: result.rows[0].now,
    });
  } catch (err) {
    console.error("DB Health Check Error:", err);
    res.status(500).json({
      ok: false,
      error: err.message || String(err),
    });
  }
}
