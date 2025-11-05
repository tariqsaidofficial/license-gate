# ✅ Implementation Checklist - المرحلة الثانية

استخدم هذا الـ Checklist للتأكد من إكمال جميع الخطوات

---

## 📋 Pre-Implementation

- [ ] قراءة `README_PHASE2.md`
- [ ] قراءة `IMPLEMENTATION_GUIDE.md`
- [ ] Backup قاعدة البيانات الحالية
- [ ] التأكد من وجود Git repository

---

## 🗄️ Database Setup

- [ ] تحديث `prisma/schema.prisma` بـ `EmailVerificationToken` model
- [ ] إضافة relation في `User` model
- [ ] تشغيل `npx prisma migrate dev --name add_email_verification`
- [ ] تشغيل `npx prisma generate`
- [ ] التحقق بـ `npx prisma studio` أن الجدول موجود
- [ ] اختبار Connection بـ `npx prisma db push --preview-feature`

---

## 📦 Dependencies

- [ ] `npm install stripe@^14.0.0`
- [ ] `npm install argon2` (إذا لم يكن موجود)
- [ ] `npm install node-rsa` (إذا لم يكن موجود)
- [ ] `npm install nodemailer` (إذا لم يكن موجود)
- [ ] `npm install -D @types/node-rsa @types/nodemailer`
- [ ] التحقق بـ `npm list stripe argon2 node-rsa nodemailer`

---

## 🔧 Configuration

### Environment Variables

- [ ] إضافة `FRONTEND_URL` إلى `.env`
- [ ] إضافة `STRIPE_SECRET_KEY` إلى `.env`
- [ ] إضافة `STRIPE_PUBLISHABLE_KEY` إلى `.env`
- [ ] إضافة `STRIPE_WEBHOOK_SECRET` إلى `.env`
- [ ] التحقق من `SMTP_*` variables موجودة
- [ ] نسخ `.env.example` لـ `.env.production` (إذا لزم)

### Stripe Setup

- [ ] إنشاء حساب Stripe Test
- [ ] الحصول على Test API Keys
- [ ] تثبيت Stripe CLI: `brew install stripe/stripe-cli/stripe`
- [ ] Login: `stripe login`
- [ ] Test: `stripe trigger payment_intent.succeeded`

---

## 📁 Files Verification

### Services Created

- [ ] `services/user/user-service.ts` موجود
- [ ] `services/email/verification-service.ts` موجود
- [ ] `services/license/auto-generator.ts` محدّث

### Webhooks Created

- [ ] `webhooks/stripe-handler.ts` موجود

### Routers Created

- [ ] `routers/verification.ts` موجود (اختياري)

### Scripts Created

- [ ] `scripts/test-email-verification.ts` موجود
- [ ] `scripts/test-webhook-flow.ts` موجود
- [ ] `scripts/cleanup-expired-tokens.ts` موجود

### Documentation Created

- [ ] `IMPLEMENTATION_GUIDE.md` موجود
- [ ] `README_PHASE2.md` موجود
- [ ] `QUICKSTART.md` موجود
- [ ] `PRISMA_SCHEMA_UPDATE.md` موجود

---

## 🧪 Testing Phase

### Unit Tests

- [ ] `npm run build` ينجح بدون أخطاء
- [ ] Test User Service manually:
  ```bash
  npx ts-node -e "import { createOrFindUser } from './src/services/user/user-service'; ..."
  ```
- [ ] Test Email Verification manually (إذا تم تحديث schema)
- [ ] التحقق من TypeScript errors: `npx tsc --noEmit`

### Integration Tests

- [ ] `npm run test:email-verification` (بعد schema update)
- [ ] `npm run test:webhook-flow` (بعد schema update)
- [ ] `npm run test:auto-license` (إذا كان موجود)

### Manual Testing

- [ ] إنشاء user يدوياً في database
- [ ] إنشاء verification token
- [ ] اختبار إرسال email (استخدم Mailtrap)
- [ ] اختبار verify email token
- [ ] اختبار expired token
- [ ] اختبار duplicate payment (idempotency)

---

## 🔗 Integration

### tRPC Router

- [ ] إضافة `verificationRouter` إلى `_app.ts`
- [ ] Export types للـ frontend
- [ ] اختبار endpoints بـ Postman/Thunder Client

### Express Webhook Endpoint

- [ ] إنشاء `routes/webhooks.ts`
- [ ] إضافة إلى `app.ts` قبل `express.json()`
- [ ] التأكد من `express.raw()` middleware
- [ ] اختبار بـ `stripe listen`

### Email Service

- [ ] التحقق من SMTP credentials
- [ ] اختبار إرسال email يدوياً
- [ ] اختبار Email templates
- [ ] التأكد من links صحيحة

