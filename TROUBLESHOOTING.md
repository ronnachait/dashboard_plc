# 🔧 Troubleshooting Guide

## ❌ Error: `Cannot read properties of undefined (reading 'findUnique')`

### สาเหตุ:
Prisma Client ยังไม่ได้ generate หลังจากเพิ่ม `GoogleToken` model

### วิธีแก้:

#### ขั้นตอนที่ 1: หยุด Dev Server
กด `Ctrl+C` ใน terminal ที่รัน development server

#### ขั้นตอนที่ 2: Regenerate Prisma Client
```bash
npx prisma generate
```

หรือใช้สคริปต์:
```bash
node scripts/regenerate-prisma.js
```

#### ขั้นตอนที่ 3: เริ่ม Server ใหม่
```bash
npm run dev
```

---

## ✅ ตรวจสอบว่า Fix แล้ว

เปิด browser แล้วเข้า:
```
http://localhost:3000/daily-check
http://localhost:3000/problem/report
```

ควรเห็น:
- ✅ หน้า Daily Check โหลดปกติ
- ✅ หน้า Problem Report โหลดปกติ
- ✅ ไม่มี error ใน console
- ✅ ปุ่ม "Connect Google Account" ทำงานได้
- ✅ หลัง authorize แล้วใช้งานได้โดยไม่ต้อง login ซ้ำ

---

## 🔍 Debug เพิ่มเติม

### ตรวจสอบ Prisma Client
```bash
npx prisma studio
```

เปิด Prisma Studio แล้วดูว่ามี table `GoogleToken` หรือไม่

### ตรวจสอบ Database Schema
```bash
npx prisma db pull
```

ดึง schema จาก database มาเทียบ

### Reset Database (ถ้าจำเป็น)
```bash
npx prisma migrate reset --force
npx prisma migrate deploy
npx prisma generate
```

---

## 📝 Common Issues

### 1. Migration ไม่ทำงาน
**แก้ไข:**
```bash
npx prisma migrate reset
npx prisma migrate dev
```

### 2. Port 3000 ถูกใช้งานอยู่
**แก้ไข:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# หรือเปลี่ยน port
PORT=3001 npm run dev
```

### 3. Environment Variables ไม่โหลด
**ตรวจสอบ `.env` มีค่าเหล่านี้:**
```env
DATABASE_URL="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
```

---

## 🚀 Quick Fix (All-in-One)

หากไม่แน่ใจ รันคำสั่งนี้:

```bash
# 1. หยุด server (Ctrl+C)
# 2. รันคำสั่งเหล่านี้ตามลำดับ

npx prisma generate
npm run dev
```

---

## 💡 Tips

- ✅ ทุกครั้งที่แก้ไข `schema.prisma` ต้องรัน `prisma generate`
- ✅ ทุกครั้งที่เพิ่ม/ลบ model ต้อง migrate ด้วย
- ✅ หาก dev server รันอยู่ ต้องหยุดก่อน generate

---

## 📞 ยังแก้ไม่ได้?

1. ดู full error log ใน terminal
2. ตรวจสอบ `node_modules/.prisma/client` มี `GoogleToken` หรือไม่
3. ลบ `node_modules/.prisma` แล้ว generate ใหม่:
```bash
rm -rf node_modules/.prisma
npx prisma generate
```

---

**Last Updated:** October 27, 2025

