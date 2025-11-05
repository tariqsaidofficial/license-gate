# 📝 خطوات تسجيل PayPal Webhook

## 🎯 معلومات PayPal الخاصة بك

```
Email: sb-6i7lp36725064@business.example.com
Client ID: ATky3Zf8od6Gg6o9OuvHEUun4KewQ9Qevi0D1gYH-qhJ3OqfenU_8_hbVWKFRAibX0LxalGEERGKmE5U
Sandbox URL: https://sandbox.paypal.com
Dashboard: https://developer.paypal.com/dashboard/
```

---

## 🚀 خطوات التسجيل

### 1️⃣ افتح PayPal Developer Dashboard

👉 **افتح:** https://developer.paypal.com/dashboard/

سجل دخول بحساب PayPal Developer الخاص بك.

---

### 2️⃣ اذهب إلى Apps & Credentials

1. من القائمة العلوية، اختر **Sandbox**
2. اضغط على **Apps & Credentials**
3. ستجد تطبيقك **Default Application**

---

### 3️⃣ أضف Webhook

1. في صفحة التطبيق، مرر للأسفل إلى قسم **WEBHOOKS**
2. اضغط **Add Webhook**

---

### 4️⃣ أدخل معلومات Webhook

**Webhook URL:**
```
https://e19c3ced395b.ngrok-free.app/webhooks/paypal
```

⚠️ **مهم:** تأكد أن ngrok يعمل! إذا أعدت تشغيله، ستحتاج لتحديث الـ URL.

**Event types to subscribe to:**

اختر الأحداث التالية:

- ✅ `CHECKOUT.ORDER.APPROVED`
- ✅ `CHECKOUT.ORDER.COMPLETED`
- ✅ `PAYMENT.CAPTURE.COMPLETED`
- ✅ `PAYMENT.CAPTURE.DENIED`
- ✅ `PAYMENT.CAPTURE.DECLINED`
- ✅ `PAYMENT.CAPTURE.REFUNDED`

💡 **نصيحة:** يمكنك البحث عن "PAYMENT.CAPTURE" واختيار كل الأحداث المتعلقة.

---

### 5️⃣ احفظ Webhook

1. اضغط **Save**
2. ستحصل على **Webhook ID** - انسخه!

---

### 6️⃣ أضف Webhook ID إلى `.env`

افتح ملف `.env` وأضف:

```env
PAYPAL_WEBHOOK_ID=<الـ ID الذي نسخته>
```

مثال:
```env
PAYPAL_WEBHOOK_ID=8WT89xxxxxxxxxxxxx
```

---

### 7️⃣ أعد تشغيل Backend

```bash
# في terminal الخادم
# أوقف الخادم (Ctrl+C)
# ثم شغله مرة أخرى
npm run dev
```

---

## ✅ اختبار Webhook

### من PayPal Dashboard:

1. في صفحة Webhooks، اختر webhook الذي أنشأته
2. اضغط **Simulate Event**
3. اختر `PAYMENT.CAPTURE.COMPLETED`
4. اضغط **Send**

### من Terminal:

```bash
curl -X POST https://e19c3ced395b.ngrok-free.app/webhooks/paypal \
  -H "Content-Type: application/json" \
  -d '{
    "id": "WH-TEST-FROM-TERMINAL",
    "event_type": "PAYMENT.CAPTURE.COMPLETED",
    "resource": {
      "id": "CAPTURE-123",
      "amount": {"value": "99.99", "currency_code": "USD"}
    }
  }'
```

### مراقبة الطلبات:

افتح في المتصفح:
```
http://localhost:4040
```

ستجد كل webhook requests!

---

## 🎯 ملاحظات مهمة

### ⚠️ ngrok URL يتغير

إذا أعدت تشغيل ngrok، الـ URL سيتغير!

**الحل:**
1. احصل على الـ URL الجديد
2. حدّث webhook على PayPal Dashboard
3. أو استخدم ngrok مدفوع للحصول على URL ثابت

### ✅ التحقق من نجاح التسجيل

بعد التسجيل، اختبر:

```bash
# اختبار بسيط
curl -X POST https://e19c3ced395b.ngrok-free.app/webhooks/paypal \
  -H "Content-Type: application/json" \
  -d '{"id":"test","event_type":"TEST","resource":{}}'
```

يجب أن تحصل على:
```json
{"received":true,"message":"..."}
```

---

## 📚 روابط مفيدة

- **Dashboard:** https://developer.paypal.com/dashboard/
- **Webhooks Guide:** https://developer.paypal.com/docs/api-basics/notifications/webhooks/
- **ngrok Dashboard:** http://localhost:4040

---

**تحديث أخير:** الآن  
**ngrok URL:** https://e19c3ced395b.ngrok-free.app  
**Backend:** ✅ يعمل
