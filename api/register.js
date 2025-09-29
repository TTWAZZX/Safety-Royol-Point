// register.js
const pool = require("../db");

module.exports = async function registerHandler(req, res) {
  const { uid, name, room, dob, passport, telephone } = req.body || {};
  if (!uid || !name || !room || !passport) {
    return res.status(400).json({ status: "error", message: "Missing required fields" });
  }

  try {
    // ถ้าคอลัมน์ไม่ตรง ปรับชื่อให้ตรงกับตารางจริงของคุณ
    const q = `
      INSERT INTO users (uid, name, room, dob, passport, telephone, score)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (uid) DO NOTHING
      RETURNING uid
    `;
    const r = await pool.query(q, [uid, name, room, dob || null, passport, telephone || null, 0]);

    if (r.rowCount > 0) {
      return res.json({ status: "success", message: "Registration complete." });
    }
    return res.status(409).json({ status: "error", message: "User already registered" });
  } catch (e) {
    console.error("POST /api/register error:", e.stack || e);
    return res.status(500).json({ status: "error", message: e.message || "Internal Server Error" });
  }
};
