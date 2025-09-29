// db.js
const { Pool } = require("pg");

function normalizeCA(input = "") {
  if (!input) return null;
  return input.includes("\\n") ? input.replace(/\\n/g, "\n") : input;
}

const ca = normalizeCA(process.env.AIVEN_CA_CERT);

// ถ้า FORCE_INSECURE_SSL=1 จะบังคับข้ามการตรวจใบรับรอง (แก้ขัดให้ติดก่อน)
const FORCE_INSECURE = String(process.env.FORCE_INSECURE_SSL || "") === "1";

const sslConfig = FORCE_INSECURE
  ? { require: true, rejectUnauthorized: false }
  : (ca
      ? { rejectUnauthorized: true, ca }
      : { require: true, rejectUnauthorized: false }); // fallback ถ้าไม่ได้ตั้ง CA

console.log("[PG SSL] insecure=%s, caPresent=%s, hasSslmode=%s",
  FORCE_INSECURE,
  Boolean(ca),
  /\bsslmode=require\b/i.test(process.env.DATABASE_URL || "")
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // ควรลงท้าย ?sslmode=require
  ssl: sslConfig,
});

module.exports = pool;
