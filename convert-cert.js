// convert-cert.js
const fs = require("fs");

// ระบุ path ของ certificate (.pem)
const path = "./ca.pem";  // เปลี่ยนเป็น path จริงของคุณ

// อ่านไฟล์ทั้งหมดเป็น string
let cert = fs.readFileSync(path, "utf8");

// ลบ \r (กรณี Windows) และแทนที่ newline จริง ด้วย \n
cert = cert.replace(/\r/g, "").replace(/\n/g, "\\n");

// พิมพ์ออกมาให้ copy ไปวางใน Render ได้เลย
console.log(cert);
