# การตั้งค่า Firebase ที่ใช้กับ SpecCompare

เปิดบริการต่อไปนี้ในโปรเจกต์ Firebase เดิม:

1. Authentication → Email/Password → Enable
2. Firestore Database
3. Deploy `firestore.rules` และ `firestore.indexes.json` ตามโปรเจกต์เดิม

ระบบสมาชิกใช้ Email/Password และไม่ได้เรียกฟังก์ชันส่งอีเมลยืนยัน ผู้สมัครจะเข้าสู่ระบบทันทีหลังสร้างบัญชี

เอกสารสมาชิกอยู่ที่:

```text
users/{uid}
```

สมาชิกทั่วไปมี:

```text
role: "viewer"
```

ผู้ดูแลต้องเปลี่ยนเป็น:

```text
role: "admin"
```

รูปสินค้าเวอร์ชันนี้ถูกย่อและเก็บในเอกสารสินค้า:

```text
products/{productId}.imageDataUrl
```

ไม่ต้องเปิด Firebase Storage
