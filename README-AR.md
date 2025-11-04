# 🔐 LicenseGate - نظام إدارة تراخيص البرمجيات

<div dir="rtl">

## 📖 نظرة عامة

**LicenseGate** هو نظام مفتوح المصدر لإدارة تراخيص البرمجيات. يساعد المطورين وأصحاب المنتجات البرمجية في إنشاء وإدارة والتحقق من مفاتيح الترخيص بسهولة.

## ✨ المميزات الرئيسية

### 🎯 إدارة شاملة للتراخيص
- إنشاء مفاتيح ترخيص غير محدودة
- تعديل وحذف التراخيص بسهولة
- تفعيل/إيقاف التراخيص فورياً
- إضافة ملاحظات لكل ترخيص

### 🔒 قيود متقدمة على الاستخدام

#### حد IP (IP Limit)
- تقييد عدد الأجهزة/IPs التي يمكنها استخدام الترخيص
- مثال: ترخيص واحد لجهاز واحد فقط

#### حد المعدل (Rate Limit)
- تحديد عدد الطلبات المسموحة في فترة زمنية
- إعادة تعبئة تلقائية: 10 ثوانٍ، دقيقة، ساعة، أو يوم
- حماية من سوء الاستخدام

#### تاريخ الانتهاء (Expiration Date)
- تحديد صلاحية زمنية للترخيص
- مثال: ترخيص لمدة سنة

#### النطاقات (Scopes)
- تخصيص الميزات المتاحة لكل ترخيص
- مثال: "premium", "basic", "feature-x"

### 📊 إحصائيات مباشرة
- تتبع استخدام كل ترخيص
- سجل كامل لمحاولات التحقق (ناجحة وفاشلة)
- معلومات IP والوقت والنتيجة
- رسوم بيانية تفاعلية

### 🔐 أمان متقدم
- تشفير RSA للتحقق في البيئات غير الموثوقة
- مفاتيح API آمنة
- حماية CORS
- JWT Authentication

### 🚀 API بسيط وسهل الاستخدام

التحقق من ترخيص بطلب GET واحد:

```http
GET /license/{user-id}/{license-key}/verify
```

الاستجابة:
```json
{
  "valid": true,
  "status": "VALID"
}
```

## 🏗️ البنية التقنية

### Frontend
- **Framework**: SvelteKit
- **Language**: TypeScript
- **Styling**: TailwindCSS + SCSS
- **API Client**: tRPC Client
- **Charts**: D3.js
- **State Management**: TanStack Query

### Backend
- **Framework**: Express.js
- **Language**: TypeScript
- **API**: tRPC (Type-safe RPC)
- **ORM**: Prisma
- **Database**: MySQL
- **Validation**: Zod
- **Authentication**: JWT + Cookies

### DevOps
- **Development**: Nodemon, Vite HMR
- **Build**: TypeScript, Vite
- **Database Migrations**: Prisma Migrate

## 📋 المتطلبات

- Node.js >= 18.x
- npm أو pnpm
- MySQL >= 8.x
- Git

## 🚀 التثبيت والتشغيل

### 1. استنساخ المشروع

```bash
git clone https://github.com/your-username/license-gate.git
cd license-gate
git checkout LicenseGate-dev
```

### 2. إعداد قاعدة البيانات

```bash
# إنشاء قاعدة بيانات MySQL
mysql -u root -p
CREATE DATABASE license_gate;
exit;
```

### 3. إعداد Backend

```bash
cd backend

# تثبيت المكتبات
npm install

# نسخ ملف البيئة
cp .env.example .env

# تعديل ملف .env بالإعدادات الخاصة بك
# DATABASE_URL="mysql://root:password@localhost:3306/license_gate"
# JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
# CORS_ORIGIN=http://localhost:5173

# تشغيل migrations
npm run prisma-migrate

# توليد Prisma Client
npm run prisma-gen

# تشغيل السيرفر
npm run dev
```

السيرفر سيعمل على: `http://localhost:3001`

### 4. إعداد Frontend

```bash
cd ../frontend

# تثبيت المكتبات
npm install

# تشغيل السيرفر
npm run dev
```

الواجهة ستعمل على: `http://localhost:5173`

## 📁 هيكل المشروع

```
license-gate/
├── backend/                    # خادم Backend
│   ├── src/
│   │   ├── controller/        # منطق الأعمال
│   │   ├── routers/           # tRPC و REST routers
│   │   ├── utils/             # دوال مساعدة
│   │   ├── types/             # تعريفات TypeScript
│   │   └── index.ts           # نقطة البداية
│   ├── prisma/
│   │   └── schema.prisma      # مخطط قاعدة البيانات
│   ├── .env                   # متغيرات البيئة
│   └── package.json
│
├── frontend/                   # واجهة المستخدم
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/   # مكونات Svelte
│   │   │   ├── trpc/         # إعدادات tRPC
│   │   │   └── utils/        # دوال مساعدة
│   │   ├── routes/           # صفحات التطبيق
│   │   └── app.scss          # تنسيقات عامة
│   └── package.json
│
└── README.md
```

