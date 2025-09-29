// api/health.js
const pool = require("../db");

module.exports = async function healthHandler(_req, res) {
  try {
    const r = await pool.query("SELECT now() AS now");
    res.json({
      ok: true,
      now: r.rows[0].now,
      meta: {
        insecure: String(process.env.FORCE_INSECURE_SSL || "") === "1",
        caPresent: Boolean(process.env.AIVEN_CA_CERT),
        hasSslmodeRequire: /\bsslmode=require\b/i.test(process.env.DATABASE_URL || "")
      }
    });
  } catch (e) {
    console.error("DB Health Check Error:", e);
    res.status(500).json({
      ok: false,
      error: e.message || String(e),
      meta: {
        insecure: String(process.env.FORCE_INSECURE_SSL || "") === "1",
        caPresent: Boolean(process.env.AIVEN_CA_CERT),
        hasSslmodeRequire: /\bsslmode=require\b/i.test(process.env.DATABASE_URL || "")
      }
    });
  }
};
