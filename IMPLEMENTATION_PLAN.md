# 🚀 LicenseGate - Implementation Plan
## Auto-License Generation with Payment Integration

---

## 📋 Overview

هذا المستند يوضح خطة تنفيذ كاملة لإضافة نظام **إنشاء تراخيص تلقائي** عند استلام الدفع من العملاء.

**الهدف:** عند قيام العميل بالدفع عبر منصة دفع، يتم تلقائياً:
1. ✅ إنشاء حساب للعميل (إذا لم يكن موجوداً)
2. ✅ إنشاء ترخيص جديد
3. ✅ إرسال بريد إلكتروني يحتوي على بيانات الترخيص
4. ✅ تفعيل الترخيص مباشرة

---

## 🎯 المكونات الأساسية

### 1️⃣ Webhook Endpoint لاستقبال إشعارات الدفع
### 2️⃣ Integration مع منصات الدفع (Stripe, PayPal, Ziina)
### 3️⃣ خدمة إرسال البريد الإلكتروني (SMTP - موجودة)
### 4️⃣ Auto-License Generator Service

---

## 📊 الجدول الزمني المتوقع

| المرحلة | الوقت المتوقع | الأولوية |
|---------|---------------|----------|
| Webhook Infrastructure | 1 يوم | عالية ⭐⭐⭐ |
| Stripe Integration | 2 أيام | عالية ⭐⭐⭐ |
| PayPal Integration | 2 أيام | متوسطة ⭐⭐ |
| Ziina Integration | 2 أيام | متوسطة ⭐⭐ |
| Email Templates | 1 يوم | عالية ⭐⭐⭐ |
| Auto-License Service | 1 يوم | عالية ⭐⭐⭐ |
| Testing & Security | 2 أيام | عالية ⭐⭐⭐ |
| **إجمالي** | **11 يوم** | |

---

## 🏗️ المرحلة 1: Webhook Infrastructure

### 📝 الوصف
إنشاء بنية تحتية لاستقبال ومعالجة Webhooks من منصات الدفع المختلفة.

### 🎯 المتطلبات

#### 1. Database Schema
```sql
-- جدول لتسجيل جميع Webhook Events
CREATE TABLE webhook_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  provider VARCHAR(50) NOT NULL,           -- stripe, paypal, ziina
  event_type VARCHAR(100) NOT NULL,        -- payment_intent.succeeded, etc
  event_id VARCHAR(255) UNIQUE NOT NULL,   -- معرف فريد من المنصة
  payload JSON NOT NULL,                   -- البيانات الكاملة
  status ENUM('pending', 'processed', 'failed') DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  INDEX idx_provider (provider),
  INDEX idx_status (status),
  INDEX idx_event_type (event_type)
);

-- جدول لربط الدفعات بالتراخيص
CREATE TABLE payment_licenses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payment_id VARCHAR(255) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  license_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE,
  INDEX idx_payment_id (payment_id),
  INDEX idx_user_id (user_id)
);
```

#### 2. Webhook Router
**الملف:** `backend/src/routers/webhook.ts`

```typescript
import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { stripeWebhookHandler } from '../services/webhooks/stripe';
import { paypalWebhookHandler } from '../services/webhooks/paypal';
import { ziinaWebhookHandler } from '../services/webhooks/ziina';

export const webhookRouter = router({
  // Stripe Webhook
  stripe: publicProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      return await stripeWebhookHandler(input, ctx);
    }),

  // PayPal Webhook
  paypal: publicProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      return await paypalWebhookHandler(input, ctx);
    }),

  // Ziina Webhook
  ziina: publicProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      return await ziinaWebhookHandler(input, ctx);
    }),
});
```

#### 3. Webhook Security Middleware
**الملف:** `backend/src/middleware/webhook-verification.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * التحقق من صحة Webhook من Stripe
 */
export function verifyStripeWebhook(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const signature = req.headers['stripe-signature'] as string;
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      secret
    );
    req.body = event;
    next();
  } catch (err) {
    console.error('Stripe webhook verification failed:', err);
    res.status(400).send('Webhook signature verification failed');
  }
}

/**
 * التحقق من صحة Webhook من PayPal
 */
export function verifyPayPalWebhook(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // PayPal webhook verification logic
  // سيتم تنفيذها في المرحلة الثانية
  next();
}

/**
 * التحقق من صحة Webhook من Ziina
 */
export function verifyZiinaWebhook(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const signature = req.headers['x-ziina-signature'] as string;
  const secret = process.env.ZIINA_WEBHOOK_SECRET!;

  try {
    const hash = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== signature) {
      throw new Error('Invalid signature');
    }
    next();
  } catch (err) {
    console.error('Ziina webhook verification failed:', err);
    res.status(400).send('Webhook signature verification failed');
  }
}
```

### 📦 Dependencies المطلوبة
```bash
npm install stripe @paypal/checkout-server-sdk
```

