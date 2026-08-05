# การตั้งค่า Render

สร้าง Static Site จาก GitHub repository เดิม แล้วตั้งค่า:

```text
Build Command: เว้นว่าง
Publish Directory: frontend
```

ไม่ต้องใส่ Environment Variables เพราะ Firebase Web Config อยู่ใน `frontend/js/firebase-config.js`

หลัง Push โค้ดใหม่ Render จะ Deploy อัตโนมัติจากสาขา `main`
