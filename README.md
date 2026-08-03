# SpecCompare — Firebase Firestore Edition

เว็บเปรียบเทียบสเปก CPU, GPU, Notebook, RAM, SSD และ Mainboard

## ระบบที่ใช้

- Cloud Firestore
- Firebase Authentication
- Cloud Storage for Firebase
- Firebase Hosting
- Firebase JavaScript SDK 12.16.0

## เริ่มต้น

อ่าน `FIREBASE-SETUP.md`

## เปิดในเครื่อง

```bash
python -m http.server 8000
```

เปิด:

```text
http://localhost:8000/frontend/
http://localhost:8000/frontend/admin.html
```

## ไฟล์สำคัญ

```text
firebase.json
firestore.rules
firestore.indexes.json
storage.rules
frontend/js/firebase-config.js
frontend/admin.html
```

## อัปเดต GitHub

ดับเบิลคลิก `PUSH-FIREBASE-UPDATE.cmd`


> หมายเหตุ: Cloud Storage ต้องใช้แผน Blaze หากต้องการอัปโหลดรูปจากหน้า Admin


## Render-ready edition

ใช้ `render.yaml` หรือดู `RENDER-SETUP.md` หน้า Admin ใช้ URL รูปสินค้าแทนการอัปโหลด Firebase Storage เพื่อหลีกเลี่ยงการค้างระหว่างบันทึก
