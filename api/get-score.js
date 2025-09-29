import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
    ca: (process.env.AIVEN_CA_CERT || '').replace(/\\n/g, '\n'),
  },
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  const { uid } = req.query;
  if (!uid) {
    return res.status(400).json({ status: 'error', message: 'Missing User ID (UID)' });
  }

  try {
    const query = `
      SELECT uid, name, room AS classroom, passport, telephone AS tel, score
      FROM users 
      WHERE uid = $1
    `;
    const result = await pool.query(query, [uid]);

    if (result.rows.length === 0) {
      return res.status(200).json({ status: 'not found' });
    }

    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    console.error('Database Fetch Error:', error.message);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
}
