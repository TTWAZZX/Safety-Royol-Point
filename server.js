// ไฟล์: server.js (สร้างใหม่ใน Root Directory)

import express from 'express';
import registerHandler from './api/register.js';
import getScoreHandler from './api/get-score.js';
import addScoreHandler from './api/add-score.js';

const app = express();
const PORT = process.env.PORT || 10000; // Render จะกำหนด PORT ให้

// Middleware ที่สำคัญ
// Render ต้องการ body-parser เพื่ออ่านข้อมูลแบบ application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 💡 การกำหนด API Routes
app.post('/api/register', (req, res) => registerHandler(req, res));
app.get('/api/get-score', (req, res) => getScoreHandler(req, res));
app.post('/api/add-score', (req, res) => addScoreHandler(req, res));

// 💡 สำหรับ serving Frontend (index.html) - ต้องปรับตามโครงสร้างไฟล์
// ถ้า index.html อยู่ใน Root Directory, Vercel จะจัดการ Frontend เอง
// ถ้าคุณต้องการให้ Render serve frontend ด้วย ให้ใช้ app.use(express.static('public'));
// (แต่เนื่องจากคุณใช้ Vercel/LIFF เราจะให้ Render เป็น API อย่างเดียว)

// Health check endpoint (ไม่บังคับ แต่ดีสำหรับ PaaS)
app.get('/health', (req, res) => res.status(200).send('API is healthy'));


app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});