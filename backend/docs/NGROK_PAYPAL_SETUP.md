# 🌐 دليل إعداد PayPal Webhook مع ngrok

## 📋 نظرة عامة

هذا الدليل يشرح كيفية اختبار PayPal webhooks محلياً باستخدام ngrok.

---

## ✅ المتطلبات المسبقة

- [x] Backend server يعمل على المنفذ 3001
- [x] ngrok مثبت ومصادق عليه
- [x] PayPal Sandbox Account

---

## 🚀 الإعداد السريع

### 1️⃣ تشغيل Backend Server

```bash
cd /Users/sunmarke/license-gate/backend
npm run dev
```

**التحقق:**
```bash
curl http://localhost:3001/webhooks/paypal \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"id":"test","event_type":"TEST"}'
```

**النتيجة المتوقعة:**
```json
{"received":true,"message":"Event already processed"}
```

---

### 2️⃣ تشغيل ngrok

```bash
ngrok http 3001
```

**معلومات ngrok الحالية:**
- **Authtoken:** مُعين ✅
- **Port:** 3001
- **Public URL:** `https://e19c3ced395b.ngrok-free.app`

**الحصول على URL:**
```bash
curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"'
```

---

### 3️⃣ PayPal Webhook URL

**URL الكامل:**
```
https://e19c3ced395b.ngrok-free.app/webhooks/paypal
```

---

## 🔧 تسجيل Webhook على PayPal Dashboard

### الخطوات:

1. **افتح PayPal Developer Dashboard**
   - URL: https://developer.paypal.com/dashboard/
   - تسجيل الدخول بحساب PayPal Developer

2. **اذهب إلى Apps & Credentials**
   - اختر **Sandbox** من القائمة العلوية
   - اضغط على **Create App** (أو اختر تطبيق موجود)

3. **إعدادات التطبيق**
   - أضف اسم التطبيق: `LicenseGate Sandbox`
   - اختر **Merchant** كنوع الحساب

4. **احصل على Credentials**
   ```
   Client ID: AcBg-OQOawAzNywzXC_xxxxxxxxxxxx
   Client Secret: EK7Ck-xxxxxxxxxxxxxxxxxx
   ```

5. **أضف Webhook**
   - في قسم **Webhooks**, اضغط **Add Webhook**
   - **Webhook URL:** `https://e19c3ced395b.ngrok-free.app/webhooks/paypal`
   - **Event types:** اختر الأحداث التالية:

### 📋 الأحداث المطلوبة:

```
✅ CHECKOUT.ORDER.APPROVED
✅ CHECKOUT.ORDER.COMPLETED
✅ PAYMENT.CAPTURE.COMPLETED
✅ PAYMENT.CAPTURE.DENIED
✅ PAYMENT.CAPTURE.DECLINED
✅ PAYMENT.CAPTURE.REFUNDED
```

6. **احفظ Webhook ID**
   ```
   Webhook ID: 8WT89xxxxxxxxxxxxx
   ```

---

## 🔐 تحديث Environment Variables

أضف المتغيرات التالية إلى `.env`:

```env
# PayPal Sandbox Configuration
PAYPAL_CLIENT_ID=AcBg-OQOawAzNywzXC_xxxxxxxxxxxx
PAYPAL_CLIENT_SECRET=EK7Ck-xxxxxxxxxxxxxxxxxx
PAYPAL_WEBHOOK_ID=8WT89xxxxxxxxxxxxx
PAYPAL_MODE=sandbox
```

**إعادة تشغيل Backend:**
```bash
# أوقف الخادم الحالي (Ctrl+C)
npm run dev
```

---

## 🧪 اختبار Webhook

### اختبار 1: اختبار بسيط

```bash
curl -X POST https://e19c3ced395b.ngrok-free.app/webhooks/paypal \
  -H "Content-Type: application/json" \
  -d '{
    "id": "WH-TEST-001",
    "event_type": "CHECKOUT.ORDER.APPROVED",
    "resource": {
      "id": "ORDER-123",
      "status": "APPROVED"
    }
  }'
```

**النتيجة المتوقعة:**
```json
{
  "received": true,
  "message": "Order ORDER-123 approved, waiting for capture"
}
```

---

### اختبار 2: اختبار مع PayPal Sandbox

```bash
npx ts-node scripts/test-paypal-sandbox.ts
```

هذا السكريبت سيقوم بـ:
1. ✅ إنشاء order جديد
2. ✅ الحصول على approval URL
3. ✅ انتظار الموافقة (يدوياً)
4. ✅ Capture الدفع
5. ✅ التحقق من webhook

---

### اختبار 3: محاكاة webhook من PayPal

