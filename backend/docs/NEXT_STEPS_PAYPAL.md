# ⚡ الخطوات التالية - PayPal Webhook

## ✅ ما تم إنجازه

1. ✅ **PayPal credentials** تمت إضافتها إلى `.env`
2. ✅ **PayPal SDK** يعمل بنجاح
3. ✅ **Backend** يعمل على المنفذ 3001
4. ✅ **ngrok** يعمل ويوفر URL عام
5. ✅ **Test order** تم إنشاؤه بنجاح

---

## 🎯 الآن افعل هذا

### الخيار 1: تسجيل Webhook (5 دقائق) ⭐

**الخطوات:**

1. افتح: <https://developer.paypal.com/dashboard/>

2. **Apps & Credentials** → **Sandbox** → **Default Application**

3. مرر للأسفل → **WEBHOOKS** → **Add Webhook**

4. أدخل URL:
   ```
   https://e19c3ced395b.ngrok-free.app/webhooks/paypal
   ```

5. اختر الأحداث:
   - ✅ `PAYMENT.CAPTURE.COMPLETED`
   - ✅ `CHECKOUT.ORDER.APPROVED`

6. احفظ وانسخ **Webhook ID**

7. أضف إلى `.env`:
   ```env
   PAYPAL_WEBHOOK_ID=<الـ ID>
   ```

8. أعد تشغيل الخادم

**دليل كامل:** `backend/docs/PAYPAL_WEBHOOK_REGISTRATION_STEPS.md`

---

### الخيار 2: اختبار الدفع الكامل الآن (3 دقائق) 🚀

لديك order جاهز للاختبار:

**Order ID:** `6U573716C8028094U`

**خطوات الاختبار:**

1. افتح هذا الرابط في المتصفح:
   ```
   https://www.sandbox.paypal.com/checkoutnow?token=6U573716C8028094U
   ```

2. سجل دخول بحساب buyer sandbox (مختلف عن business account)

3. أكمل الدفع

4. بعد الموافقة، شغل:
   ```bash
   npx ts-node scripts/capture-paypal-order.ts 6U573716C8028094U
   ```

---

## 📊 معلومات PayPal الخاصة بك

```
Business Account: sb-6i7lp36725064@business.example.com
Client ID: ATky3Zf8od6Gg6o9OuvHEUun4KewQ9Qevi0D1gYH-...
Webhook URL: https://e19c3ced395b.ngrok-free.app/webhooks/paypal
```

---

## 🔍 مراقبة Webhooks

افتح: <http://localhost:4040>

ستجد كل الطلبات الواردة من PayPal!

---

## 💡 نصيحة

ابدأ بتسجيل Webhook أولاً، ثم اختبر الدفع الكامل.

**الترتيب الموصى به:**
1. تسجيل webhook ✅
2. اختبار webhook من PayPal Dashboard
3. اختبار تدفق الدفع الكامل
4. اختبار auto-license generation

---

**الحالة الآن:**
- Backend: ✅ يعمل
- ngrok: ✅ يعمل  
- PayPal: ✅ متصل
- Webhook: ⏳ يحتاج تسجيل
