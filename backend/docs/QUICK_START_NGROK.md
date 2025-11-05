# ⚡ دليل البدء السريع - ngrok & PayPal Webhook

## 🎯 الوضع الحالي

✅ **Backend:** يعمل على المنفذ 3001  
✅ **ngrok:** يعمل ومتصل  
✅ **URL العام:** `https://e19c3ced395b.ngrok-free.app`  
✅ **PayPal Webhook:** `https://e19c3ced395b.ngrok-free.app/webhooks/paypal`

---

## 🚀 ما يمكنك فعله الآن

### الخيار 1: تسجيل Webhook على PayPal (5 دقائق)

**الخطوات:**

1. افتح: <https://developer.paypal.com/dashboard/>
2. اذهب إلى: **Apps & Credentials** → **Sandbox**
3. اختر تطبيقك (أو أنشئ واحد)
4. اضغط **Add Webhook**
5. أضف URL:

   ```text
   https://e19c3ced395b.ngrok-free.app/webhooks/paypal
   ```

6. اختر الأحداث:
   - ✅ `CHECKOUT.ORDER.APPROVED`
   - ✅ `PAYMENT.CAPTURE.COMPLETED`
   - ✅ `PAYMENT.CAPTURE.DENIED`

7. احفظ **Client ID** و **Client Secret** و **Webhook ID**

---

### الخيار 2: اختبار Webhook مباشرة (دقيقة واحدة)

```bash
curl -X POST https://e19c3ced395b.ngrok-free.app/webhooks/paypal \
  -H "Content-Type: application/json" \
  -d '{
    "id": "TEST-001",
    "event_type": "CHECKOUT.ORDER.APPROVED",
    "resource": {"id": "ORDER-123"}
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

### الخيار 3: إضافة PayPal Credentials (3 دقائق)

أضف إلى `/Users/sunmarke/license-gate/backend/.env`:

```env
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_client_secret_here
PAYPAL_WEBHOOK_ID=your_webhook_id_here
PAYPAL_MODE=sandbox
```

ثم أعد تشغيل الخادم:

```bash
# أوقف الخادم (Ctrl+C في terminal الخادم)
npm run dev
```

---

## 📊 مراقبة الطلبات

افتح في المتصفح:

```text
http://localhost:4040
```

ستجد كل الطلبات الواردة إلى ngrok!

---

## ⚠️ ملاحظات مهمة

### ngrok URL يتغير عند إعادة التشغيل

إذا أوقفت ngrok وأعدت تشغيله، سيتغير URL.  
**الحل:** أعد تسجيل webhook على PayPal بالـ URL الجديد.

### الخادم يجب أن يكون يعمل

تأكد أن backend server يعمل قبل اختبار webhook:

```bash
# تحقق
lsof -i :3001

# إذا لم يكن يعمل
cd /Users/sunmarke/license-gate/backend
npm run dev
```

---

## 🎯 الخطوات التالية الموصى بها

1. **اليوم:**
   - [ ] تسجيل webhook على PayPal
   - [ ] إضافة credentials إلى `.env`
   - [ ] اختبار webhook

2. **غداً:**
   - [ ] اختبار تدفق الدفع الكامل
   - [ ] اختبار auto-license generation
   - [ ] اختبار البريد الإلكتروني

---

## 📚 مستندات إضافية

- **دليل كامل:** `/Users/sunmarke/license-gate/backend/docs/NGROK_PAYPAL_SETUP.md`
- **خطة التنفيذ:** `/Users/sunmarke/license-gate/docs/IMPLEMENTATION_PLAN.md`

---

**تحديث أخير:** الآن (November 5, 2025)
