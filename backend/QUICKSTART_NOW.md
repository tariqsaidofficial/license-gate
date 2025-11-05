# 🚀 Quick Start Guide

## ⚡ البدء السريع في 5 دقائق

### 1️⃣ **تثبيت Dependencies** (إذا لم تكن مثبتة)
```bash
cd /Users/sunmarke/license-gate/backend
npm install
```

### 2️⃣ **إعداد Stripe (Development)**
```bash
# تثبيت Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# في terminal منفصل - تشغيل webhook listener
stripe listen --forward-to localhost:3001/webhooks/stripe
```

**انسخ webhook secret من الـ output وضعه في `.env`:**
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 3️⃣ **إعداد SMTP للتجربة (Mailtrap)**

سجّل في [Mailtrap](https://mailtrap.io) وحدّث `.env`:
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USERNAME=your_mailtrap_username
SMTP_PASSWORD=your_mailtrap_password
```

### 4️⃣ **تشغيل المشروع**
```bash
# Terminal 1: تشغيل server
npm run dev

# Terminal 2: Stripe webhook listener (من خطوة 2)
stripe listen --forward-to localhost:3001/webhooks/stripe
```

### 5️⃣ **اختبار الـ Flow**

في terminal ثالث:
```bash
# اختبار webhook
stripe trigger payment_intent.succeeded

# اختبار email verification
npm run test:email-verification
```

---

## ✅ تحقق من أن كل شيء يعمل

### Check 1: Server Running
افتح http://localhost:3001 - يجب أن ترى response من API

### Check 2: Stripe Webhook
```bash
stripe trigger payment_intent.succeeded
```
يجب أن ترى logs في terminal السيرفر

### Check 3: Database
```bash
npx prisma studio
```
افتح http://localhost:5555 لعرض البيانات

---

## 🎯 الـ Flow الكامل

```
1. Payment على Stripe
   ↓
2. Webhook يرسل event → /webhooks/stripe
   ↓
3. autoGenerateLicense() ينشئ/يجد user
   ↓
4. License يُنشأ (inactive للمستخدمين الجدد)
   ↓
5. Verification email يُرسل
   ↓
6. User ينقر على link → /verify-email?token=xxx
   ↓
7. License يُفعّل ✅
```

---

## 📝 Endpoints المتاحة

### tRPC Endpoints:
- `verification.verifyEmail` - التحقق من email
- `verification.resendVerification` - إعادة إرسال email
- `verification.getMyVerificationStatus` - حالة التحقق
- `verification.getStats` - إحصائيات (admin only)

### Express Endpoints:
- `POST /webhooks/stripe` - Stripe webhooks

---

## 🐛 إذا واجهت مشاكل

### المشكلة: "Cannot find module"
```bash
npx prisma generate
```

### المشكلة: Stripe webhook لا يعمل
```bash
# تأكد من أن port صحيح (3001)
stripe listen --forward-to localhost:3001/webhooks/stripe
```

### المشكلة: Emails لا ترسل
- تحقق من SMTP credentials في `.env`
- تأكد من أنك تستخدم Mailtrap للتجربة
- راجع terminal logs

---

## 📚 مستندات إضافية

- `SETUP_COMPLETE.md` - شرح كامل لما تم إنجازه
- `IMPLEMENTATION_GUIDE.md` - دليل التنفيذ
- `CHECKLIST.md` - قائمة التحقق
- `README_PHASE2.md` - تفاصيل المرحلة الثانية

---

🎉 **استمتع بالبرمجة!**
