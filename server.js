// server.js
const path = require("path");
const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());
// ✅ รองรับ form-urlencoded (เช่น $.ajaxForm)
app.use(express.urlencoded({ extended: true }));

// ======= Postgres (Aiven) =======
function normalizeCA(input) {
  if (!input) return null;
  // รองรับทั้งแบบหลายบรรทัดจริง และแบบ \n ใน ENV
  return input.includes("\\n") ? input.replace(/\\n/g, "\n") : input;
}
const ca = normalizeCA(process.env.AIVEN_CA_CERT);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // ควรลงท้าย ?sslmode=require
  ssl: ca
    ? { rejectUnauthorized: true, ca }
    : { require: true, rejectUnauthorized: false }, // ถ้าไม่มี CA ให้ต่อแบบผ่อนปรน (ชั่วคราว)
});

// ======= เสิร์ฟเว็บหน้าแรก =======
const ROOT = __dirname; // ที่เดียวกับ index.html
app.use(express.static(ROOT)); // ให้เสิร์ฟไฟล์ static (index.html, script.js, รูป ฯลฯ)

app.get("/", (req, res) => {
  res.sendFile(path.join(ROOT, "index.html"));
});

// ======= Health check =======
app.get("/api/health", async (req, res) => {
  try {
    const r = await pool.query("SELECT now() AS now");
    res.json({
      ok: true,
      now: r.rows[0].now,
      meta: { caPresent: Boolean(ca), hasSslmode: /\bsslmode=require\b/i.test(process.env.DATABASE_URL || "") },
    });
  } catch (e) {
    console.error("DB Health Check Error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ======= /api/get-score =======
app.get("/api/get-score", async (req, res) => {
  const { uid } = req.query;
  if (!uid) return res.status(400).json({ status: "error", message: "Missing uid" });
  try {
    const q = `SELECT uid, name, room AS classroom, passport, telephone AS tel, score FROM users WHERE uid=$1`;
    const r = await pool.query(q, [uid]);
    if (r.rows.length === 0) return res.json({ status: "not found" });
    res.json({ status: "success", data: r.rows[0] });
  } catch (e) {
    console.error("get-score error:", e);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

// ======= /api/register =======
app.post("/api/register", async (req, res) => {
  const { uid, name, room, dob, passport, telephone } = req.body || {};
  if (!uid || !name || !room || !passport) return res.status(400).json({ status: "error", message: "Missing required fields" });
  try {
    const q = `
      INSERT INTO users (uid, name, room, dob, passport, telephone, score)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (uid) DO NOTHING
      RETURNING uid;
    `;
    const r = await pool.query(q, [uid, name, room, dob, passport, telephone, 0]);
    if (r.rowCount > 0) return res.json({ status: "success", message: "Registration complete." });
    res.status(409).json({ status: "error", message: "User already registered" });
  } catch (e) {
    console.error("register error:", e);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

// ======= /api/add-score =======
app.post("/api/add-score", async (req, res) => {
  const { uid, code, type } = req.body || {};
  if (!uid || !code || !type) return res.status(400).json({ status: "error", message: "Missing required fields" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const r1 = await client.query(`SELECT point, status FROM coupons WHERE code=$1 FOR UPDATE`, [code]);
    if (r1.rows.length === 0) { await client.query("ROLLBACK"); return res.status(404).json({ status: "invalid", message: "คูปองไม่ถูกต้อง" }); }
    const coupon = r1.rows[0];
    if (coupon.status !== "AVAILABLE") { await client.query("ROLLBACK"); return res.status(409).json({ status: "used", message: "รหัสนี้ถูกใช้ไปแล้ว" }); }

    await client.query(`UPDATE coupons SET status='USED', claimer_ui=$1, claimed_at=NOW() WHERE code=$2`, [uid, code]);

    const r2 = await client.query(`UPDATE users SET score = score + $1 WHERE uid=$2 RETURNING score`, [coupon.point, uid]);
    if (r2.rowCount === 0) { await client.query("ROLLBACK"); return res.status(403).json({ status: "error", message: "User not registered" }); }

    await client.query("COMMIT");
    res.json({ status: "success", point: coupon.point });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("add-score error:", e);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  } finally {
    client.release();
  }
});

// ======= start =======
const PORT = process.env.PORT || 3000; // Render จะส่ง PORT ผ่าน ENV
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
