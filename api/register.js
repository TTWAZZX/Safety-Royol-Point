// ไฟล์: api/register.js

import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://avnadmin:[AVNS_hC-iLtAfC3aaFCg5pKi]@pg-royalpoint-xxxx.aivencloud.com:17000/defaultdb?sslmode=require'; // เพิ่ม Default
const pool = new Pool({ connectionString: DATABASE_URL });

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
    }

    try {
        const { uid, name, room, dob, passport, telephone } = req.body;
        
        if (!uid || !name || !room || !passport) {
            return res.status(400).json({ status: 'error', message: 'Missing required fields' });
        }

        // คำสั่ง SQL สำหรับลงทะเบียน (ป้องกันการลงทะเบียนซ้ำด้วย ON CONFLICT)
        const query = `
            INSERT INTO users (uid, name, room, dob, passport, telephone, score)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (uid) DO NOTHING 
            RETURNING uid;
        `;
        
        const result = await pool.query(query, [uid, name, room, dob, passport, telephone, 0]);

        if (result.rowCount > 0) {
            res.status(200).json({ status: 'success', message: 'Registration complete.' });
        } else {
            res.status(409).json({ status: 'error', message: 'User already registered' });
        }

    } catch (error) {
        console.error("Registration DB Error:", error.message);
        res.status(500).json({ status: 'error', message: 'Internal Server Error', detail: error.message });
    }
}