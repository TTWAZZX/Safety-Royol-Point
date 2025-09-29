// ไฟล์: api/add-score.js

import { Pool } from 'pg';

// 🚨 ใส่ AIVEN_URI ที่มีรหัสผ่านของคุณเอง
const AIVEN_URI = 'postgres://avnadmin:[YOUR_AIVEN_PASSWORD]@pg-royalpoint-xxxx.aivencloud.com:17000/defaultdb?sslmode=require'; 

// 💡 แก้ไข: เพิ่ม object ssl: { rejectUnauthorized: false }
const pool = new Pool({ 
    connectionString: AIVEN_URI, 
    ssl: {
        rejectUnauthorized: false 
    }
}); 

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
    }

    const { uid, code, type } = req.body; 

    if (!uid || !code || !type) {
        return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN'); // เริ่ม Transaction

        // 1. ตรวจสอบคูปองและล็อกแถว
        const couponCheckQuery = `
            SELECT point, status FROM coupons 
            WHERE code = $1
            FOR UPDATE; 
        `;
        const couponResult = await client.query(couponCheckQuery, [code]);

        if (couponResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ status: 'invalid', message: 'คูปองไม่ถูกต้อง' });
        }

        const coupon = couponResult.rows[0];
        if (coupon.status !== 'AVAILABLE') {
            await client.query('ROLLBACK');
            return res.status(409).json({ status: 'used', message: 'รหัสนี้ถูกใช้ไปแล้ว' });
        }
        
        const pointToAdd = coupon.point;

        // 2. อัปเดตสถานะคูปอง (ใช้คอลัมน์ 'claimer_ui' ที่แก้ไขใน DB)
        const updateCouponQuery = `
            UPDATE coupons 
            SET status = 'USED', claimer_ui = $1, claimed_at = NOW() 
            WHERE code = $2;
        `;
        await client.query(updateCouponQuery, [uid, code]);

        // 3. อัปเดตคะแนนผู้ใช้
        const updateScoreQuery = `
            UPDATE users 
            SET score = score + $1
            WHERE uid = $2
            RETURNING score;
        `;
        const scoreResult = await client.query(updateScoreQuery, [pointToAdd, uid]);

        if (scoreResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(403).json({ status: 'error', message: 'User not registered' });
        }

        await client.query('COMMIT'); // ยืนยัน Transaction
        
        res.status(200).json({ 
            status: 'success', 
            point: pointToAdd
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Add Score Transaction Error:", error.message);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    } finally {
        client.release();
    }
}