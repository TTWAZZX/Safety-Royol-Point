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
    const result = await pool.query('SELECT now() AS now');
    res.status(200).json({ ok: true, now: result.rows[0].now });
  } catch (error) {
    console.error('DB Health Check Error:', error);
    res.status(500).json({ ok: false, error: error.message, stack: error.stack });
  }
}
