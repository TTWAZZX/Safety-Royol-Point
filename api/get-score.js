// ไฟล์: api/get-score.js

import { Pool } from 'pg';

// ดึง Connection String จาก Environment Variables ใน Vercel
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
    }

    // รับ Line UID จาก Query Parameter
    const { uid } = req.query;

    if (!uid) {
        return res.status(400).json({ status: 'error', message: 'Missing User ID (UID)' });
    }

    try {
        const query = `
            -- Note: เราใช้ชื่อคอลัมน์ใน DB ตามที่คุณได้แก้ไขไปแล้ว (เช่น claimer_ui)
            SELECT uid, name, room AS classroom, passport, telephone AS tel, score
            FROM users 
            WHERE uid = $1
        `;
        
        const result = await pool.query(query, [uid]);

        if (result.rows.length === 0) {
            // ไม่พบผู้ใช้ใน DB
            return res.status(200).json({ status: 'not found' }); 
        }

        // ส่งข้อมูลผู้ใช้กลับไปให้ Frontend
        res.status(200).json({ status: 'success', data: result.rows[0] });

    } catch (error) {
        console.error("Database Fetch Error:", error.message);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
}