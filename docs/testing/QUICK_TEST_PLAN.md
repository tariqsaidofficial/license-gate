# 🚀 خطة العمل السريعة - الاختبار النهائي

## ⏱️ المدة المتوقعة: 30-45 دقيقة

---

## 📝 الخطوات بالترتيب

### 1️⃣ التحضير (5 دقائق)

```bash
# الانتقال لمجلد المشروع
cd /Users/sunmarke/license-gate/backend

# التأكد من تثبيت Stripe CLI
brew install stripe/stripe-cli/stripe

# تسجيل الدخول لـ Stripe
stripe login

# التحقق من حالة Prisma
npx prisma studio
# ✅ تحقق من وجود جدول EmailVerificationToken
# ✅ تحقق من وجود بيانات في User
```

---

### 2️⃣ اختبار Database (5 دقائق)

```bash
# إنشاء user تجريبي (إذا لزم)
npm run list-users

# التحقق من user معين
npm run check-user

# التحقق من verified users
npm run verify-all-users
```

**المتوقع:**
- ✅ قائمة المستخدمين تظهر
- ✅ بيانات User صحيحة
- ✅ جدول EmailVerificationToken موجود

---

### 3️⃣ اختبار Email Verification (5 دقائق)

```bash
# تشغيل اختبار Email
npm run test:email-verification
```

**المتوقع:**
- ✅ إنشاء user جديد
- ✅ إنشاء verification token
- ✅ إرسال email (تحقق من Mailtrap)
- ✅ Token يُحفظ في database
- ✅ Token يُحذف بعد الاستخدام

**إذا فشل:**
- تحقق من SMTP credentials في .env
- تحقق من Mailtrap inbox
- راجع console logs للأخطاء

---

### 4️⃣ تشغيل السيرفر (استمراري)

```bash
# Terminal 1: تشغيل Backend
npm run dev

# انتظر حتى ترى:
# "Server is running on port 3000"
```

**المتوقع:**
- ✅ السيرفر يعمل بدون أخطاء
- ✅ Database connection ناجحة
- ✅ لا توجد TypeScript errors

---

### 5️⃣ تشغيل Stripe Webhooks (10 دقائق)

```bash
# Terminal 2: Stripe CLI
stripe listen --forward-to localhost:3000/webhooks/stripe

# انسخ webhook signing secret
# whsec_xxxxxxxxxxxxx

# حدّث .env
# STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# أعد تشغيل السيرفر (Terminal 1)
# Ctrl+C ثم npm run dev
```

**المتوقع:**
- ✅ Stripe CLI متصل
- ✅ رسالة "Ready! You are using Stripe API Version..."
- ✅ Webhook Secret محفوظ في .env

---

### 6️⃣ اختبار Webhook Flow (10 دقائق)

```bash
# Terminal 3: اختبار webhook
stripe trigger payment_intent.succeeded

# أو شغّل الاختبار الشامل
npm run test:webhook-flow
```

**المتوقع:**
- ✅ Stripe يرسل event
- ✅ Backend يستقبل webhook
- ✅ User يُنشأ (إذا جديد)
- ✅ License يُنشأ
- ✅ Email verification يُرسل
- ✅ Logs تظهر في console

**تحقق من:**
- Terminal 1 (Backend): رسائل webhook received
- Terminal 2 (Stripe CLI): event forwarded
- Prisma Studio: user & license جديد
- Mailtrap: verification email

---

### 7️⃣ اختبار Auto License (5 دقائق)

```bash
# اختبار إنشاء license تلقائياً
npm run test:auto-license
```

**المتوقع:**
- ✅ License يُنشأ بنجاح
- ✅ License key صحيح
- ✅ Status = ACTIVE أو PENDING
- ✅ بيانات في database

---

### 8️⃣ اختبار Cleanup (3 دقائق)

```bash
# اختبار حذف tokens منتهية الصلاحية
npm run cleanup:expired-tokens
```

**المتوقع:**
- ✅ Tokens القديمة تُحذف
- ✅ رسائل في console
- ✅ Database محدّثة

---

### 9️⃣ اختبار API بـ Postman (اختياري - 5 دقائق)

1. استورد الملف: `LicenseGate_API_v2.postman_collection.json`
2. اختبر endpoints:
   - ✅ Health check
   - ✅ Verify email
   - ✅ Resend verification
   - ✅ Get license

---

## ✅ Checklist سريع

- [ ] ✅ Stripe CLI مثبت وشغّال
- [ ] ✅ السيرفر يعمل بدون أخطاء
- [ ] ✅ Database connection ناجحة
- [ ] ✅ Email verification يعمل
- [ ] ✅ Webhook يستقبل events
- [ ] ✅ License يُنشأ تلقائياً
- [ ] ✅ Tokens cleanup يعمل
- [ ] ✅ Logs واضحة ومفيدة

---

## 🐛 حل المشاكل الشائعة

### المشكلة: "Stripe CLI not found"
```bash
brew install stripe/stripe-cli/stripe
```

### المشكلة: "Email not sending"
```bash
# تحقق من .env
cat .env | grep SMTP

# اختبر SMTP connection
npm run test:email-verification
```

### المشكلة: "Webhook signature verification failed"
```bash
# احصل على secret جديد من Stripe CLI
stripe listen --print-secret

# حدّث .env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# أعد تشغيل السيرفر
```

### المشكلة: "Database connection error"
```bash
# تحقق من Prisma
npx prisma db push
npx prisma generate

# أعد تشغيل السيرفر
npm run dev
```

---

## 📊 النتيجة المتوقعة

بعد إكمال جميع الخطوات، يجب أن يكون لديك:

✅ **Backend يعمل بكامل طاقته**
✅ **Stripe webhooks متصلة**
✅ **Email verification يعمل**
✅ **License auto-generation يعمل**
✅ **Database محدّثة وتعمل**
✅ **جميع Scripts تعمل**

---

## 🎯 الخطوة التالية

بعد نجاح جميع الاختبارات:

1. ✅ commit التغييرات
2. ✅ push للـ repository
3. ✅ إعداد production environment
4. ✅ البدء في Frontend integration

---

## 📞 إذا احتجت مساعدة

راجع:
- `IMPLEMENTATION_GUIDE.md` - دليل التنفيذ الكامل
- `API_DOCUMENTATION.md` - توثيق API
- `INTEGRATION_EXAMPLES.md` - أمثلة التكامل
- `PROGRESS_REPORT.md` - تقرير التقدم الشامل

---

**حظ موفق! 🚀**
