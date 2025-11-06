# 🚀 دليل التنفيذ الكامل - Auto License Generation System

## 📋 نظرة عامة

تم إنشاء جميع الملفات المطلوبة للمرحلة الثانية: Backend Logic Implementation

## 📦 الملفات المُنشأة

### 1️⃣ Services

```
backend/src/services/
├── license/
│   └── auto-generator.ts         ✅ (موجود مسبقاً - محدث)
├── user/
│   └── user-service.ts            ✅ جديد
└── email/
    └── verification-service.ts    ✅ جديد
```

### 2️⃣ Webhooks

```
backend/src/webhooks/
└── stripe-handler.ts              ✅ جديد
```

### 3️⃣ Test Scripts

```
backend/scripts/
├── test-auto-license.ts           ✅ (موجود مسبقاً)
├── test-email-verification.ts     ✅ جديد
└── test-webhook-flow.ts           ✅ جديد
```

### 4️⃣ Documentation

```
backend/
└── PRISMA_SCHEMA_UPDATE.md        ✅ جديد
```

---

## 🔧 خطوات التنفيذ

### المرحلة 1: تحديث Database Schema

#### 1. تحديث Prisma Schema

افتح `backend/prisma/schema.prisma` وأضف:

```prisma
// 📧 Email Verification Tokens
model EmailVerificationToken {
  id        Int      @id @default(autoincrement())
  userId    Int      @map("user_id")
  token     String   @unique @db.VarChar(255)
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@map("email_verification_tokens")
}
```

وحدث `model User`:

```prisma
model User {
  // ...existing fields...
  
  emailVerificationTokens EmailVerificationToken[]
  
  // ...existing relations...
}
```

#### 2. تطبيق Migration

```bash
cd backend

# إنشاء وتطبيق migration
npx prisma migrate dev --name add_email_verification

# توليد Prisma Client
npx prisma generate

# التحقق
npx prisma migrate status
```

---

### المرحلة 2: تثبيت Dependencies

```bash
cd backend

# Stripe SDK
npm install stripe@^14.0.0

# إذا لم تكن مثبتة
npm install argon2 node-rsa
npm install @types/node-rsa -D

# Email (إذا لم يكن موجود)
npm install nodemailer
npm install @types/nodemailer -D
```

---

### المرحلة 3: Environment Variables

أضف إلى `.env`:

```env
# Frontend URL
FRONTEND_URL=http://localhost:5173

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_SENDER=LicenseGate <noreply@licensegate.io>
```

---

### المرحلة 4: Testing

#### Test 1: User Service

```bash
cd backend

# إنشاء ملف test سريع
cat > test-user-service.js << 'EOF'
const { createOrFindUser } = require('./dist/services/user/user-service');

(async () => {
  const result = await createOrFindUser('test@example.com');
  console.log('User:', result);
})();
EOF

# تشغيل
npm run build
node test-user-service.js
```

#### Test 2: Email Verification

```bash
# بناء المشروع
npm run build

# تشغيل الاختبارات
npm run test:email-verification
# أو
npx ts-node scripts/test-email-verification.ts
```

#### Test 3: Auto License Generation

```bash
npm run test:auto-license
# أو
npx ts-node scripts/test-auto-license.ts
```

#### Test 4: Complete Webhook Flow

```bash
npm run test:webhook-flow
# أو
npx ts-node scripts/test-webhook-flow.ts
```

---

### المرحلة 5: Integration مع tRPC

أنشئ ملف `backend/src/routers/verification.ts`:

```typescript
import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import {
  verifyEmailToken,
  resendVerificationEmail,
} from '../services/email/verification-service';

export const verificationRouter = router({
  // التحقق من البريد بالتوكن
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      return await verifyEmailToken(input.token);
    }),

  // إعادة إرسال بريد التحقق
  resendVerification: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      return await resendVerificationEmail(input.email);
    }),
});
```

أضفه إلى `backend/src/routers/_app.ts`:

```typescript
import { verificationRouter } from './verification';

export const appRouter = router({
  // ...existing routers...
  verification: verificationRouter,
});
```

---

### المرحلة 6: Webhook Endpoint Setup

أنشئ `backend/src/routes/webhooks.ts`:

```typescript
import express from 'express';
import { handleStripeWebhook, verifyStripeWebhook } from '../webhooks/stripe-handler';

const router = express.Router();

// Stripe Webhook
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      return res.status(400).send('No signature');
    }

    // Verify webhook
    const event = verifyStripeWebhook(req.body, signature);
    if (!event) {
      return res.status(400).send('Invalid signature');
    }

    // Handle webhook
    try {
      const result = await handleStripeWebhook(event);
      res.json(result);
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }
);

export default router;
```

أضفه إلى `backend/src/index.ts` أو `app.ts`:

```typescript
import webhookRoutes from './routes/webhooks';

// قبل استخدام express.json()!
app.use('/webhooks', webhookRoutes);
```

---

### المرحلة 7: Stripe Dashboard Setup

1. **انتقل إلى Stripe Dashboard**
   - https://dashboard.stripe.com/test/webhooks

2. **أضف Webhook Endpoint**
   - URL: `https://your-domain.com/webhooks/stripe`
   - Events to send:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `checkout.session.completed`
     - `charge.refunded`

3. **انسخ Signing Secret**
   - أضفه إلى `.env` كـ `STRIPE_WEBHOOK_SECRET`

4. **Test في Development**
   ```bash
   # استخدم Stripe CLI
   stripe listen --forward-to localhost:3000/webhooks/stripe
   
   # في terminal آخر
   stripe trigger payment_intent.succeeded
   ```

---

## 🧪 Testing Checklist

### ✅ Unit Tests

