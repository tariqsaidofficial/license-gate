# 🎯 Quick Reference - LicenseGate Backend

## Status: ✅ 100% OPERATIONAL

---

## 🚀 Quick Start

### Start Server
```bash
cd /Users/sunmarke/license-gate/backend
npm run dev
```

### Run Tests
```bash
npm run test:email-verification    # Email system
npm run test:auto-license          # License generation
npm run test:webhook-flow          # Webhook integration
```

---

## 🔌 API Endpoints

### Webhook
```
POST /webhooks/stripe
Content-Type: application/json
Header: stripe-signature

Status: ✅ ACTIVE
```

### tRPC
```
POST /trpc
All verification endpoints available

Status: ✅ ACTIVE
```

---

## 📊 Test Results (Latest)

```
✅ Email Verification: PASS
✅ Auto-License (5/5): PASS
✅ Webhook Flow (6/6): PASS
✅ Idempotency: PASS
✅ Failures: PASS
✅ Refunds: PASS

Success Rate: 100%
```

---

## 🧪 Test Stripe Webhooks

```bash
# 1. Install Stripe CLI
brew install stripe/stripe-cli/stripe

# 2. Login
stripe login

# 3. Start listener
stripe listen --forward-to localhost:3000/webhooks/stripe

# 4. Copy webhook secret to .env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# 5. Trigger test
stripe trigger payment_intent.succeeded
```

---

## 📧 Email Configuration

```env
SMTP_HOST=mail.dxbmark.com
SMTP_PORT=465
SMTP_USERNAME=info@dxbmark.com
SMTP_SENDER=LicenseGate <info@dxbmark.com>

Status: ✅ WORKING
```

---

## 🗄️ Database

```bash
# Open Prisma Studio
npx prisma studio

# Run migrations
npx prisma migrate dev

# Generate client
npx prisma generate
```

**Tables:**
- User ✅
- License ✅
- PaymentLicense ✅
- WebhookEvent ✅
- EmailVerificationToken ✅

---

## 📁 Key Files

```
src/
├── index.ts                    # ✅ Webhook endpoint added
├── webhooks/
│   └── stripe-handler.ts       # ✅ Event processing
├── services/
│   ├── license/
│   │   └── auto-generator.ts   # ✅ Auto-license
│   ├── email/
│   │   └── verification-service.ts  # ✅ Email
│   └── user/
│       └── user-service.ts     # ✅ User creation
└── routers/
    ├── _app.ts                 # ✅ Verification integrated
    └── webhook.ts              # ✅ Webhook router
```

---

## 🎯 Event Flow

```
Payment → Webhook → Verify → Log → Generate License → Send Email → Done
   ✅        ✅       ✅      ✅          ✅              ✅       ✅
```

---

## 📝 Common Commands

```bash
# List users
npm run list-users

# Check specific user
npm run check-user

# Verify user manually
npm run verify-user

# Cleanup expired tokens
npm run cleanup:expired-tokens
```

---

## 🐛 Troubleshooting

### Webhook not receiving
```bash
# Check if server running
curl http://localhost:3000/health

# Check Stripe CLI
stripe listen --print-secret
```

### Email not sending
```bash
# Test with real email
# Fake emails will be rejected by SMTP
```

### Database issues
```bash
npx prisma studio
# Verify tables exist
```

---

## 📚 Documentation

- `FINAL_IMPLEMENTATION.md` - Complete overview
- `STRIPE_WEBHOOK_TESTING.md` - Stripe testing
- `TEST_RESULTS.md` - Test results
- `TESTING_COMPLETE.md` - Summary
- `IMPLEMENTATION_GUIDE.md` - Implementation

---

## ✅ Checklist Before Production

- [ ] Test with Stripe CLI
- [ ] Update STRIPE_WEBHOOK_SECRET
- [ ] Register webhook URL in Stripe
- [ ] Test with real payments
- [ ] Configure production SMTP
- [ ] Set up monitoring
- [ ] Backup database
- [ ] Deploy!

---

**Last Updated:** November 5, 2025  
**Status:** 🟢 READY FOR STRIPE CLI TESTING