### 🔧 Environment Variables
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_WEBHOOK_ID=...
PAYPAL_MODE=sandbox  # أو production

# Ziina
ZIINA_API_KEY=...
ZIINA_MERCHANT_ID=...
ZIINA_WEBHOOK_SECRET=...
ZIINA_MODE=sandbox  # أو production
```

### ✅ Tasks Checklist
- [ ] إنشاء جداول قاعدة البيانات
- [ ] إنشاء Webhook Router
- [ ] تطبيق Security Middleware
- [ ] إضافة Environment Variables
- [ ] اختبار Webhook Endpoints

---

## 💳 المرحلة 2: Stripe Integration

### 📝 الوصف
التكامل الكامل مع Stripe لاستقبال المدفوعات وإنشاء التراخيص تلقائياً.

### 🎯 المتطلبات

#### 1. Stripe Service
**الملف:** `backend/src/services/payment/stripe.ts`

```typescript
import Stripe from 'stripe';
import { db } from '../../db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

/**
 * إنشاء Payment Intent لشراء ترخيص
 */
export async function createStripePayment(params: {
  email: string;
  productName: string;
  amount: number;
  currency: string;
  licenseConfig: {
    duration?: number;
    validationLimit?: number;
    ipLimit?: number;
    scopes?: string[];
  };
}) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: params.amount * 100, // تحويل إلى سنتات
    currency: params.currency,
    receipt_email: params.email,
    metadata: {
      email: params.email,
      product_name: params.productName,
      license_config: JSON.stringify(params.licenseConfig),
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}

/**
 * إنشاء Checkout Session
 */
export async function createStripeCheckout(params: {
  email: string;
  productName: string;
  amount: number;
  currency: string;
  licenseConfig: any;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: params.email,
    line_items: [
      {
        price_data: {
          currency: params.currency,
          product_data: {
            name: params.productName,
            description: `License for ${params.productName}`,
          },
          unit_amount: params.amount * 100,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      license_config: JSON.stringify(params.licenseConfig),
    },
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
}

/**
 * استرجاع معلومات Payment Intent
 */
export async function getStripePayment(paymentIntentId: string) {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
}
```

#### 2. Stripe Webhook Handler
**الملف:** `backend/src/services/webhooks/stripe.ts`

```typescript
import Stripe from 'stripe';
import { db } from '../../db';
import { autoGenerateLicense } from '../license/auto-generator';
import { logWebhookEvent } from '../webhook-logger';

export async function stripeWebhookHandler(event: Stripe.Event, ctx: any) {
  // تسجيل الحدث
  await logWebhookEvent({
    provider: 'stripe',
    eventType: event.type,
    eventId: event.id,
    payload: event,
  });

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(paymentIntent);
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // تحديث حالة الحدث
    await db.query(
      'UPDATE webhook_events SET status = ?, processed_at = NOW() WHERE event_id = ?',
      ['processed', event.id]
    );

    return { success: true };
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);

    // تحديث حالة الحدث مع الخطأ
    await db.query(
      'UPDATE webhook_events SET status = ?, error_message = ?, processed_at = NOW() WHERE event_id = ?',
      ['failed', error.message, event.id]
    );

    throw error;
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const email = paymentIntent.receipt_email || paymentIntent.metadata.email;
  const licenseConfig = JSON.parse(paymentIntent.metadata.license_config || '{}');

  // إنشاء ترخيص تلقائياً
  const result = await autoGenerateLicense({
    email,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency,
    paymentId: paymentIntent.id,
    provider: 'stripe',
    licenseConfig,
  });

  console.log('License auto-generated:', result);
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  console.error('Payment failed:', paymentIntent.id);
  // يمكن إضافة إشعار للمستخدم
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  // معالجة Checkout Session المكتمل
  console.log('Checkout completed:', session.id);
}
```

#### 3. Stripe tRPC Router
**الملف:** `backend/src/routers/stripe.ts`

```typescript
import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { createStripePayment, createStripeCheckout } from '../services/payment/stripe';

export const stripeRouter = router({
  createPayment: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        productName: z.string(),
        amount: z.number().positive(),
        currency: z.string().default('usd'),
        licenseConfig: z.object({
          duration: z.number().optional(),
          validationLimit: z.number().optional(),
          ipLimit: z.number().optional(),
          scopes: z.array(z.string()).optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      return await createStripePayment(input);
    }),

  createCheckout: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        productName: z.string(),
        amount: z.number().positive(),
        currency: z.string().default('usd'),
        licenseConfig: z.any(),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      return await createStripeCheckout(input);
    }),
});
```

### 🎨 Frontend Integration Example
**الملف:** `frontend/src/routes/checkout/+page.svelte`

```svelte
<script lang="ts">
  import { trpc } from '$lib/trpc';
  import { loadStripe } from '@stripe/stripe-js';

  let email = '';
  let loading = false;

  async function handleCheckout() {
    loading = true;
    try {
      const result = await trpc.stripe.createCheckout.mutate({
        email,
        productName: 'Pro License - 1 Year',
        amount: 99.99,
        currency: 'usd',
        licenseConfig: {
          duration: 365,
          validationLimit: 10000,
          ipLimit: 5,
          scopes: ['api', 'advanced_features'],
        },
        successUrl: `${window.location.origin}/checkout/success`,
        cancelUrl: `${window.location.origin}/checkout/cancel`,
      });

      // توجيه المستخدم لصفحة الدفع
      window.location.href = result.url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('فشل إنشاء الدفع. حاول مرة أخرى.');
    } finally {
      loading = false;
    }
  }
