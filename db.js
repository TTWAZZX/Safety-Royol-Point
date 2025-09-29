// db.js
const { Pool } = require("pg");

// แปลง ENV เป็นหลายบรรทัด + แยกเป็นหลายใบ (รองรับ CA bundle)
function normalizeCABundle(input = "") {
  if (!input) return { raw: null, arr: [] };
  const pem = input.includes("\\n") ? input.replace(/\\n/g, "\n") : input;

  const blocks = pem
    .split("-----END CERTIFICATE-----")
    .map(b => b.trim())
    .filter(Boolean)
    .map(b =>
      b.includes("-----BEGIN CERTIFICATE-----")
        ? `${b}\n-----END CERTIFICATE-----`
        : null
    )
    .filter(Boolean);

  return { raw: pem, arr: blocks };
}

const caNorm = normalizeCABundle(process.env.AIVEN_CA_CERT);

// ✅ ตั้งธงบังคับโหมดไม่ตรวจใบรับรอง (เพื่อ “ให้ติดก่อน”)
//   ตั้ง FORCE_INSECURE_SSL=1 ใน Render แล้ว redeploy
const FORCE_INSECURE = String(process.env.FORCE_INSECURE_SSL || "") === "1";

const sslConfig = FORCE_INSECURE
  ? { require: true, rejectUnauthorized: false }
  : (caNorm.arr.length
      ? { rejectUnauthorized: true, ca: caNorm.arr }
      : (caNorm.raw
          ? { rejectUnauthorized: true, ca: caNorm.raw }
          : { require: true, rejectUnauthorized: false })); // fallback ถ้าไม่มี CA

// DEBUG: พิมพ์สถานะครั้งเดียวตอนสตาร์ท
console.log("[PG SSL] insecure=%s, caPresent=%s, caCount=%d, hasSslmode=%s",
  FORCE_INSECURE,
  Boolean(caNorm.raw),
  caNorm.arr.length,
  /\bsslmode=require\b/i.test(process.env.DATABASE_URL || "")
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // ควรลงท้าย ?sslmode=require
  ssl: sslConfig,
});

module.exports = pool;
