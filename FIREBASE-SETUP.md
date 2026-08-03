# ติดตั้ง Firebase Firestore สำหรับ SpecCompare

ชุดนี้ใช้ Cloud Firestore, Firebase Authentication, Cloud Storage และ Firebase Hosting

## 1. สร้าง Firebase Project

เปิด Firebase Console แล้วสร้างโปรเจกต์ชื่อ `speccompare` จากนั้นเพิ่ม Web app และคัดลอก `firebaseConfig`

## 2. ใส่ค่าเชื่อมต่อ

เปิด:

```text
frontend/js/firebase-config.js
```

แทนค่า `PASTE_...` ทั้งหมดด้วยค่าจาก Firebase Console

เว็บใช้ Firebase JavaScript SDK 12.16.0 แบบ Browser Modules

## 3. เปิดบริการ

### Firestore

```text
Build / Databases & Storage
→ Firestore Database
→ Create database
→ Standard edition / Native mode
→ Production mode
```

### Authentication

```text
Build
→ Authentication
→ Get started
→ Sign-in method
→ Email/Password
→ Enable
```

เพิ่มผู้ใช้ผู้ดูแลในแท็บ Users

### Storage

```text
Build / Databases & Storage
→ Storage
→ Get started
```


## หมายเหตุเรื่องรูปสินค้าและค่าใช้จ่าย

Cloud Firestore และ Firebase Authentication สามารถเริ่มใช้งานก่อนได้ แต่การอัปโหลดรูปผ่าน Cloud Storage for Firebase ต้องใช้แผน Blaze แบบ pay-as-you-go

ถ้ายังไม่ต้องการผูก Billing:
- สร้างสินค้าโดยยังไม่อัปโหลดรูป
- ใช้ภาพตัวอย่างในหน้าเว็บไปก่อน
- หรือเปลี่ยนไปใช้บริการเก็บรูปภายนอกในภายหลัง

ควรตั้ง Budget Alert ก่อนเปิดใช้ Blaze

## 4. สร้าง Admin คนแรก

1. คัดลอก UID จาก Authentication
2. Firestore → Data → สร้าง Collection `users`
3. Document ID ใช้ UID
4. เพิ่ม:

```text
email        string   อีเมลผู้ดูแล
displayName  string   ชื่อผู้ดูแล
role         string   admin
```

## 5. Deploy

ติดตั้ง Firebase CLI:

```bash
npm install -g firebase-tools
```

ดับเบิลคลิก:

```text
DEPLOY-FIREBASE.cmd
```

หรือรัน:

```bash
firebase login
firebase deploy --project YOUR_PROJECT_ID --only firestore:rules,firestore:indexes,storage,hosting
```

## 6. เพิ่มข้อมูลเริ่มต้น

เปิด:

```text
https://YOUR_PROJECT_ID.web.app/admin.html
```

เข้าสู่ระบบแล้วกด **สร้างข้อมูลเริ่มต้น** จากนั้นเพิ่มสินค้าได้ทันที
