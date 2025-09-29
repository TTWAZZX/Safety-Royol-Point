// db.js
const { Pool } = require("pg");

// แปลงค่า CA: รองรับทั้งสตริงเดียวที่คั่นด้วย \n และหลายบรรทัดจริง
function normalizeCA(input = "") {
  if (!input) return null;
  return input.includes("\\n") ? input.replace(/\\n/g, "\n") : input;
}

const ca = normalizeCA(process.env.AIVEN_CA_CERT);

// NOTE: ต้องให้ DATABASE_URL ลงท้ายด้วย ?sslmode=require
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ถ้ามี CA ใช้แบบเข้มงวด, ถ้าไม่มีให้ต่อแบบผ่อนปรนเพื่อให้ระบบติดก่อน (แล้วค่อยกลับมาใส่ CA ที่ถูก)
  ssl: ca ? { rejectUnauthorized: true, ca } : { require: true, rejectUnauthorized: false },
});

module.exports = pool;