في PayPal Dashboard:
1. اذهب إلى **Webhooks**
2. اختر webhook الخاص بك
3. اضغط **Simulate**
4. اختر event type (مثلاً `PAYMENT.CAPTURE.COMPLETED`)
5. اضغط **Send**

تحقق من logs الخادم:
```bash
# في terminal آخر
tail -f backend.log
```

---

## 📊 مراقبة Webhooks

### عبر ngrok Dashboard

افتح في المتصفح:
```
http://localhost:4040
```

ستجد:
- **Inspect:** كل الطلبات الواردة
- **Replay:** إعادة تشغيل الطلبات
- **Status:** حالة الطلبات

### عبر Backend Logs

```bash
# تشغيل مع logs مفصلة
DEBUG=* npm run dev
```

---

## 🔍 استكشاف الأخطاء

### المشكلة: ngrok يقول "connection refused"

**الحل:**
```bash
# تأكد من أن الخادم يعمل
lsof -i :3001

# إذا لم يكن يعمل
cd /Users/sunmarke/license-gate/backend
npm run dev
```

---

### المشكلة: PayPal لا يرسل webhooks

**الأسباب المحتملة:**
1. ❌ Webhook URL غير صحيح
2. ❌ ngrok توقف
3. ❌ Firewall يحجب الطلبات

**الحل:**
```bash
# تأكد من أن ngrok يعمل
curl http://localhost:4040/api/tunnels

# أعد تسجيل webhook على PayPal
```

---

### المشكلة: Webhook يصل لكن يفشل

**التحقق:**
```bash
# شاهد logs الخادم
tail -f logs/webhook.log

# اختبر يدوياً
curl -X POST http://localhost:3001/webhooks/paypal \
  -H "Content-Type: application/json" \
  -d @test-webhook-payload.json
```

---

## 📝 نصائح مهمة

### 1. ngrok URL يتغير عند إعادة التشغيل

**المشكلة:** 
عند إعادة تشغيل ngrok، يتغير URL.

**الحل (خطة مجانية):**
- أعد تسجيل webhook على PayPal في كل مرة
- استخدم `ngrok http 3001 --domain=your-domain.ngrok-free.app` (يتطلب خطة مدفوعة)

**الحل (خطة مدفوعة):**
```bash
# احصل على domain ثابت
ngrok http 3001 --domain=licensegate.ngrok-free.app
```

---

### 2. أمان Webhook

**في الإنتاج:**
- ✅ تحقق من PayPal webhook signature
- ✅ استخدم HTTPS فقط
- ✅ حدد IP addresses المسموح بها

**للتطوير:**
- ⚠️ ngrok يوفر HTTPS تلقائياً
- ⚠️ لا حاجة للتحقق من signature (اختياري)

---

### 3. معدل الطلبات (Rate Limiting)

ngrok المجاني:
- ⚠️ محدود بـ 40 connections/minute
- ⚠️ session timeout بعد 8 ساعات

**للاستخدام المكثف:**
- استخدم ngrok المدفوع
- أو استخدم خدمة أخرى (localtunnel, serveo)

---

## 🚀 الخطوات التالية

### ✅ ما تم إنجازه:
1. ✅ Backend server يعمل
2. ✅ ngrok مُعد ويعمل
3. ✅ PayPal webhook endpoint متاح عبر الإنترنت
4. ✅ اختبار أولي ناجح

### 📋 المهام التالية:
1. [ ] تسجيل webhook على PayPal Dashboard
2. [ ] إضافة PayPal credentials إلى `.env`
3. [ ] اختبار تدفق الدفع الكامل
4. [ ] اختبار auto-license generation
5. [ ] اختبار إرسال البريد الإلكتروني

---

## 📚 موارد إضافية

- [PayPal Webhooks Guide](https://developer.paypal.com/docs/api-basics/notifications/webhooks/)
- [ngrok Documentation](https://ngrok.com/docs)
- [PayPal Sandbox Testing](https://developer.paypal.com/docs/api-basics/sandbox/)

---

## 🎯 ملخص سريع

```bash
# 1. شغل Backend
cd /Users/sunmarke/license-gate/backend
npm run dev

# 2. شغل ngrok (في terminal آخر)
ngrok http 3001

# 3. احصل على URL
curl -s http://localhost:4040/api/tunnels | grep public_url

# 4. سجل على PayPal
# URL: https://e19c3ced395b.ngrok-free.app/webhooks/paypal

# 5. اختبر
curl -X POST https://e19c3ced395b.ngrok-free.app/webhooks/paypal \
  -H "Content-Type: application/json" \
  -d '{"id":"test","event_type":"TEST","resource":{}}'
```

---

**آخر تحديث:** November 5, 2025  
**ngrok URL الحالي:** `https://e19c3ced395b.ngrok-free.app`  
**حالة الخادم:** ✅ يعمل على المنفذ 3001
