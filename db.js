// db.js
const { Pool } = require("pg");

function normalizeCA(input = "") {
  if (!input) return null;
  return input.includes("\\n") ? input.replace(/\\n/g, "\n") : input;
}
const ca = normalizeCA(process.env.AIVEN_CA_CERT);

// ยอมรับค่าหลายแบบ: "1", "true", "yes", "on" => insecure = true
const val = String(process.env.FORCE_INSECURE_SSL || "").trim().toLowerCase();
const FORCE_INSECURE = !!val && val !== "0" && val !== "false" && val !== "off" && val !== "no";

const sslConfig = FORCE_INSECURE
  ? { require: true, rejectUnauthorized: false }
  : (ca ? { rejectUnauthorized: true, ca } : { require: true, rejectUnauthorized: false });

console.log("[PG SSL] raw.FORCE_INSECURE_SSL=%j insecure=%s caPresent=%s hasSslmode=%s",
  process.env.FORCE_INSECURE_SSL,
  FORCE_INSECURE,
  Boolean(ca),
  /\bsslmode=require\b/i.test(process.env.DATABASE_URL || "")
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
});

module.exports = pool;