</script>

<div class="checkout-form">
  <h2>شراء ترخيص Pro</h2>
  <input
    type="email"
    bind:value={email}
    placeholder="البريد الإلكتروني"
    required
  />
  <button on:click={handleCheckout} disabled={loading}>
    {loading ? 'جاري التحميل...' : 'الدفع الآن - $99.99'}
  </button>
</div>
```

### ✅ Tasks Checklist
- [ ] إنشاء حساب Stripe Developer
- [ ] تثبيت Stripe SDK
- [ ] إنشاء Stripe Service
- [ ] إنشاء Webhook Handler
- [ ] إنشاء tRPC Router
- [ ] إضافة Frontend Integration
- [ ] اختبار مع Stripe Test Cards
- [ ] تفعيل Webhooks في Stripe Dashboard

---

## 💰 المرحلة 3: PayPal Integration

### 📝 الوصف
التكامل مع PayPal لدعم العملاء الذين يفضلون PayPal.

### 🎯 المتطلبات

#### 1. PayPal Service
**الملف:** `backend/src/services/payment/paypal.ts`

```typescript
import paypal from '@paypal/checkout-server-sdk';

// إعداد PayPal Environment
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;

  return process.env.PAYPAL_MODE === 'production'
    ? new paypal.core.LiveEnvironment(clientId, clientSecret)
    : new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

const client = new paypal.core.PayPalHttpClient(environment());

/**
 * إنشاء PayPal Order
 */
export async function createPayPalOrder(params: {
  email: string;
  productName: string;
  amount: number;
  currency: string;
  licenseConfig: any;
}) {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: params.currency.toUpperCase(),
          value: params.amount.toString(),
        },
        description: params.productName,
        custom_id: JSON.stringify({
          email: params.email,
          license_config: params.licenseConfig,
        }),
      },
    ],
    application_context: {
      brand_name: 'LicenseGate',
      user_action: 'PAY_NOW',
    },
  });

  const order = await client.execute(request);
  return {
    orderId: order.result.id,
    links: order.result.links,
  };
}

/**
 * إتمام الدفع (Capture)
 */
export async function capturePayPalOrder(orderId: string) {
  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  const capture = await client.execute(request);
  return capture.result;
}

/**
 * استرجاع معلومات Order
 */
export async function getPayPalOrder(orderId: string) {
  const request = new paypal.orders.OrdersGetRequest(orderId);
  const order = await client.execute(request);
  return order.result;
}
```

#### 2. PayPal Webhook Handler
**الملف:** `backend/src/services/webhooks/paypal.ts`

```typescript
import { autoGenerateLicense } from '../license/auto-generator';
import { logWebhookEvent } from '../webhook-logger';
import { getPayPalOrder } from '../payment/paypal';

