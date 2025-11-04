# 🔧 Admin Scripts - LicenseGate

مجموعة من السكريبتات لإدارة المستخدمين والصلاحيات في LicenseGate.

## 📋 السكريبتات المتاحة

### 1. عرض جميع المستخدمين
يعرض قائمة بجميع المستخدمين مع تفاصيلهم.

```bash
cd backend
npm run list-users
```

**الناتج:**
- ID المستخدم
- البريد الإلكتروني
- هل هو Admin؟
- هل البريد مُفعّل؟
- عدد التراخيص
- عدد API Keys
- تاريخ الإنشاء

---

### 2. تعيين مستخدم كـ Admin
يجعل مستخدم معين لديه صلاحيات Admin كاملة.

```bash
cd backend
npm run set-admin <email>
```

**مثال:**
```bash
npm run set-admin info@dxbmark.com
```

**الناتج:**
```
🔍 Searching for user: info@dxbmark.com

📋 Current user details:
   ID: 1
   Email: info@dxbmark.com
   Email Verified: false
   Is Admin: false
   Created At: 2025-11-04...

🔧 Setting user as admin...

✅ Success! User is now an admin:
   ID: 1
   Email: info@dxbmark.com
   Is Admin: true
```

---

## 🗄️ تعديلات قاعدة البيانات

تم إضافة حقل `isAdmin` إلى جدول `User`:

```prisma
model User {
  id              Int      @id @default(autoincrement())
  email           String   @unique
  isEmailVerified Boolean
  passwordHash    String?
  refreshSession  String?
  createdAt       DateTime @default(now())

  marketingEmails Boolean @default(false)
  isAdmin         Boolean @default(false)  // ← جديد!
  rsaPublicKey    String  @db.Text
  rsaPrivateKey   String  @db.Text

  licenses License[]
  logs     Log[]
  apiKeys ApiKey[]
}
```

---

## 🔐 استخدام MySQL مباشرة

يمكنك أيضاً استخدام MySQL مباشرة:

### عرض المستخدمين:
```bash
docker exec -i license-gate-mysql mysql -uroot -ppassword license_gate \
  -e "SELECT id, email, isAdmin, isEmailVerified FROM User;"
```

### تعيين Admin:
```bash
docker exec -i license-gate-mysql mysql -uroot -ppassword license_gate \
  -e "UPDATE User SET isAdmin = 1 WHERE email = 'user@example.com';"
```

### إلغاء Admin:
```bash
docker exec -i license-gate-mysql mysql -uroot -ppassword license_gate \
  -e "UPDATE User SET isAdmin = 0 WHERE email = 'user@example.com';"
```

---

## 📝 ملاحظات

1. **الحقل الافتراضي:** جميع المستخدمين الجدد يتم إنشاؤهم بـ `isAdmin = false`
2. **الأمان:** تأكد من تعيين Admin فقط للمستخدمين الموثوقين
3. **تطبيق التغييرات:** إذا قمت بتعديل Schema، قم بتشغيل:
   ```bash
   npm run prisma-up
   ```

---

## 🚀 الخطوات التالية

بعد تعيين Admin، يمكنك:

1. إضافة middleware للتحقق من صلاحيات Admin في API routes
2. إنشاء لوحة تحكم Admin في Frontend
3. إضافة endpoints خاصة بالـ Admin فقط

مثال middleware:

```typescript
// src/middleware/admin.middleware.ts
import { Request, Response, NextFunction } from 'express';

export const requireAdmin = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const user = req.user; // من authentication middleware
  
  if (!user || !user.isAdmin) {
    return res.status(403).json({
      error: 'Forbidden: Admin access required'
    });
  }
  
  next();
};
```

---

**تاريخ الإنشاء:** 5 نوفمبر 2025
**الحالة:** ✅ جاهز للاستخدام
