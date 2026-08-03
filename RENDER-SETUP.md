# นำ SpecCompare ขึ้น Render

โปรเจกต์นี้เป็น Static Site และใช้ Firebase Authentication + Cloud Firestore เป็น Backend

## ตั้งค่าบน Render

1. เข้า Render Dashboard
2. กด New > Static Site
3. เชื่อม GitHub repository: poommpina-svg/speccompare
4. เลือก Branch: main
5. กำหนดค่า:
   - Root Directory: เว้นว่าง
   - Build Command: echo "No build required"
   - Publish Directory: frontend
6. กด Create Static Site

หลัง Deploy สำเร็จ:
- หน้าเว็บ: https://ชื่อเว็บ.onrender.com/
- หน้า Admin: https://ชื่อเว็บ.onrender.com/admin.html

## สิ่งที่แก้เพื่อให้บันทึกเร็ว

- ตัดขั้นตอนอัปโหลด Firebase Storage ออกจากหน้า Admin
- เปลี่ยนเป็นช่อง URL รูปสินค้า
- การบันทึกสินค้าเขียนเข้า Firestore โดยตรง
- Render ทำหน้าที่โฮสต์ HTML/CSS/JavaScript เท่านั้น