export async function paypalWebhookHandler(event: any, ctx: any) {
  await logWebhookEvent({
    provider: 'paypal',
    eventType: event.event_type,
    eventId: event.id,
    payload: event,
  });

  try {
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        await handlePaymentCaptured(event);
        break;
      }

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED': {
        await handlePaymentFailed(event);
        break;
      }

      default:
        console.log(`Unhandled PayPal event: ${event.event_type}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error processing PayPal webhook:', error);
    throw error;
  }
}

async function handlePaymentCaptured(event: any) {
  const orderId = event.resource.supplementary_data?.related_ids?.order_id;
  const order = await getPayPalOrder(orderId);

  const customData = JSON.parse(order.purchase_units[0].custom_id || '{}');
  const email = customData.email;
  const licenseConfig = customData.license_config;

  await autoGenerateLicense({
    email,
    amount: parseFloat(order.purchase_units[0].amount.value),
    currency: order.purchase_units[0].amount.currency_code,
    paymentId: event.resource.id,
    provider: 'paypal',
    licenseConfig,
  });
}

async function handlePaymentFailed(event: any) {
  console.error('PayPal payment failed:', event.resource.id);
}
```

### ✅ Tasks Checklist
- [ ] إنشاء حساب PayPal Business
- [ ] تثبيت PayPal SDK
- [ ] إنشاء PayPal Service
- [ ] إنشاء Webhook Handler
- [ ] إنشاء tRPC Router
- [ ] إضافة Frontend Integration
- [ ] تفعيل Webhooks في PayPal Dashboard
- [ ] اختبار مع PayPal Sandbox

---

## 🇦🇪 المرحلة 4: Ziina Integration

### 📝 الوصف
التكامل مع Ziina - منصة دفع إماراتية حديثة تدعم المدفوعات في الشرق الأوسط.

### 🎯 المتطلبات

#### 1. Ziina Service
**الملف:** `backend/src/services/payment/ziina.ts`

```typescript
import axios from 'axios';

const ZIINA_API_URL = process.env.ZIINA_MODE === 'production'
  ? 'https://api.ziina.com/v1'
  : 'https://sandbox-api.ziina.com/v1';

const ziinaClient = axios.create({
  baseURL: ZIINA_API_URL,
  headers: {
    'Authorization': `Bearer ${process.env.ZIINA_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * إنشاء Payment Link في Ziina
 */
export async function createZiinaPayment(params: {
  email: string;
  productName: string;
  amount: number;
  currency: string;
  licenseConfig: any;
}) {
  const response = await ziinaClient.post('/payment-links', {
    amount: params.amount,
    currency: params.currency.toUpperCase(),
    description: params.productName,
    customer_email: params.email,
    metadata: {
      email: params.email,
      license_config: JSON.stringify(params.licenseConfig),
    },
    success_url: `${process.env.FRONTEND_URL}/checkout/success`,
    cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
  });

  return {
    paymentId: response.data.id,
    paymentUrl: response.data.url,
  };
}

/**
 * استرجاع معلومات الدفع
 */
export async function getZiinaPayment(paymentId: string) {
  const response = await ziinaClient.get(`/payments/${paymentId}`);
  return response.data;
}

/**
 * استرجاع حالة Payment Link
 */
export async function getZiinaPaymentLink(linkId: string) {
  const response = await ziinaClient.get(`/payment-links/${linkId}`);
  return response.data;
}
```

#### 2. Ziina Webhook Handler
**الملف:** `backend/src/services/webhooks/ziina.ts`

```typescript
import { autoGenerateLicense } from '../license/auto-generator';
import { logWebhookEvent } from '../webhook-logger';

export async function ziinaWebhookHandler(event: any, ctx: any) {
  await logWebhookEvent({
    provider: 'ziina',
    eventType: event.type,
    eventId: event.id,
    payload: event,
  });

  try {
    switch (event.type) {
      case 'payment.succeeded': {
        await handlePaymentSuccess(event);
        break;
      }

      case 'payment.failed': {
        await handlePaymentFailed(event);
        break;
      }

      default:
        console.log(`Unhandled Ziina event: ${event.type}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error processing Ziina webhook:', error);
    throw error;
  }
}

async function handlePaymentSuccess(event: any) {
  const payment = event.data;
  const metadata = payment.metadata;
  const email = metadata.email;
  const licenseConfig = JSON.parse(metadata.license_config || '{}');

  await autoGenerateLicense({
    email,
    amount: payment.amount,
    currency: payment.currency,
    paymentId: payment.id,
    provider: 'ziina',
    licenseConfig,
  });
}

async function handlePaymentFailed(event: any) {
  console.error('Ziina payment failed:', event.data.id);
}
```

### 📚 Ziina Documentation
- الموقع الرسمي: https://ziina.com
- API Documentation: https://docs.ziina.com
- Dashboard: https://dashboard.ziina.com

### ✅ Tasks Checklist
- [ ] إنشاء حساب Ziina Business
- [ ] الحصول على API Keys
- [ ] إنشاء Ziina Service
- [ ] إنشاء Webhook Handler
- [ ] إنشاء tRPC Router
- [ ] إضافة Frontend Integration
- [ ] تفعيل Webhooks في Ziina Dashboard
- [ ] اختبار مع Ziina Sandbox

---

## 📧 المرحلة 5: Email Service Enhancement

### 📝 الوصف
تحسين خدمة البريد الإلكتروني الحالية وإضافة قوالب احترافية للتراخيص.

### 🎯 المتطلبات

#### 1. Email Templates
**الملف:** `backend/src/templates/emails/license-created.html`

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ترخيصك الجديد - LicenseGate</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .content {
      padding: 40px;
    }
    .license-box {
      background: #f8f9fa;
      border: 2px dashed #667eea;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .license-key {
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
      letter-spacing: 2px;
      font-family: 'Courier New', monospace;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 20px 0;
    }
    .info-item {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
    }
    .info-label {
      color: #6c757d;
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .info-value {
      color: #212529;
      font-size: 16px;
      font-weight: 600;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      color: #6c757d;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 تم إنشاء ترخيصك بنجاح!</h1>
      <p>شكراً لشرائك من LicenseGate</p>
    </div>

    <div class="content">
      <p>مرحباً <strong>{{userName}}</strong>،</p>
      <p>تم إنشاء ترخيصك بنجاح ويمكنك استخدامه الآن!</p>

      <div class="license-box">
        <div class="license-key">{{licenseKey}}</div>
        <p style="margin-top: 10px; color: #6c757d;">انسخ هذا المفتاح واحتفظ به في مكان آمن</p>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">المنتج</div>
          <div class="info-value">{{productName}}</div>
        </div>
        <div class="info-item">
          <div class="info-label">تاريخ الانتهاء</div>
          <div class="info-value">{{expirationDate}}</div>
        </div>
        <div class="info-item">
          <div class="info-label">حد الاستخدام</div>
          <div class="info-value">{{validationLimit}}</div>
        </div>
        <div class="info-item">
          <div class="info-label">حد الأجهزة</div>
          <div class="info-value">{{ipLimit}}</div>
        </div>
      </div>

      <h3>📋 الصلاحيات المتاحة:</h3>
      <ul>
        {{#each scopes}}
        <li>{{this}}</li>
        {{/each}}
      </ul>

      <center>
        <a href="{{dashboardUrl}}" class="button">
          انتقل إلى لوحة التحكم
        </a>
      </center>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e9ecef;">

      <h3>🔧 كيفية الاستخدام:</h3>
      <ol>
        <li>انسخ مفتاح الترخيص أعلاه</li>
        <li>افتح تطبيقك أو برنامجك</li>
        <li>الصق المفتاح في خانة التفعيل</li>
        <li>استمتع بجميع الميزات!</li>
      </ol>

      <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin: 20px 0;">
        <strong>⚠️ ملاحظة هامة:</strong>
        <p style="margin: 5px 0;">لا تشارك مفتاح الترخيص مع أي شخص آخر. هذا المفتاح مرتبط بحسابك فقط.</p>
      </div>
    </div>

    <div class="footer">
      <p>إذا كان لديك أي استفسارات، تواصل معنا على:</p>
      <p><a href="mailto:support@licensegate.io">support@licensegate.io</a></p>
      <p>© 2025 LicenseGate. جميع الحقوق محفوظة.</p>
    </div>
  </div>
</body>
</html>
```

#### 2. Email Service with Templates
**الملف:** `backend/src/services/email/license-email.ts`

```typescript
import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';

// إعداد SMTP Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * إرسال بريد الترخيص الجديد
 */
export async function sendLicenseEmail(params: {
  email: string;
  userName: string;
  licenseKey: string;
  productName: string;
  expirationDate?: string;
  validationLimit?: number;
  ipLimit?: number;
  scopes?: string[];
}) {
  // قراءة القالب
  const templatePath = path.join(__dirname, '../../templates/emails/license-created.html');
  const templateSource = await fs.readFile(templatePath, 'utf-8');
  const template = Handlebars.compile(templateSource);

  // تجهيز البيانات
  const html = template({
    userName: params.userName,
    licenseKey: params.licenseKey,
    productName: params.productName,
    expirationDate: params.expirationDate || 'غير محدد',
    validationLimit: params.validationLimit || 'غير محدود',
    ipLimit: params.ipLimit || 'غير محدود',
    scopes: params.scopes || [],
    dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
  });

  // إرسال البريد
  const info = await transporter.sendMail({
    from: process.env.SMTP_SENDER,
    to: params.email,
    subject: `🎉 ترخيصك الجديد - ${params.productName}`,
    html,
  });

  console.log('License email sent:', info.messageId);
  return info;
}

/**
 * إرسال بريد تأكيد الدفع
 */
export async function sendPaymentConfirmationEmail(params: {
  email: string;
  amount: number;
  currency: string;
  paymentId: string;
}) {
  await transporter.sendMail({
    from: process.env.SMTP_SENDER,
    to: params.email,
    subject: '✅ تم استلام دفعتك بنجاح',
    html: `
      <h2>شكراً لدفعتك!</h2>
      <p>تم استلام دفعتك بنجاح بمبلغ ${params.amount} ${params.currency.toUpperCase()}</p>
      <p>معرف الدفع: ${params.paymentId}</p>
      <p>سيتم إرسال ترخيصك قريباً.</p>
    `,
  });
}
```

### 📦 Dependencies المطلوبة
```bash
npm install nodemailer handlebars @types/nodemailer
```

### ✅ Tasks Checklist
- [ ] تثبيت Nodemailer و Handlebars
- [ ] إنشاء Email Templates
- [ ] إنشاء Email Service
- [ ] اختبار إرسال البريد
- [ ] إضافة قوالب متعددة اللغات

---

## 🤖 المرحلة 6: Auto-License Generator Service

### 📝 الوصف
خدمة مركزية لإنشاء التراخيص تلقائياً عند استلام الدفع.

### 🎯 المتطلبات

#### 1. Auto-License Generator
**الملف:** `backend/src/services/license/auto-generator.ts`

```typescript
import { db } from '../../db';
import { generateLicenseKey } from '../../utils/license-key-generator';
import { sendLicenseEmail } from '../email/license-email';

interface AutoLicenseParams {
  email: string;
  amount: number;
  currency: string;
  paymentId: string;
  provider: 'stripe' | 'paypal' | 'ziina';
  licenseConfig: {
    duration?: number;        // بالأيام
    validationLimit?: number;
    ipLimit?: number;
    scopes?: string[];
    productName?: string;
  };
}

/**
 * إنشاء ترخيص تلقائياً بعد الدفع
 */
export async function autoGenerateLicense(params: AutoLicenseParams) {
  console.log('Auto-generating license for:', params.email);

  try {
    // 1. البحث عن المستخدم أو إنشاؤه
    let user = await findUserByEmail(params.email);
    if (!user) {
      user = await createUser(params.email);
    }

    // 2. حساب تاريخ الانتهاء
    let expirationDate = null;
    if (params.licenseConfig.duration) {
      const exp = new Date();
      exp.setDate(exp.getDate() + params.licenseConfig.duration);
      expirationDate = exp;
    }

    // 3. إنشاء مفتاح الترخيص
    const licenseKey = generateLicenseKey();

    // 4. إنشاء الترخيص في قاعدة البيانات
    const [result] = await db.query(
      `INSERT INTO licenses (
        user_id,
        license_key,
        expiration_date,
        validation_limit,
        ip_limit,
        license_scope,
        active,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
      [
        user.id,
        licenseKey,
        expirationDate,
        params.licenseConfig.validationLimit || null,
        params.licenseConfig.ipLimit || null,
        JSON.stringify(params.licenseConfig.scopes || []),
      ]
    );

    const licenseId = result.insertId;

    // 5. تسجيل الدفع في جدول payment_licenses
    await db.query(
      `INSERT INTO payment_licenses (
        payment_id,
        user_id,
        license_id,
        amount,
        currency,
        provider,
        metadata,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        params.paymentId,
        user.id,
        licenseId,
        params.amount,
        params.currency.toUpperCase(),
        params.provider,
        JSON.stringify(params.licenseConfig),
      ]
    );

    // 6. إرسال البريد الإلكتروني
    await sendLicenseEmail({
      email: params.email,
      userName: user.name || params.email,
      licenseKey,
      productName: params.licenseConfig.productName || 'License',
      expirationDate: expirationDate
        ? expirationDate.toLocaleDateString('ar-EG')
        : undefined,
      validationLimit: params.licenseConfig.validationLimit,
      ipLimit: params.licenseConfig.ipLimit,
      scopes: params.licenseConfig.scopes,
    });

    console.log('License auto-generated successfully:', {
      licenseId,
      licenseKey,
      userId: user.id,
    });

    return {
      success: true,
      licenseId,
      licenseKey,
      userId: user.id,
    };
  } catch (error) {
    console.error('Error auto-generating license:', error);
    throw error;
  }
}

/**
 * البحث عن مستخدم بالبريد الإلكتروني
 */
async function findUserByEmail(email: string) {
  const [rows] = await db.query(
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

/**
 * إنشاء مستخدم جديد
 */
async function createUser(email: string) {
  const [result] = await db.query(
    `INSERT INTO users (email, name, created_at) VALUES (?, ?, NOW())`,
    [email, email.split('@')[0]]
  );

  return {
    id: result.insertId,
    email,
    name: email.split('@')[0],
  };
}
```

#### 2. License Key Generator
**الملف:** `backend/src/utils/license-key-generator.ts`

```typescript
import crypto from 'crypto';

/**
 * إنشاء مفتاح ترخيص فريد
 * Format: XXXX-XXXX-XXXX-XXXX
 */
export function generateLicenseKey(): string {
  const segments = [];
  
  for (let i = 0; i < 4; i++) {
    const segment = crypto
      .randomBytes(2)
      .toString('hex')
      .toUpperCase();
    segments.push(segment);
  }
  
  return segments.join('-');
}

/**
 * التحقق من صحة تنسيق مفتاح الترخيص
 */
export function validateLicenseKeyFormat(key: string): boolean {
  const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(key);
}
```

#### 3. Webhook Logger
**الملف:** `backend/src/services/webhook-logger.ts`

```typescript
import { db } from '../db';

interface WebhookLogParams {
  provider: string;
  eventType: string;
  eventId: string;
  payload: any;
}

/**
 * تسجيل حدث Webhook
 */
export async function logWebhookEvent(params: WebhookLogParams) {
  await db.query(
    `INSERT INTO webhook_events (
      provider,
      event_type,
      event_id,
      payload,
      status,
      created_at
    ) VALUES (?, ?, ?, ?, 'pending', NOW())`,
    [
      params.provider,
      params.eventType,
      params.eventId,
      JSON.stringify(params.payload),
    ]
  );
}

/**
 * تحديث حالة حدث Webhook
 */
export async function updateWebhookEventStatus(
  eventId: string,
  status: 'processed' | 'failed',
  errorMessage?: string
) {
  await db.query(
    `UPDATE webhook_events 
     SET status = ?, error_message = ?, processed_at = NOW()
     WHERE event_id = ?`,
    [status, errorMessage || null, eventId]
  );
}

/**
 * التحقق من معالجة الحدث مسبقاً (لتجنب التكرار)
 */
export async function isEventProcessed(eventId: string): Promise<boolean> {
  const [rows] = await db.query(
    'SELECT id FROM webhook_events WHERE event_id = ? AND status = "processed"',
    [eventId]
  );
  return rows.length > 0;
}
```

### ✅ Tasks Checklist
- [ ] إنشاء Auto-License Generator Service
- [ ] إنشاء License Key Generator
- [ ] إنشاء Webhook Logger
- [ ] إضافة معالجة الأخطاء
- [ ] إضافة Retry Mechanism
- [ ] اختبار السيناريوهات المختلفة

---

## 🧪 المرحلة 7: Testing & Quality Assurance

### 📝 الوصف
اختبار شامل لجميع المكونات والسيناريوهات.

### 🎯 Test Cases

#### 1. Stripe Tests
```typescript
// backend/tests/stripe.test.ts
describe('Stripe Integration', () => {
  test('Create payment intent', async () => {
    const result = await createStripePayment({
      email: 'test@example.com',
      productName: 'Test License',
      amount: 99.99,
      currency: 'usd',
      licenseConfig: {
        duration: 365,
        validationLimit: 1000,
      },
    });

    expect(result.clientSecret).toBeDefined();
    expect(result.paymentIntentId).toBeDefined();
  });

  test('Handle successful payment webhook', async () => {
    const event = mockStripeEvent('payment_intent.succeeded');
    const result = await stripeWebhookHandler(event, {});
    
    expect(result.success).toBe(true);
  });
});
```

#### 2. Auto-License Generator Tests
```typescript
// backend/tests/auto-generator.test.ts
describe('Auto-License Generator', () => {
  test('Create user and license automatically', async () => {
    const result = await autoGenerateLicense({
      email: 'newuser@example.com',
      amount: 99.99,
      currency: 'usd',
      paymentId: 'test_payment_123',
      provider: 'stripe',
      licenseConfig: {
        duration: 365,
        validationLimit: 1000,
        scopes: ['api', 'advanced'],
      },
    });

    expect(result.success).toBe(true);
    expect(result.licenseKey).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  test('Find existing user instead of creating duplicate', async () => {
    // يجب أن يستخدم المستخدم الموجود
  });
});
```

#### 3. Email Tests
```typescript
// backend/tests/email.test.ts
describe('Email Service', () => {
  test('Send license email successfully', async () => {
    const result = await sendLicenseEmail({
      email: 'test@example.com',
      userName: 'Test User',
      licenseKey: 'ABCD-EFGH-IJKL-MNOP',
      productName: 'Pro License',
      validationLimit: 1000,
      scopes: ['api'],
    });

    expect(result.messageId).toBeDefined();
  });
});
```

### 🔒 Security Checklist
- [ ] التحقق من Webhook Signatures
- [ ] حماية ضد Replay Attacks
- [ ] Rate Limiting على Webhook Endpoints
- [ ] تشفير البيانات الحساسة
- [ ] Validation لجميع المدخلات
- [ ] SQL Injection Prevention
- [ ] XSS Protection

### ✅ Testing Checklist
- [ ] Unit Tests لجميع Services
- [ ] Integration Tests للـ Webhooks
- [ ] End-to-End Tests للتدفق الكامل
- [ ] اختبار مع Test Cards/Accounts
- [ ] اختبار معالجة الأخطاء
- [ ] اختبار Performance تحت الضغط

---

## 📊 Monitoring & Logging

### 🎯 المتطلبات

#### 1. Webhook Dashboard
**الملف:** `backend/src/routers/admin/webhooks.ts`

```typescript
import { z } from 'zod';
import { adminProcedure, router } from '../../trpc';

export const webhookAdminRouter = router({
  // عرض جميع Webhook Events
  listEvents: adminProcedure
    .input(
      z.object({
        provider: z.enum(['stripe', 'paypal', 'ziina']).optional(),
        status: z.enum(['pending', 'processed', 'failed']).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const { provider, status, limit, offset } = input;
      
      let query = 'SELECT * FROM webhook_events WHERE 1=1';
      const params: any[] = [];

      if (provider) {
        query += ' AND provider = ?';
        params.push(provider);
      }

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [events] = await ctx.db.query(query, params);
      return events;
    }),

  // إعادة معالجة Webhook فاشل
  retryEvent: adminProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // إعادة معالجة الحدث
    }),

  // إحصائيات Webhooks
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [stats] = await ctx.db.query(`
      SELECT 
        provider,
        status,
        COUNT(*) as count
      FROM webhook_events
      GROUP BY provider, status
    `);

    return stats;
  }),
});
```

#### 2. Payment Dashboard
```typescript
// عرض جميع المدفوعات وحالتها
export const paymentAdminRouter = router({
  listPayments: adminProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const [payments] = await ctx.db.query(
        `SELECT 
          pl.*,
          u.email,
          l.license_key
         FROM payment_licenses pl
         JOIN users u ON pl.user_id = u.id
         JOIN licenses l ON pl.license_id = l.id
         ORDER BY pl.created_at DESC
         LIMIT ? OFFSET ?`,
        [input.limit, input.offset]
      );

      return payments;
    }),
});
```

### ✅ Monitoring Checklist
- [ ] Dashboard للـ Webhooks
- [ ] Dashboard للمدفوعات
- [ ] تنبيهات عند فشل Webhook
- [ ] Logging شامل
- [ ] Metrics و Analytics

---

## 🚀 Deployment

### 📋 Pre-Deployment Checklist

#### Environment Variables
```env
# قاعدة البيانات
DATABASE_URL=mysql://user:pass@host:3306/licensegate

# SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_SENDER=LicenseGate <noreply@licensegate.io>

# URLs
FRONTEND_URL=https://app.licensegate.io
SIGN_IN_URL=https://app.licensegate.io/auth/sign-in

# Stripe Production
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal Production
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_WEBHOOK_ID=...
PAYPAL_MODE=production

# Ziina Production
ZIINA_API_KEY=...
ZIINA_MERCHANT_ID=...
ZIINA_WEBHOOK_SECRET=...
ZIINA_MODE=production
```

#### Webhook URLs
يجب تسجيل هذه URLs في لوحات تحكم منصات الدفع:

```
Stripe:  https://api.licensegate.io/webhook/stripe
PayPal:  https://api.licensegate.io/webhook/paypal
Ziina:   https://api.licensegate.io/webhook/ziina
```

### ✅ Deployment Checklist
- [ ] تحديث Environment Variables
- [ ] إنشاء جداول قاعدة البيانات
- [ ] تسجيل Webhook URLs
- [ ] اختبار Webhooks في Production
- [ ] تفعيل HTTPS/SSL
- [ ] مراقبة Logs
- [ ] إعداد Backups
- [ ] إعداد Monitoring

---

## 📚 Documentation

### 📖 API Documentation

يجب توثيق جميع APIs الجديدة:

```markdown
# Payment APIs

## Create Stripe Checkout

POST /trpc/stripe.createCheckout

Request:
{
  "email": "customer@example.com",
  "productName": "Pro License",
  "amount": 99.99,
  "currency": "usd",
  "licenseConfig": {
    "duration": 365,
    "validationLimit": 10000
  }
}

Response:
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

### ✅ Documentation Checklist
- [ ] API Documentation
- [ ] User Guide للعملاء
- [ ] Integration Guide للمطورين
- [ ] Troubleshooting Guide
- [ ] FAQ

---

## 🎯 Success Metrics

### KPIs للتتبع
- ✅ نسبة نجاح المدفوعات
- ✅ متوسط وقت إنشاء الترخيص
- ✅ نسبة نجاح إرسال البريد
- ✅ معدل فشل Webhooks
- ✅ رضا العملاء

---

## 📞 Support & Resources

### 🔗 روابط مفيدة
- Stripe Docs: https://stripe.com/docs
- PayPal Docs: https://developer.paypal.com
- Ziina Docs: https://docs.ziina.com
- Nodemailer: https://nodemailer.com

### 📧 جهات الاتصال
- Technical Lead: [Your Email]
- Project Manager: [PM Email]
- Support: support@licensegate.io

---

## ✅ Overall Progress Tracker

| المرحلة | الحالة | التقدم |
|---------|--------|--------|
| 1. Webhook Infrastructure | ⏳ Pending | 0% |
| 2. Stripe Integration | ⏳ Pending | 0% |
| 3. PayPal Integration | ⏳ Pending | 0% |
| 4. Ziina Integration | ⏳ Pending | 0% |
| 5. Email Service | ⏳ Pending | 0% |
| 6. Auto-License Generator | ⏳ Pending | 0% |
| 7. Testing & QA | ⏳ Pending | 0% |
| 8. Deployment | ⏳ Pending | 0% |

---

**تاريخ الإنشاء:** 5 نوفمبر 2025  
**آخر تحديث:** 5 نوفمبر 2025  
**الحالة:** 🟡 In Planning

