# 🚀 دليل الميزات المتقدمة - LicenseGate

## 📋 فهرس المحتويات

1. [التحكم في مدة المفاتيح](#التحكم-في-مدة-المفاتيح)
2. [الإنشاء التلقائي للتراخيص (Automake)](#الإنشاء-التلقائي-للتراخيص)
3. [التكامل مع منصات الدفع](#التكامل-مع-منصات-الدفع)
4. [API & Webhooks للتطبيقات الخارجية](#api--webhooks)
5. [إدارة حالة التراخيص](#إدارة-حالة-التراخيص)

---

## 1️⃣ التحكم في مدة المفاتيح

### ✅ الميزات المتاحة حالياً

#### أ) تاريخ انتهاء الصلاحية (Expiration Date)

```typescript
{
  expirationDate: "2025-12-31T23:59:59.000Z"  // تاريخ محدد
}
```

**الاستخدام:**
- يمكن تعيين أي تاريخ مستقبلي
- الترخيص يصبح غير صالح تلقائياً بعد هذا التاريخ
- مثالي للاشتراكات الشهرية/السنوية

**مثال عملي:**
```typescript
// إنشاء ترخيص لمدة سنة
const license = await trpc.license.create.mutate({
  name: "Premium Annual License",
  expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  active: true
});
```

#### ب) نظام Rate Limiting المتقدم

```typescript
{
  validationLimit: 1000,        // الحد الأقصى: 1000 استخدام
  validationPoints: 1000,       // النقاط المتبقية
  replenishAmount: 100,         // تجديد 100 نقطة
  replenishInterval: "HOUR"     // كل ساعة
}
```

**الفترات المتاحة:**
- `TEN_SECONDS` - كل 10 ثواني
- `MINUTE` - كل دقيقة
- `HOUR` - كل ساعة
- `DAY` - كل يوم

**مثال عملي:**
```typescript
// ترخيص بـ 100 استخدام يومياً
const license = await trpc.license.create.mutate({
  name: "API Rate Limited License",
  validationLimit: 100,
  validationPoints: 100,
  replenishAmount: 100,
  replenishInterval: "DAY",
  active: true
});
```

#### ج) حد عناوين IP

```typescript
{
  ipLimit: 5  // الحد الأقصى: 5 أجهزة مختلفة
}
```

**الاستخدام:**
- يحد من عدد الأجهزة/عناوين IP التي يمكنها استخدام نفس الترخيص
- مثالي لمنع المشاركة غير المصرح بها

#### د) نطاقات الصلاحيات (Scopes)

```typescript
{
  licenseScope: "premium,api-access,export"
}
```

**الاستخدام:**
- تحديد الميزات المتاحة لكل ترخيص
- يمكن فحصها في التطبيق لتفعيل/تعطيل ميزات معينة

---

## 2️⃣ الإنشاء التلقائي للتراخيص (Automake)

### 📊 الحالة الحالية

**الميزة:** ❌ غير متوفرة حالياً
**مستوى الصعوبة:** ⭐⭐⭐ متوسط (3-5 أيام)
**الحالة:** ✅ تم إنشاء نموذج أولي في `backend/src/routers/webhook.ts`

### 🛠️ كيفية العمل (النموذج الأولي)

#### المراحل:
1. **استقبال إشعار الدفع** من منصة الدفع (Stripe/PayPal)
2. **التحقق من صحة الدفعة** والتوقيع الأمني
3. **إنشاء/البحث عن المستخدم** تلقائياً
4. **إنشاء الترخيص** بناءً على الباقة المشتراة
5. **إرسال بريد إلكتروني** بالترخيص للعميل

#### مثال على الـ Webhook:

```typescript
POST /trpc/webhook.stripePayment

{
  "paymentId": "pi_1234567890",
  "amount": 99.99,
  "status": "completed",
  "customer": {
    "email": "customer@example.com",
    "name": "Ahmed Ali"
  },
  "product": {
    "id": "premium-annual",
    "name": "Premium Annual Plan",
    "duration": 365,        // 365 يوم
    "ipLimit": 3,
    "validationLimit": 10000,
    "scopes": ["premium", "api", "export"]
  }
}
```

**النتيجة:**
- ✅ ترخيص جديد يُنشأ تلقائياً
- ✅ بريد إلكتروني يُرسل للعميل مع المفتاح
- ✅ الترخيص جاهز للاستخدام فوراً

### 📧 نموذج البريد الإلكتروني

```html
🎉 شكراً لشرائك Premium Annual Plan!

مرحباً Ahmed Ali,

تم تفعيل ترخيصك بنجاح! إليك مفتاح الترخيص الخاص بك:

┌─────────────────────────────────┐
│   ABC-DEF-GHI-JKL-MNO-PQR      │
└─────────────────────────────────┘

تاريخ انتهاء الصلاحية: 31/12/2025

كيفية الاستخدام:
1. انسخ مفتاح الترخيص أعلاه
2. افتح البرنامج/التطبيق
3. الصق المفتاح في خانة التفعيل
4. استمتع بجميع المزايا! 🚀
```

### 🔧 المتطلبات للتفعيل الكامل:

1. ✅ **إعداد Stripe/PayPal Webhooks**
2. ✅ **تكوين SMTP للبريد الإلكتروني** (موجود)
3. ⚠️ **إنشاء نظام تسجيل المستخدمين التلقائي**
4. ⚠️ **إضافة التحقق من التوقيع الأمني**
5. ⚠️ **معالجة الأخطاء والإعادة التلقائية**

---

## 3️⃣ التكامل مع منصات الدفع

### 💳 منصات الدفع المدعومة (قابلة للإضافة)

#### أ) Stripe ⭐⭐⭐⭐⭐ (الأفضل)

**المزايا:**
- ✅ دعم عالمي شامل
- ✅ Webhooks موثوقة ومتقدمة
- ✅ دعم الاشتراكات التلقائية
- ✅ لوحة تحكم ممتازة

**التكامل:**
```bash
npm install stripe
```

```typescript
// في webhook.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// التحقق من التوقيع
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  req.body,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
);

if (event.type === 'payment_intent.succeeded') {
  // إنشاء الترخيص تلقائياً
}
```

#### ب) PayPal ⭐⭐⭐⭐

**المزايا:**
- ✅ شائع عالمياً
- ✅ سهل الاستخدام
- ✅ دعم جيد للـ Webhooks

**التكامل:**
```bash
npm install @paypal/checkout-server-sdk
```

#### ج) Paddle ⭐⭐⭐⭐

**المزايا:**
- ✅ مخصص للمنتجات الرقمية
- ✅ يتعامل مع الضرائب تلقائياً
- ✅ Webhooks موثوقة

#### د) منصات محلية/عربية

1. **Tap Payments** 🇸🇦 - للسوق السعودي
2. **Paymob** 🇪🇬 - للسوق المصري
3. **Telr** 🇦🇪 - للإمارات والخليج
4. **Fawry** 🇪🇬 - مصر

### 🔗 مثال تكامل كامل مع Stripe

```typescript
// 1. صفحة الدفع (Frontend)
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe('pk_...');

const { error } = await stripe.redirectToCheckout({
  lineItems: [{
    price: 'price_premium_annual',
    quantity: 1
  }],
  mode: 'payment',
  successUrl: 'https://yourdomain.com/success',
  cancelUrl: 'https://yourdomain.com/cancel',
  customerEmail: 'customer@example.com',
  metadata: {
    productId: 'premium-annual',
    duration: '365'
  }
});

// 2. Webhook Handler (Backend)
app.post('/webhook/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
    
    if (event.type === 'payment_intent.succeeded') {
      const payment = event.data.object;
      
      // إنشاء الترخيص تلقائياً
      await trpc.webhook.stripePayment.mutate({
        paymentId: payment.id,
        amount: payment.amount / 100,
        status: 'completed',
        customer: {
          email: payment.receipt_email,
          name: payment.shipping?.name || 'Customer'
        },
        product: payment.metadata
      });
    }
    
    res.json({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
```

---

## 4️⃣ API & Webhooks للتطبيقات الخارجية

### ✅ الميزات المتاحة حالياً

#### أ) REST API للتحقق من التراخيص

**الاستخدام في أي تطبيق:**

```bash
# التحقق من الترخيص
curl http://localhost:3001/license/{userId}/{licenseKey}/verify
```

**الرد:**
```json
{
  "valid": true,
  "status": "VALID",
  "expirationDate": "2025-12-31T23:59:59.000Z",
  "scopes": ["premium", "api-access"],
  "ipLimit": 5,
  "validationPoints": 950
}
```

**الحالات الممكنة:**
- `VALID` - ترخيص صالح ✅
- `NOT_FOUND` - الترخيص غير موجود ❌
- `NOT_ACTIVE` - الترخيص معطل ⏸️
- `EXPIRED` - انتهت صلاحيته ⏰
- `LICENSE_SCOPE_FAILED` - نطاق الصلاحية غير متطابق 🔒
- `IP_LIMIT_EXCEEDED` - تجاوز حد IP 🚫
- `RATE_LIMIT_EXCEEDED` - تجاوز حد الاستخدام ⚡

#### ب) tRPC API (Type-Safe)

**للتطبيقات TypeScript:**

```typescript
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

const client = createTRPCProxyClient({
  links: [
    httpBatchLink({
      url: 'http://localhost:3001/trpc',
    }),
  ],
});

// التحقق من الترخيص
const result = await client.license.verify.query({
  licenseKey: 'ABC-DEF-GHI'
});

if (result.valid) {
  // تفعيل الميزات بناءً على scopes
  if (result.scopes?.includes('premium')) {
    enablePremiumFeatures();
  }
  
  if (result.scopes?.includes('api-access')) {
    enableAPIAccess();
  }
}
```

#### ج) مثال تكامل مع تطبيق SaaS

```typescript
// في تطبيق SaaS الخاص بك
class LicenseValidator {
  private apiUrl = 'http://localhost:3001';
  
  async validateLicense(userId: number, licenseKey: string) {
    const response = await fetch(
      `${this.apiUrl}/license/${userId}/${licenseKey}/verify`
    );
    
    const data = await response.json();
    
    return {
      isValid: data.valid,
      features: this.parseScopes(data.scopes),
      expiresAt: new Date(data.expirationDate),
      remainingUses: data.validationPoints
    };
  }
  
  private parseScopes(scopes: string[] | undefined) {
    return {
      hasPremium: scopes?.includes('premium') ?? false,
      hasAPI: scopes?.includes('api-access') ?? false,
      hasExport: scopes?.includes('export') ?? false,
      hasSupport: scopes?.includes('priority-support') ?? false
    };
  }
}

// الاستخدام في Middleware
app.use(async (req, res, next) => {
  const license = req.headers['x-license-key'];
  const userId = req.user.id;
  
  const validator = new LicenseValidator();
  const result = await validator.validateLicense(userId, license);
  
  if (!result.isValid) {
    return res.status(403).json({ error: 'Invalid license' });
  }
  
  // إضافة الميزات المتاحة للـ request
  req.licenseFeatures = result.features;
  next();
});

// في الـ Routes
app.get('/api/premium-feature', (req, res) => {
  if (!req.licenseFeatures.hasPremium) {
    return res.status(403).json({ 
      error: 'Premium license required' 
    });
  }
  
  // تنفيذ الميزة المميزة
  res.json({ data: 'Premium content' });
});
```

### 🔗 Webhooks للأحداث

**قريباً - يمكن إضافتها بسهولة:**

```typescript
// إشعار عند انتهاء الترخيص
POST https://your-app.com/webhooks/license-expired
{
  "licenseId": 123,
  "userId": 456,
  "licenseKey": "ABC-DEF-GHI",
  "expiredAt": "2025-12-31T23:59:59.000Z"
}

// إشعار عند اقتراب الانتهاء (7 أيام قبل)
POST https://your-app.com/webhooks/license-expiring-soon

// إشعار عند تجاوز حد الاستخدام
POST https://your-app.com/webhooks/license-limit-exceeded
```

---

## 5️⃣ إدارة حالة التراخيص

### ✅ الميزات المتاحة حالياً

#### أ) تفعيل/تعطيل الترخيص

```typescript
// تعطيل الترخيص
await trpc.license.update.mutate({
  id: licenseId,
  active: false  // الترخيص معطل الآن
});

// إعادة التفعيل
await trpc.license.update.mutate({
  id: licenseId,
  active: true  // الترخيص مفعل مرة أخرى
});
```

**الاستخدامات:**
- ⏸️ **التعليق المؤقت** - عند عدم السداد
- 🚫 **الإيقاف** - عند انتهاء الفترة التجريبية
- 🔄 **إعادة التفعيل** - بعد تجديد الاشتراك

#### ب) حذف الترخيص نهائياً

```typescript
// حذف الترخيص بشكل نهائي
await trpc.license.delete.mutate({
  id: licenseId
});
```

**ملاحظة:** يتم حذف جميع سجلات الاستخدام المرتبطة تلقائياً (Cascade Delete)

#### ج) تعديل الصلاحيات

```typescript
// تعديل أي جانب من الترخيص
await trpc.license.update.mutate({
  id: licenseId,
  
  // تمديد المدة
  expirationDate: new Date('2026-12-31'),
  
  // زيادة حد IP
  ipLimit: 10,
  
  // إضافة صلاحيات جديدة
  licenseScope: 'premium,api-access,export,priority-support',
  
  // زيادة حد الاستخدام
  validationLimit: 50000,
  validationPoints: 50000
});
```

#### د) مراقبة الاستخدام

```typescript
// الحصول على تفاصيل الترخيص مع السجلات
const license = await trpc.license.read.query({
  id: licenseId
});

console.log('الاستخدام:', {
  total: license.logs.length,
  successful: license.logs.filter(l => l.result === 'VALID').length,
  failed: license.logs.filter(l => l.result !== 'VALID').length,
  uniqueIPs: new Set(license.logs.map(l => l.ip)).size
});
```

### 📊 سيناريوهات الاستخدام الشائعة

#### 1. تجميد الترخيص عند عدم السداد

```typescript
async function suspendLicenseForNonPayment(licenseId: number) {
  await trpc.license.update.mutate({
    id: licenseId,
    active: false,
    notes: `تم التعليق في ${new Date().toLocaleDateString()} - عدم السداد`
  });
  
  // إرسال بريد للعميل
  await sendEmail({
    to: customer.email,
    subject: 'تنبيه: تم تعليق الترخيص',
    body: 'الرجاء تجديد الاشتراك لإعادة التفعيل'
  });
}
```

#### 2. ترقية الترخيص (Upgrade)

```typescript
async function upgradeLicense(licenseId: number, newPlan: string) {
  const upgrades = {
    'basic-to-premium': {
      scopes: 'premium,api-access,export',
      ipLimit: 10,
      validationLimit: 50000
    },
    'premium-to-enterprise': {
      scopes: 'premium,api-access,export,priority-support,custom-branding',
      ipLimit: null, // غير محدود
      validationLimit: null // غير محدود
    }
  };
  
  await trpc.license.update.mutate({
    id: licenseId,
    ...upgrades[newPlan]
  });
}
```

#### 3. تجديد تلقائي

```typescript
// يمكن إضافة Cron Job
import cron from 'node-cron';

// كل يوم في منتصف الليل
cron.schedule('0 0 * * *', async () => {
  const expiringSoon = await prisma.license.findMany({
    where: {
      expirationDate: {
        gte: new Date(),
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 أيام
      },
      active: true
    }
  });
  
  for (const license of expiringSoon) {
    // إرسال تذكير بالتجديد
    await sendRenewalReminder(license);
  }
});
```

---

## 🎯 ملخص الإمكانيات

| الميزة | الحالة | الصعوبة | الوقت المتوقع |
|--------|--------|---------|---------------|
| ✅ التحكم في المدة | متاح | - | - |
| ✅ حدود الاستخدام | متاح | - | - |
| ✅ حدود IP | متاح | - | - |
| ✅ نطاقات الصلاحيات | متاح | - | - |
| ⚠️ الإنشاء التلقائي | نموذج جاهز | متوسط | 3-5 أيام |
| ⚠️ تكامل Stripe | قابل للإضافة | سهل | 1-2 يوم |
| ⚠️ تكامل PayPal | قابل للإضافة | سهل | 1-2 يوم |
| ✅ REST API | متاح | - | - |
| ✅ tRPC API | متاح | - | - |
| ⚠️ Webhooks للأحداث | قابل للإضافة | متوسط | 2-3 أيام |
| ✅ تعليق/إيقاف | متاح | - | - |
| ✅ حذف الترخيص | متاح | - | - |
| ✅ تعديل الصلاحيات | متاح | - | - |

---

## 📞 المساعدة والدعم

هل تحتاج مساعدة في تنفيذ أي من هذه الميزات؟ نحن هنا للمساعدة! 🚀
