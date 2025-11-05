# 📝 Prisma Schema Update للـ Email Verification

## ⚠️ Important: يجب تطبيق هذا التحديث على schema.prisma

أضف النموذج التالي إلى ملف `backend/prisma/schema.prisma`:

```prisma
// 📧 Email Verification Tokens
model EmailVerificationToken {
  id        Int      @id @default(autoincrement())
  userId    Int      @map("user_id")
  token     String   @unique @db.VarChar(255)
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@map("email_verification_tokens")
}
```

## 🔗 تحديث User Model

أضف هذه العلاقة إلى `model User`:

```prisma
model User {
  // ...existing fields...
  
  // Relations
  emailVerificationTokens EmailVerificationToken[]
  
  // ...existing relations...
}
```

## 📋 خطوات التطبيق

### 1️⃣ تحديث Schema

```bash
cd backend
nano prisma/schema.prisma  # أو أي محرر نصوص
# أضف النموذج أعلاه
```

### 2️⃣ إنشاء Migration

```bash
npx prisma migrate dev --name add_email_verification_tokens
```

### 3️⃣ توليد Prisma Client

```bash
npx prisma generate
```

### 4️⃣ التحقق

```bash
npx prisma migrate status
npx prisma studio  # للتحقق من الجداول
```

## 📊 الجدول الناتج

سيتم إنشاء الجدول التالي في MySQL:

```sql
CREATE TABLE `email_verification_tokens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_verification_tokens_token_key` (`token`),
  KEY `email_verification_tokens_user_id_idx` (`user_id`),
  KEY `email_verification_tokens_token_idx` (`token`),
  KEY `email_verification_tokens_expires_at_idx` (`expires_at`),
  CONSTRAINT `email_verification_tokens_user_id_fkey` 
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## ✅ Verification

بعد تطبيق المig ration، تحقق من:

1. ✅ الجدول موجود في قاعدة البيانات
2. ✅ الـ Foreign Key صحيح
3. ✅ الـ Indexes موجودة
4. ✅ Prisma Client تم توليده بنجاح

```typescript
// Test في Node.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// يجب أن يعمل بدون أخطاء
await prisma.emailVerificationToken.findMany();
```

## 🔄 Alternative: SQL مباشر

إذا كنت تفضل تطبيق SQL مباشرة:

```bash
mysql -u root -p license_gate < backend/prisma/migrations/email_verification.sql
```

ثم:

```bash
npx prisma db pull  # لتحديث Schema من قاعدة البيانات
npx prisma generate
```