## 🎮 الاستخدام

### إنشاء ترخيص جديد

1. سجل دخول إلى لوحة التحكم
2. اذهب إلى "Licenses"
3. اضغط "Create New License"
4. املأ التفاصيل:
   - الاسم
   - القيود (اختياري)
   - الملاحظات
5. احفظ واحصل على مفتاح الترخيص

### التحقق من ترخيص

#### REST API

```bash
curl http://localhost:3001/license/{userId}/{licenseKey}/verify
```

#### من تطبيقك (مثال Node.js)

```javascript
const response = await fetch(
  `http://localhost:3001/license/${userId}/${licenseKey}/verify`
);
const data = await response.json();

if (data.valid) {
  console.log('الترخيص صالح!');
} else {
  console.log('الترخيص غير صالح:', data.status);
}
```

### حالات التحقق

- `VALID`: الترخيص صالح ✅
- `NOT_FOUND`: الترخيص غير موجود ❌
- `NOT_ACTIVE`: الترخيص معطل ❌
- `EXPIRED`: الترخيص منتهي الصلاحية ⏰
- `LICENSE_SCOPE_FAILED`: النطاق غير مطابق 🔒
- `IP_LIMIT_EXCEEDED`: تجاوز حد IP 🚫
- `RATE_LIMIT_EXCEEDED`: تجاوز حد المعدل ⚠️

## 🛠️ الأوامر المتاحة

### Backend

```bash
npm run dev              # تشغيل بوضع التطوير
npm run start            # تشغيل بوضع الإنتاج
npm run prisma-dev       # إنشاء migration جديد
npm run prisma-migrate   # تطبيق migrations
npm run prisma-gen       # توليد Prisma Client
npm run set-admin        # تعيين مستخدم كمسؤول
npm run list-users       # عرض قائمة المستخدمين
```

### Frontend

```bash
npm run dev              # تشغيل بوضع التطوير
npm run build            # بناء للإنتاج
npm run preview          # معاينة البناء
npm run check            # فحص TypeScript
npm run lint             # فحص الكود
npm run format           # تنسيق الكود
```

## 🔧 الإعدادات

### متغيرات البيئة (Backend)

```env
# بيئة التشغيل
NODE_ENV=development

# قاعدة البيانات
DATABASE_URL="mysql://root:password@localhost:3306/license_gate"

# السيرفر
PORT=3001

# الأمان
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
CORS_ORIGIN=http://localhost:5173

# البريد الإلكتروني
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USERNAME=test@localhost
SMTP_PASSWORD=password
SMTP_SENDER=LicenseGate <noreply@localhost>

# روابط
SIGN_IN_URL=http://localhost:5173/auth/sign-in
RESET_PASSWORD_URL=http://localhost:5173/auth/reset-password

# reCAPTCHA (اختياري)
RECAPTCHA_SECRET_KEY=your-recaptcha-key
DISABLE_RECAPTCHA=true

# التسجيل
DISABLE_SIGN_UP=false
```

## 🐛 معالجة المشاكل الشائعة

### خطأ CORS

تأكد من أن `CORS_ORIGIN` في `.env` يطابق عنوان Frontend:
```env
CORS_ORIGIN=http://localhost:5173
```

### خطأ Database Connection

1. تأكد من تشغيل MySQL
2. تحقق من صحة `DATABASE_URL`
3. تأكد من وجود قاعدة البيانات

### تحذيرات Sass Legacy API

سيتم معالجتها في التحديثات القادمة - لا تؤثر على الأداء

### 404 على `/`

طبيعي إذا لم تكن في صفحة معرفة - اذهب إلى `/auth/sign-in`

## 🤝 المساهمة

نرحب بالمساهمات! يرجى:

1. Fork المشروع
2. إنشاء branch للميزة (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للـ branch (`git push origin feature/amazing-feature`)
5. فتح Pull Request

## 📝 الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE)

## 🔗 روابط مفيدة

- [الوثائق الرسمية](https://docs.licensegate.io)
- [النسخة المستضافة](https://licensegate.io)
- [Discord Community](https://discord.gg/ycDG6rS)

## 📧 الدعم

- GitHub Issues: للإبلاغ عن مشاكل أو طلب ميزات
- Discord: للدعم المباشر والنقاشات
- Email: support@licensegate.io

## 🌟 شكر خاص

- [SvelteKit](https://kit.svelte.dev/)
- [tRPC](https://trpc.io/)
- [Prisma](https://www.prisma.io/)
- كل المساهمين في المشروع

---

صنع بـ ❤️ للمطورين، من المطورين

</div>
