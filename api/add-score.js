// add-score.js
const pool = require("../db");

module.exports = async function addScoreHandler(req, res) {
  const { uid, code, type } = req.body || {};
  if (!uid || !code || !type) {
    return res.status(400).json({ status: "error", message: "Missing required fields" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ล็อครหัสคูปองไว้ก่อน
    const r1 = await client.query(
      `SELECT point, status FROM coupons WHERE code = $1 FOR UPDATE`,
      [code]
    );

    if (r1.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ status: "invalid", message: "คูปองไม่ถูกต้อง" });
    }

    const coupon = r1.rows[0];
    if (coupon.status !== "AVAILABLE") {
      await client.query("ROLLBACK");
      return res.status(409).json({ status: "used", message: "รหัสนี้ถูกใช้ไปแล้ว" });
    }

    // mark ใช้แล้ว + บันทึกว่าใครใช้
    await client.query(
      `UPDATE coupons
         SET status='USED', claimer_ui=$1, "type"=$2, claimed_at=NOW()
       WHERE code=$3`,
      [uid, type, code]
    );

    // เติมคะแนนให้ user
    const r2 = await client.query(
      `UPDATE users SET score = COALESCE(score,0) + $1 WHERE uid=$2 RETURNING score`,
      [coupon.point, uid]
    );

    if (r2.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(403).json({ status: "error", message: "User not registered" });
    }

    await client.query("COMMIT");
    return res.json({ status: "success", point: coupon.point, score: r2.rows[0].score });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("POST /api/add-score error:", e.stack || e);
    return res.status(500).json({ status: "error", message: e.message || "Internal Server Error" });
  } finally {
    client.release();
  }
};
