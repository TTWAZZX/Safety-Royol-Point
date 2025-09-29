// server.js
const path = require("path");
const express = require("express");
const pool = require("./db");

// ถ้าคุณใช้ handlers แยกไฟล์:
const getScoreHandler = require("./get-score");
const registerHandler = require("./register");
const addScoreHandler = require("./add-score");

const app = express();

// parse body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// เสิร์ฟไฟล์ static + หน้าแรก
const ROOT = __dirname; // ถ้าใช้โฟลเดอร์ public ให้เปลี่ยนเป็น path.join(__dirname,"public")
app.use(express.static(ROOT));
app.get("/", (req, res) => res.sendFile(path.join(ROOT, "index.html")));

// ---- Health check (ดีบั๊ก SSL/ENV) ----
app.get("/api/health", async (_req, res) => {
  try {
    const r = await pool.query("SELECT now() AS now");
    res.json({
      ok: true,
      now: r.rows[0].now,
      meta: {
        caPresent: Boolean(process.env.AIVEN_CA_CERT),
        hasSslmodeRequire: /\bsslmode=require\b/i.test(process.env.DATABASE_URL || ""),
      },
    });
  } catch (e) {
    console.error("DB Health Check Error:", e);
    res.status(500).json({
      ok: false,
      error: e.message || String(e),
      meta: {
        caPresent: Boolean(process.env.AIVEN_CA_CERT),
        hasSslmodeRequire: /\bsslmode=require\b/i.test(process.env.DATABASE_URL || ""),
      },
    });
  }
});

// ---- API routes ----
app.get("/api/get-score", getScoreHandler);    // ?uid=...
app.post("/api/register", registerHandler);    // body: uid,name,room,dob,passport,telephone
app.post("/api/add-score", addScoreHandler);   // body: uid,code,type

// start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
