// db.js
const { Pool } = require("pg");

const sslConfig = process.env.FORCE_INSECURE_SSL
  ? { rejectUnauthorized: false }
  : process.env.AIVEN_CA_CERT
  ? { rejectUnauthorized: true, ca: process.env.AIVEN_CA_CERT }
  : false;

console.log("[PG SSL] FORCE_INSECURE_SSL =", process.env.FORCE_INSECURE_SSL || "off");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
});

module.exports = pool;