---

## 🔒 Security

- [ ] Webhook signature verification شغال
- [ ] Token expiration (24h) شغال
- [ ] One-time use tokens شغال
- [ ] Password hashing (argon2) شغال
- [ ] SQL injection prevention (Prisma)
- [ ] Environment variables آمنة (`.env` في `.gitignore`)
- [ ] Rate limiting (TODO للمستقبل)
- [ ] HTTPS في production (TODO)

---

## 📧 Email Templates

- [ ] Verification email template جاهز
- [ ] Activation confirmation template جاهز
- [ ] Templates responsive
- [ ] Templates تدعم العربية
- [ ] Links تعمل بشكل صحيح
- [ ] Branding/styling مناسب

---

## 🚀 Stripe Webhook Setup

### Development

- [ ] Stripe CLI مثبت
- [ ] `stripe listen --forward-to localhost:3000/webhooks/stripe` شغال
- [ ] Webhook Secret من CLI في `.env`
- [ ] Test: `stripe trigger payment_intent.succeeded`
- [ ] Logs تظهر في console

### Production (لاحقاً)

- [ ] تسجيل webhook URL في Stripe Dashboard
- [ ] إضافة events المطلوبة:
  - [ ] `payment_intent.succeeded`
  - [ ] `checkout.session.completed`
  - [ ] `payment_intent.payment_failed`
  - [ ] `charge.refunded`
- [ ] نسخ Webhook Secret إلى production `.env`
- [ ] اختبار webhook في production

---

## 📊 Monitoring & Logging

- [ ] Console logs واضحة ومنظمة
- [ ] Webhook events تُسجل في database
- [ ] Email sending errors تُسجل
- [ ] Success/failure rates قابلة للتتبع
- [ ] Error messages مفيدة للـ debugging

---

## 📚 Documentation

- [ ] Code comments موجودة
- [ ] JSDoc للـ functions الرئيسية
- [ ] README محدّث
- [ ] API documentation (اختياري)
- [ ] Postman collection (اختياري)

---

## 🎨 Frontend Integration (المرحلة القادمة)

- [ ] صفحة Verify Email
- [ ] صفحة Resend Verification
- [ ] Checkout page
- [ ] Success/Error pages
- [ ] User dashboard

---

## 🐛 Known Issues Resolution

### Issue: emailVerificationToken not found

- [ ] Applied Prisma migration
- [ ] Generated Prisma Client
- [ ] Restarted TypeScript server

### Issue: Stripe SDK not found

- [ ] Installed stripe package
- [ ] Correct version (^14.0.0)
- [ ] Rebuilt project

### Issue: Emails not sending

- [ ] SMTP credentials correct
- [ ] Port not blocked by firewall
- [ ] Using Mailtrap for testing
- [ ] Email service allows less secure apps (Gmail)

---

## 🚦 Pre-Deployment Checklist

- [ ] جميع الاختبارات نجحت
- [ ] No TypeScript errors
- [ ] No ESLint warnings (critical)
- [ ] Environment variables documented
- [ ] Database migration plan جاهز
- [ ] Rollback plan موجود
- [ ] Backup قبل deployment
- [ ] Monitoring setup جاهز

---

## 📈 Post-Deployment Verification

- [ ] Health check endpoint يعمل
- [ ] Webhook endpoint يستقبل events
- [ ] Emails ترسل بنجاح
- [ ] Database connections stable
- [ ] No errors في production logs
- [ ] Stripe webhooks في Dashboard تظهر "succeeded"

---

## 🎯 Success Criteria

- [ ] ✅ مستخدم جديد → يتم إنشاؤه تلقائياً
- [ ] ✅ Payment succeeded → License created
- [ ] ✅ Verification email → يُرسل
- [ ] ✅ User verifies email → License activated
- [ ] ✅ Existing user payment → License active immediately
- [ ] ✅ Duplicate payment → Handled (idempotency)
- [ ] ✅ Refund → License deactivated
- [ ] ✅ No crashes or errors

---

## 📝 Notes & Issues

استخدم هذا القسم لتسجيل أي ملاحظات أو مشاكل:

```
- التاريخ: ___________
- المشكلة: ___________
- الحل: ___________
```

---

## ✅ Final Approval

- [ ] تم مراجعة جميع الخطوات
- [ ] تم اختبار جميع الوظائف
- [ ] تم توثيق التغييرات
- [ ] الفريق على علم بالتحديثات
- [ ] جاهز للـ deployment

---

**Completed by:** _________________

**Date:** _________________

**Approved by:** _________________

---

🎉 **تهانينا! المرحلة الثانية مكتملة!** 🎉
