# Firestore Data Design — SpecCompare

## Collections

```text
users/{uid}
categories/{slug}
brands/{slug}
specDefinitions/{categorySlug}
products/{productId}
articles/{articleId}
```

## ตัวอย่าง Product

```json
{
  "title": "Ryzen 7 7800X3D",
  "model": "7800X3D",
  "slug": "amd-ryzen-7-7800x3d",
  "categorySlug": "cpu",
  "brandSlug": "amd",
  "brandName": "AMD",
  "price": 15990,
  "currency": "THB",
  "status": "published",
  "specs": {
    "cores": 8,
    "threads": 16,
    "boost_clock_ghz": 5,
    "tdp_w": 120
  },
  "primaryImageUrl": "https://...",
  "imageUrls": ["https://..."],
  "imagePaths": ["product-images/..."],
  "sourceUrl": "https://...",
  "searchKeywords": ["ryzen", "amd", "cpu"],
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

## การเปรียบเทียบ

เอกสาร `specDefinitions/{categorySlug}` กำหนด:

- `higher_better`
- `lower_better`
- `neutral`

เว็บไซต์ใช้ค่านี้ไฮไลต์สเปกที่ดีกว่า

## รูปสินค้า

ไฟล์อยู่ใน Cloud Storage:

```text
product-images/{productId}/{filename}
```

Firestore เก็บ URL และ path ไม่เก็บไฟล์ binary ในเอกสาร
