// server.js
require('dotenv').config();
const path = require("path");
const express = require("express");
const pool = require("./db");

// ✅ ชี้ไปที่โฟลเดอร์ api
const healthHandler   = require("./api/health");
const getScoreHandler = require("./api/get-score");
const registerHandler = require("./api/register");
const addScoreHandler = require("./api/add-score");

const app = express();

// parse body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// เสิร์ฟไฟล์หน้าเว็บจากโฟลเดอร์รูท (ถ้าใช้ public ให้เปลี่ยนเป็น path.join(__dirname,"public"))
app.use(express.static(__dirname));
app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));

// health
app.get("/api/health", healthHandler);

// API routes
app.get("/api/get-score", getScoreHandler);    // /api/get-score?uid=...
app.post("/api/register", registerHandler);    // body: uid,name,room,dob,passport,telephone
app.post("/api/add-score", addScoreHandler);   // body: uid,code,type

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
