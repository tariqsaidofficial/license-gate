# 🚀 Stripe Webhook Testing Guide

## Quick Start - Test Stripe Webhooks Locally

---

## 📋 Prerequisites

1. ✅ Stripe account (test mode)
2. ✅ Stripe CLI installed
3. ✅ Backend server running
4. ✅ Webhook endpoint configured

---

## 1️⃣ Install Stripe CLI

### macOS (Homebrew)
```bash
brew install stripe/stripe-cli/stripe
```

### Manual Installation
```bash
# Download from: https://github.com/stripe/stripe-cli/releases/latest
```

### Verify Installation
```bash
stripe --version
# Should show: stripe version X.X.X
```

---

## 2️⃣ Login to Stripe CLI

```bash
stripe login
```

This will:
- Open your browser
- Ask you to allow CLI access
- Link CLI to your Stripe account

---

## 3️⃣ Start Backend Server

```bash
cd /Users/sunmarke/license-gate/backend
npm run dev
```

**Expected output:**
```
📄 Server ready on port 3000
```

---

## 4️⃣ Start Webhook Listener

Open a **NEW terminal** and run:

```bash
cd /Users/sunmarke/license-gate/backend
stripe listen --forward-to localhost:3000/webhooks/stripe
```

**Expected output:**
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

**⚠️ IMPORTANT:** Copy the webhook secret (`whsec_xxxxxxxxxxxxx`)

---

## 5️⃣ Update Environment Variable

Update your `.env` file with the webhook secret:

```bash
# In .env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Then restart your backend server** (Ctrl+C and `npm run dev`)

---

## 6️⃣ Test Webhook Events

### Option A: Trigger Test Event

```bash
# In a third terminal
stripe trigger payment_intent.succeeded
```

**What happens:**
1. Stripe CLI sends mock webhook to your server
2. Server verifies signature ✅
3. Creates new user (if needed)
4. Generates license automatically
5. Sends verification email
6. Logs everything to console

**Check your terminal for:**
```
[Webhook] ✅ Verified event: payment_intent.succeeded
[AutoLicense] Starting auto-generation for: ...
[AutoLicense] License created: {...}
```

### Option B: Test with Real Payment

```bash
# Use Stripe test card
Card: 4242 4242 4242 4242
Exp: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

---

## 7️⃣ Monitor Webhook Events

### In Terminal 1 (Backend):
Watch for:
```
[Webhook] ✅ Verified event: payment_intent.succeeded
[Webhook] ✅ Processed successfully
```

### In Terminal 2 (Stripe CLI):
Watch for:
```
payment_intent.succeeded [evt_xxxxx]
  -> POST http://localhost:3000/webhooks/stripe [200]
```

### In Stripe Dashboard:
- Go to: https://dashboard.stripe.com/test/webhooks
- Click on your endpoint
- See all events and their status

---

## 8️⃣ Common Test Scenarios

### Test 1: New User Purchase
```bash
stripe trigger payment_intent.succeeded
```

**Expected:**
- ✅ New user created
- ✅ License generated
- ✅ Verification email sent
- ✅ License status: INACTIVE (pending verification)

### Test 2: Checkout Session
```bash
stripe trigger checkout.session.completed
```

**Expected:**
- ✅ User created/found
- ✅ License generated
- ✅ Email sent

### Test 3: Payment Failed
```bash
stripe trigger payment_intent.payment_failed
```

**Expected:**
- ✅ Event logged
- ✅ No license created
- ✅ Failure logged

### Test 4: Refund
```bash
stripe trigger charge.refunded
```

**Expected:**
- ✅ License deactivated
- ✅ Refund logged

---

## 9️⃣ Verify in Database

```bash
# Check webhook events
npx prisma studio
# Navigate to: WebhookEvent table
# You should see all events with status: processed
```

**Or via script:**
```bash
npm run list-users
# Should show new users created by webhooks
```

---

## 🧪 Run Automated Tests

### Test Webhook Flow
```bash
npm run test:webhook-flow
```

**This tests:**
- ✅ New user webhook
- ✅ Existing user webhook
- ✅ Duplicate payment (idempotency)
- ✅ Email verification flow
- ✅ License activation

---

## 🐛 Troubleshooting

### Problem 1: "Webhook signature verification failed"

**Cause:** Wrong webhook secret

**Solution:**
```bash
# Get the correct secret
stripe listen --forward-to localhost:3000/webhooks/stripe --print-secret

# Update .env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Restart server
```

### Problem 2: "connect ECONNREFUSED"

**Cause:** Backend not running

**Solution:**
```bash
# Make sure backend is running
npm run dev
```

### Problem 3: "404 Not Found"

**Cause:** Wrong endpoint URL

**Solution:**
```bash
# Correct URL should be:
stripe listen --forward-to localhost:3000/webhooks/stripe
#                                          ^^^^^^^^^^^^^^^^
#                                          Must match your route
```

### Problem 4: Email not sending

**Cause:** SMTP not configured or recipient invalid

**Solution:**
- Check `.env` for SMTP settings
- Test with real email address
- Check email logs in console
- Email failures are non-critical (license still created)

---

## 📊 What to Check After Each Test

1. **Terminal Output**
   - Look for `[Webhook] ✅ Verified event`
   - Look for `[AutoLicense] Success!`

2. **Database** (Prisma Studio)
   - `User` table: New user created?
   - `License` table: License generated?
   - `PaymentLicense` table: Payment recorded?
   - `WebhookEvent` table: Event logged as "processed"?
   - `EmailVerificationToken` table: Token created?

3. **Email Inbox**
   - Check if verification email received
   - Check if links work

4. **Console Logs**
   - No errors?
   - All steps completed?

---

## ✅ Success Criteria

After testing, you should have:

- [x] Webhook endpoint responding (200 OK)
- [x] Events verified and logged
- [x] Users auto-created
- [x] Licenses auto-generated
- [x] Emails sent (or logged if failed)
- [x] No errors in console
- [x] Database records created

---

## 🎯 Next Steps

### Development ✅
- [x] Webhook endpoint created
- [x] Signature verification working
- [ ] Test all event types
- [ ] Handle edge cases

### Production 🚀
- [ ] Register webhook URL in Stripe Dashboard
- [ ] Use production webhook secret
- [ ] Monitor webhook logs
- [ ] Set up alerts for failures

---

## 📚 Additional Resources

- **Stripe CLI Docs:** https://stripe.com/docs/stripe-cli
- **Webhook Testing:** https://stripe.com/docs/webhooks/test
- **Event Types:** https://stripe.com/docs/api/events/types
- **Best Practices:** https://stripe.com/docs/webhooks/best-practices

---

## 💡 Pro Tips

1. **Keep Stripe CLI running** during development
2. **Monitor all 3 terminals** (Backend, Stripe CLI, Test commands)
3. **Use Prisma Studio** to verify database changes
4. **Check email logs** even if SMTP fails
5. **Test idempotency** by triggering same event twice
6. **Use meaningful test emails** (e.g., `test-scenario-1@example.com`)

---

**Happy Testing! 🎉**

---

**Need Help?**
- Check `TEST_RESULTS.md` for test results
- Check `IMPLEMENTATION_GUIDE.md` for details
- Check Stripe Dashboard for webhook logs
