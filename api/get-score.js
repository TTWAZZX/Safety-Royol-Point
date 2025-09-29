// api/get-score.js
const pool = require("../db");

module.exports = async function getScoreHandler(req, res) {
  const uid = (req.query.uid || "").trim();
  if (!uid) return res.status(400).json({ status: "error", message: "Missing uid" });

  try {
    const sql = `
      SELECT uid, name, room AS classroom, passport, telephone AS tel, score
      FROM users
      WHERE uid = $1
    `;
    const r = await pool.query(sql, [uid]);

    if (r.rows.length === 0) {
      return res.status(200).json({ status: "not found" });
    }

    return res.status(200).json({ status: "success", data: r.rows[0] });
  } catch (e) {
    console.error("GET /api/get-score error:", e.stack || e);
    return res
      .status(500)
      .json({ status: "error", message: e.message || "Internal Server Error" });
  }
};
