# 🗄️ Database Migration Guide
## إضافة جداول Payment Integration

---

## 📋 نظرة عامة

هذا الدليل يشرح كيفية تطبيق الـ migrations لإضافة جداول **Webhook Events** و **Payment Licenses**.

---

## 🎯 الخيارات المتاحة

### ✅ الخيار 1: Prisma Migrate (موصى به)

**المميزات:**
- ✅ Type-safe مع TypeScript
- ✅ Migration history tracking
- ✅ سهولة الـ Rollback
- ✅ Auto-generate Prisma Client
- ✅ تكامل كامل مع المشروع الحالي

**العيوب:**
- ⚠️ يتطلب إعادة توليد Prisma Client
- ⚠️ قد يحتاج restart للـ Backend

---

### ⚙️ الخيار 2: Raw SQL Migration

**المميزات:**
- ✅ تحكم كامل في SQL
- ✅ سريع ومباشر

**العيوب:**
- ❌ لا يحدث Prisma Schema تلقائياً
- ❌ لا يحدث Prisma Client
- ❌ لا tracking للـ migrations

---

## 🚀 التطبيق: Prisma Migrate (الطريقة الموصى بها)

### الخطوة 1: تحديث Prisma Schema

استبدل محتوى `backend/prisma/schema.prisma` بالمحتوى من `schema.updated.prisma`:

```bash
cd /Users/sunmarke/license-gate
cp backend/prisma/schema.updated.prisma backend/prisma/schema.prisma
```

### الخطوة 2: إنشاء Migration

```bash
cd backend
npx prisma migrate dev --name add_payment_integration
```

هذا الأمر سيقوم بـ:
1. ✅ إنشاء ملفات migration جديدة
2. ✅ تطبيق الـ migration على قاعدة البيانات
3. ✅ توليد Prisma Client الجديد
4. ✅ حفظ Migration History

### الخطوة 3: التحقق من النجاح

```bash
# عرض حالة Migrations
npx prisma migrate status

# فحص قاعدة البيانات
npx prisma studio
```

### الخطوة 4: إعادة تشغيل Backend

```bash
npm run dev
```

---

## 🔧 البديل: Raw SQL (إذا كنت تفضل التحكم الكامل)

### الخطوة 1: تطبيق SQL مباشرة

```bash
# الاتصال بقاعدة البيانات
mysql -u root -p license_gate

# تطبيق الـ migration
SOURCE /Users/sunmarke/license-gate/backend/prisma/migrations/20251105_add_payment_tables.sql;

# أو باستخدام
mysql -u root -p license_gate < backend/prisma/migrations/20251105_add_payment_tables.sql
```

### الخطوة 2: تحديث Prisma Schema يدوياً

استبدل `backend/prisma/schema.prisma` بـ `schema.updated.prisma`

### الخطوة 3: توليد Prisma Client

```bash
cd backend
npx prisma generate
```

### الخطوة 4: إعادة تشغيل Backend

```bash
npm run dev
```

---

## 📊 التحقق من الجداول الجديدة

### عرض الجداول

```sql
-- عرض جميع الجداول
SHOW TABLES;

-- هيكل جدول webhook_events
DESC webhook_events;

-- هيكل جدول payment_licenses
DESC payment_licenses;
```

### اختبار الإدراج

```sql
-- اختبار webhook_events
INSERT INTO webhook_events (provider, event_type, event_id, payload, status)
VALUES ('stripe', 'payment_intent.succeeded', 'evt_test_123', '{"test": true}', 'pending');

-- التحقق
SELECT * FROM webhook_events;

-- حذف البيانات التجريبية
DELETE FROM webhook_events WHERE event_id = 'evt_test_123';
```

---

## 🔄 Rollback (في حالة المشاكل)

### إذا استخدمت Prisma Migrate

```bash
# عرض آخر migration
npx prisma migrate status

# Rollback آخر migration
npx prisma migrate resolve --rolled-back <migration_name>

# أو حذف الجداول يدوياً
```

### حذف الجداول يدوياً

```sql
DROP TABLE IF EXISTS payment_licenses;
DROP TABLE IF EXISTS webhook_events;
```

---

## 📝 الأوامر السريعة

### النهج الكامل (موصى به):

```bash
# 1. تحديث Schema
cp backend/prisma/schema.updated.prisma backend/prisma/schema.prisma

# 2. إنشاء وتطبيق Migration
cd backend
npx prisma migrate dev --name add_payment_integration

# 3. التحقق
npx prisma migrate status
npx prisma studio

# 4. إعادة تشغيل Backend
pkill -f "ts-node"
npm run dev
```

---

## ✅ Checklist

- [ ] نسخ احتياطي من قاعدة البيانات الحالية
- [ ] تحديث Prisma Schema
- [ ] تطبيق Migration
- [ ] توليد Prisma Client
- [ ] التحقق من الجداول الجديدة
- [ ] اختبار الإدراج/الاسترجاع
- [ ] إعادة تشغيل Backend
- [ ] اختبار الـ APIs

---

## 🆘 حل المشاكل الشائعة

### خطأ: "Migration already applied"

```bash
npx prisma migrate resolve --applied <migration_name>
```

### خطأ: "Database connection failed"

تحقق من `.env`:
```env
DATABASE_URL="mysql://root:password@localhost:3306/license_gate"
```

### خطأ: "Table already exists"

```sql
-- حذف الجدول القديم (حذر!)
DROP TABLE IF EXISTS webhook_events;
DROP TABLE IF EXISTS payment_licenses;

-- ثم إعادة المحاولة
npx prisma migrate dev --name add_payment_integration
```

### خطأ في Prisma Client

```bash
# إعادة توليد Client
cd backend
rm -rf node_modules/.prisma
npx prisma generate
```

---

## 📚 موارد إضافية

- Prisma Migrate Docs: https://www.prisma.io/docs/concepts/components/prisma-migrate
- Prisma Schema Reference: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference
- MySQL Data Types: https://dev.mysql.com/doc/refman/8.0/en/data-types.html

---

## 🔐 نسخ احتياطي

### قبل تطبيق Migration:

```bash
# نسخ احتياطي من قاعدة البيانات
mysqldump -u root -p license_gate > backup_$(date +%Y%m%d_%H%M%S).sql

# أو باستخدام Prisma
npx prisma db pull
```

### استعادة من النسخ الاحتياطي:

```bash
mysql -u root -p license_gate < backup_20251105_123456.sql
```

---

**تاريخ الإنشاء:** 5 نوفمبر 2025  
**آخر تحديث:** 5 نوفمبر 2025  
**الحالة:** ✅ جاهز للتطبيق
