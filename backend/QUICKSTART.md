# ⚡ Quick Start Guide - المرحلة الثانية

## 🚀 البدء السريع (5 دقائق)

### 1️⃣ تحديث Database Schema (دقيقتان)

```bash
cd backend

# افتح schema.prisma وأضف في النهاية:
```

```prisma
model EmailVerificationToken {
  id        Int      @id @default(autoincrement())
  userId    Int      @map("user_id")
  token     String   @unique @db.VarChar(255)
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@map("email_verification_tokens")
}
```

```prisma
# في model User أضف:
model User {
  // ...existing fields...
  emailVerificationTokens EmailVerificationToken[]
  // ...existing relations...
}
```

```bash
# طبّق التغييرات:
npx prisma migrate dev --name add_email_verification
npx prisma generate
```

---

### 2️⃣ تثبيت Dependencies (دقيقة واحدة)

```bash
npm install stripe@^14.0.0
# Dependencies الأخرى موجودة بالفعل
```

---

### 3️⃣ Environment Variables (30 ثانية)

أضف إلى `.env`:

```env
FRONTEND_URL=http://localhost:5173
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

### 4️⃣ اختبار سريع (دقيقة واحدة)

```bash
# بناء المشروع
npm run build

# اختبار User Service
npx ts-node -e "
import { createOrFindUser } from './src/services/user/user-service';
(async () => {
  const result = await createOrFindUser('test@example.com');
  console.log('✅ User Service works!', result.user.email);
  process.exit(0);
})();
"
```

---

### 5️⃣ Setup Webhook (30 ثانية)

```bash
# في terminal منفصل
stripe listen --forward-to localhost:3000/webhooks/stripe
```

---

## ✅ تحقق من النجاح

يجب أن ترى:

```
✅ Migration applied successfully
✅ Prisma Client generated
✅ User Service works!
✅ Stripe CLI listening on localhost:3000
```

---

## 🎯 الخطوات التالية

### لتشغيل كامل الاختبارات:

```bash
npm run test:all
```

### لإعداد Webhook Endpoint في production:

1. نشر المشروع
2. تسجيل `https://your-domain.com/webhooks/stripe` في Stripe Dashboard
3. نسخ Webhook Secret الجديد إلى `.env`

---

## 📚 لمزيد من التفاصيل

- **دليل التنفيذ الكامل:** [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
- **ملخص المرحلة:** [README_PHASE2.md](./README_PHASE2.md)
- **تحديث Schema:** [PRISMA_SCHEMA_UPDATE.md](./PRISMA_SCHEMA_UPDATE.md)

---

## 🆘 المشاكل الشائعة

### ❌ "Cannot find module 'stripe'"

```bash
npm install stripe@^14.0.0
```

### ❌ "emailVerificationToken does not exist"

```bash
npx prisma generate
```

### ❌ "Webhook signature verification failed"

تحقق من `STRIPE_WEBHOOK_SECRET` في `.env`

---

## 🎉 جاهز!

الآن يمكنك:
- ✅ إنشاء مستخدمين تلقائياً
- ✅ إرسال بريد التحقق
- ✅ معالجة Stripe webhooks
- ✅ توليد تراخيص تلقائياً

**Next:** ابدأ تطوير Frontend! 🎨
