// ====== วางแทนส่วนตั้งค่า PG และ /api/health ======
const { Pool } = require("pg");

// แปลง ENV ให้เป็นหลายบรรทัด + แยกเป็น bundle
function normalizeCABundle(input = "") {
  if (!input) return { raw: null, arr: [] };
  const pem = input.includes("\\n") ? input.replace(/\\n/g, "\n") : input;

  // แยกทีละใบ
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

// ถ้า CA มีจริง ใช้แบบเข้มงวด; ถ้าไม่ → ต่อแบบผ่อนปรนให้ติดก่อน
const sslConfig = caNorm.arr.length
  ? { rejectUnauthorized: true, ca: caNorm.arr }
  : caNorm.raw
  ? { rejectUnauthorized: true, ca: caNorm.raw }
  : { require: true, rejectUnauthorized: false }; // <— TEMP (เพื่อให้ติดก่อน)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // ต้องลงท้าย ?sslmode=require
  ssl: sslConfig,
});

// Health check พร้อม meta เพื่อ debug
app.get("/api/health", async (req, res) => {
  try {
    const r = await pool.query("SELECT now() AS now");
    return res.json({
      ok: true,
      now: r.rows[0].now,
      meta: {
        caPresent: Boolean(caNorm.raw),
        caCount: caNorm.arr.length,
        hasSslmodeRequire: /\bsslmode=require\b/i.test(process.env.DATABASE_URL || "")
      }
    });
  } catch (e) {
    console.error("DB Health Check Error:", e);
    return res.status(500).json({
      ok: false,
      error: e.message || String(e),
      meta: {
        caPresent: Boolean(caNorm.raw),
        caCount: caNorm.arr.length,
        hasSslmodeRequire: /\bsslmode=require\b/i.test(process.env.DATABASE_URL || "")
      }
    });
  }
});
