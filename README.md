# SpecCompare — Render + Firebase

เวอร์ชันนี้ใช้:

- Render Static Site สำหรับหน้าเว็บ
- Firebase Authentication สำหรับสมัครสมาชิกและเข้าสู่ระบบด้วยอีเมล/รหัสผ่าน
- Cloud Firestore สำหรับข้อมูลสมาชิก สินค้า หมวดหมู่ แบรนด์ สเปก และรูปสินค้าที่บีบอัดแล้ว
- ไม่ใช้ Firebase Storage

## ความสามารถที่แก้แล้ว

- สมัครสมาชิกด้วยอีเมลและรหัสผ่าน
- เข้าสู่ระบบทันทีหลังสมัคร โดยไม่มีขั้นตอนยืนยันอีเมล
- Admin เลือกรูปสินค้าจากไฟล์ในเครื่อง
- รูปถูกย่อและบีบอัดก่อนบันทึกในฟิลด์ `imageDataUrl`
- หน้าแรกอ่านรูปจาก `imageDataUrl` และแสดงสินค้า `published`
- หน้าแรกไม่ต้องใช้ Composite Index สำหรับการโหลดสินค้าหลัก

## อัปเดตขึ้น Render

1. แตกไฟล์ทับโฟลเดอร์โปรเจกต์เดิม
2. เปิด `PUSH-RENDER-UPDATE.cmd`
3. รอ GitHub Push สำเร็จ
4. Render จะ Auto Deploy จากสาขา `main`

หน้า Admin:

```text
https://ชื่อเว็บ.onrender.com/admin.html
```