- [ ] User Service
  - [ ] Create new user
  - [ ] Find existing user
  - [ ] Verify password
  - [ ] Update user profile
  
- [ ] Email Verification Service
  - [ ] Create verification token
  - [ ] Send verification email
  - [ ] Verify valid token
  - [ ] Reject invalid token
  - [ ] Reject expired token
  - [ ] Cleanup expired tokens

- [ ] Auto License Generator
  - [ ] Generate license for new user
  - [ ] Generate license for existing user
  - [ ] Handle duplicate payments (idempotency)
  - [ ] Create lifetime licenses

### ✅ Integration Tests

- [ ] Webhook Flow
  - [ ] Payment succeeded → User created → License created → Email sent
  - [ ] Payment succeeded (existing user) → License created immediately
  - [ ] Payment failed → Logged properly
  - [ ] Charge refunded → License deactivated

- [ ] Email Verification Flow
  - [ ] New user → Email sent → User verifies → License activated
  - [ ] Resend verification email
  - [ ] Expired token handling

### ✅ End-to-End Tests

- [ ] Complete Purchase Flow
  1. User makes payment via Stripe
  2. Webhook received
  3. User created (if new)
  4. License created
  5. Verification email sent
  6. User clicks verification link
  7. Email verified
  8. License activated
  9. Confirmation email sent

---

## 📊 Monitoring & Logging

### Webhook Events Dashboard

أضف إلى Admin Panel:

```typescript
// Get webhook stats
const webhookStats = await prisma.webhookEvent.groupBy({
  by: ['provider', 'status'],
  _count: { id: true },
});

// Get recent failed webhooks
const failedWebhooks = await prisma.webhookEvent.findMany({
  where: { status: 'failed' },
  orderBy: { createdAt: 'desc' },
  take: 10,
});
```

### Email Verification Stats

```typescript
const verificationStats = await prisma.user.groupBy({
  by: ['isEmailVerified'],
  _count: { id: true },
});
```

---

## 🔒 Security Checklist

- [x] ✅ Webhook signature verification (Stripe)
- [x] ✅ Token expiration (24 hours)
- [x] ✅ One-time use tokens
- [x] ✅ Idempotent webhook handling
- [x] ✅ Password hashing (argon2)
- [x] ✅ SQL injection prevention (Prisma)
- [ ] 🔲 Rate limiting على verification endpoints
- [ ] 🔲 HTTPS في production
- [ ] 🔲 Environment variable validation

---

## 📧 Email Templates

### المطلوب إنشاؤه:

1. **Welcome + Verification Email**
   - `backend/templates/emails/welcome-verification.html`
   - يحتوي على: رابط التحقق، كلمة المرور المؤقتة، معلومات الترخيص

2. **Verification Reminder**
   - `backend/templates/emails/verification-reminder.html`
   - للمستخدمين الذين لم يحققوا بريدهم

3. **License Activation Confirmation**
   - `backend/templates/emails/license-activated.html`
   - بعد التحقق من البريد

4. **License Details (Verified Users)**
   - `backend/templates/emails/license-details.html`
   - للمستخدمين المحققين الذين اشتروا ترخيص جديد

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] جميع الاختبارات تعمل
- [ ] Environment variables جاهزة في production
- [ ] Database migration مطبقة
- [ ] Stripe webhooks مسجلة
- [ ] Email templates جاهزة
- [ ] SSL/HTTPS مفعل

### Post-Deployment

- [ ] اختبار webhook في production
- [ ] اختبار email delivery
- [ ] مراقبة logs
- [ ] إعداد alerting للأخطاء
- [ ] backup قاعدة البيانات

---

## 📝 Next Steps

### Phase 3: Email Templates 📧

1. إنشاء HTML templates احترافية
2. دعم متعدد اللغات (EN/AR)
3. Responsive design
4. Brand customization

### Phase 4: Frontend Integration 🎨

1. صفحة Email Verification
2. صفحة Checkout
3. لوحة تحكم للتراخيص
4. إعادة إرسال التحقق

### Phase 5: Advanced Features 🚀

1. Subscription support (recurring payments)
2. Proration عند الترقية
3. Auto-renewal
4. License transfer
5. Team licenses

---

## 💡 Tips & Best Practices

### 1. Testing في Development

```bash
# استخدم Stripe Test Mode
STRIPE_SECRET_KEY=sk_test_...

# استخدم Mailtrap للـ emails
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
```

### 2. Logging

```typescript
// استخدم structured logging
console.log('[Service] Action:', {
  userId: 123,
  action: 'verify_email',
  success: true,
});
```

### 3. Error Handling

```typescript
try {
  // code
} catch (error) {
  console.error('[Service] Error:', error);
  // Log to monitoring service (Sentry, etc)
  // Return user-friendly error
}
```

### 4. Database Indexes

تأكد من وجود indexes على:
- `webhook_events.event_id`
- `webhook_events.status`
- `email_verification_tokens.token`
- `payment_licenses.payment_id`

---

## 🆘 Troubleshooting

### Problem: Webhook not receiving events

**Solution:**
1. تحقق من Stripe webhook URL
2. تحقق من signature verification
3. استخدم `stripe listen` للـ testing

### Problem: Email not sending

**Solution:**
1. تحقق من SMTP credentials
2. تحقق من firewall/ports
3. استخدم Mailtrap للـ testing

### Problem: License not activating after verification

**Solution:**
1. تحقق من verification token expiry
2. تحقق من database relations
3. راجع logs

---

## 📞 Support

للأسئلة والمساعدة:
- GitHub Issues
- Email: dev@licensegate.io
- Documentation: /docs

---

✅ **تم إنشاء جميع الملفات بنجاح!**

الآن يمكنك البدء في تطبيق الخطوات أعلاه واحدة تلو الأخرى.
