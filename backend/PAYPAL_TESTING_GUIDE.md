# PayPal Webhook Testing Guide

This guide covers testing PayPal payment webhooks for automatic license generation.

## 📋 Prerequisites

### 1. PayPal Developer Account
- Sign up at: https://developer.paypal.com/
- Create Sandbox accounts (buyer + seller)

### 2. Environment Variables
Add to your `.env` file:
```env
# PayPal Sandbox Credentials
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=your_webhook_id  # Optional for signature verification
```

### 3. Get Credentials
1. Go to: https://developer.paypal.com/dashboard/applications
2. Create an app or use existing one
3. Copy **Client ID** and **Secret** from REST API apps section

---

## 🚀 Quick Start

### Test 1: Webhook Flow (Mock Events)
```bash
# Start backend server
npm run dev

# In another terminal, test webhook flow
npx ts-node scripts/test-paypal-webhook.ts
```

This simulates PayPal webhook events without real payments.

**Expected Results:**
- ✅ Payment capture completed event processed
- ✅ User created/verified
- ✅ License auto-generated
- ✅ Idempotency check passed

---

### Test 2: Real PayPal Sandbox Flow

#### Step 1: Create Order
```bash
npx ts-node scripts/test-paypal-sandbox.ts create
```

**Output:**
```
✅ Order created successfully!
   Order ID: 5O123456789ABCDEF
   Approval URL: https://www.sandbox.paypal.com/checkoutnow?token=...
```

#### Step 2: Approve Payment (Manual)
1. Open the **Approval URL** in browser
2. Login with **Sandbox Buyer Account**:
   - Email: `sb-xxxxx@personal.example.com` (from PayPal dashboard)
   - Password: Your sandbox buyer password
3. Complete the payment

#### Step 3: Capture Payment
```bash
npx ts-node scripts/capture-paypal-order.ts <ORDER_ID>
```

**Expected:**
```
✅ Payment captured successfully!
   Capture ID: 1AB23456CD789EF
   Status: COMPLETED
   Email: buyer@example.com
```

#### Step 4: Verify License Created
Check backend logs for:
```
[PayPal Webhook] Received event: PAYMENT.CAPTURE.COMPLETED
[Auto-License] License created for: buyer@example.com
```

Query database:
```sql
SELECT * FROM licenses 
WHERE "userId" = (SELECT id FROM users WHERE email = 'buyer@example.com');
```

---

## 🔧 Webhook Setup on PayPal

### 1. Create Webhook
1. Go to: https://developer.paypal.com/dashboard/webhooks
2. Click **Add Webhook**
3. Enter webhook URL: `https://your-domain.com/webhooks/paypal`
   - For local testing: Use ngrok/localtunnel
4. Select event types:
   - ✅ `PAYMENT.CAPTURE.COMPLETED`
   - ✅ `CHECKOUT.ORDER.APPROVED`
   - ✅ `PAYMENT.CAPTURE.DECLINED`
   - ✅ `PAYMENT.CAPTURE.REFUNDED`

### 2. Get Webhook ID
After creating webhook:
- Copy the **Webhook ID** (e.g., `WH-123ABC...`)
- Add to `.env`:
  ```env
  PAYPAL_WEBHOOK_ID=WH-123ABC456DEF789
  ```

### 3. Test Webhook (Using PayPal)
PayPal provides webhook simulator:
1. Go to your webhook details
2. Click **Simulator**
3. Select event type: `PAYMENT.CAPTURE.COMPLETED`
4. Customize payload if needed
5. Click **Send**

Check backend logs for webhook processing.

---

## 🧪 Test Scenarios

### Scenario 1: Successful Payment + License
```bash
# 1. Create order
npx ts-node scripts/test-paypal-sandbox.ts create

# 2. Approve payment (manual in browser)
# Open approval URL from output

# 3. Capture payment
npx ts-node scripts/capture-paypal-order.ts <ORDER_ID>

# 4. Verify
# Check logs for "License created"
# Query database for new license
```

### Scenario 2: Test Webhook Events (Mock)
```bash
# Test all webhook event types
npx ts-node scripts/test-paypal-webhook.ts
```

**Events Tested:**
- ✅ `PAYMENT.CAPTURE.COMPLETED` → License created
- ✅ `CHECKOUT.ORDER.APPROVED` → Order logged
- ✅ `PAYMENT.CAPTURE.DECLINED` → Payment failed logged
- ✅ Duplicate events → Idempotency check

### Scenario 3: Local Webhook Testing (ngrok)
```bash
# 1. Install ngrok
brew install ngrok

# 2. Start ngrok tunnel
ngrok http 3000

# 3. Copy HTTPS URL
# e.g., https://abc123.ngrok.io

# 4. Update PayPal webhook URL
# https://abc123.ngrok.io/webhooks/paypal

# 5. Make test payment on PayPal
# Watch backend logs for webhook events
```

---

## 📊 Verify Results

### Check Webhook Events
```sql
SELECT * FROM "WebhookEvent" 
WHERE provider = 'paypal' 
ORDER BY "createdAt" DESC;
```

### Check Auto-Generated Licenses
```sql
SELECT 
  u.email,
  l."licenseKey",
  l.name,
  l."validationLimit",
  l."expiresAt"
FROM licenses l
JOIN users u ON l."userId" = u.id
WHERE l."createdAt" > NOW() - INTERVAL '1 hour'
ORDER BY l."createdAt" DESC;
```

### Check Users
```sql
SELECT * FROM users 
WHERE "createdAt" > NOW() - INTERVAL '1 hour'
ORDER BY "createdAt" DESC;
```

---

## 🐛 Troubleshooting

### Issue 1: "PayPal credentials not configured"
**Solution:**
```bash
# Check .env file
cat .env | grep PAYPAL

# Should show:
# PAYPAL_CLIENT_ID=xxx
# PAYPAL_CLIENT_SECRET=xxx
# PAYPAL_MODE=sandbox
```

### Issue 2: "Order not approved"
**Solution:**
- Order must be approved by buyer before capture
- Check order status:
  ```bash
  npx ts-node scripts/test-paypal-sandbox.ts get <ORDER_ID>
  ```
- If status is `CREATED`, buyer needs to approve

### Issue 3: "Webhook not received"
**Solution:**
1. Check webhook URL is publicly accessible
2. Verify webhook event types are selected
3. Check PayPal webhook logs in dashboard
4. Ensure backend server is running
5. Check firewall/security group settings

### Issue 4: "License not created after payment"
**Solution:**
1. Check backend logs for errors
2. Verify webhook event was received and processed:
   ```sql
   SELECT * FROM "WebhookEvent" WHERE provider = 'paypal' ORDER BY "createdAt" DESC LIMIT 5;
   ```
3. Check webhook event status:
   - `pending` → Still processing
   - `processed` → Success
   - `failed` → Check `errorMessage` field

### Issue 5: "Signature verification failed"
**Solution:**
- Add `PAYPAL_WEBHOOK_ID` to `.env`
- Get from: PayPal Dashboard → Webhooks → Your webhook → ID
- Restart backend server

---

## 📚 Additional Resources

### PayPal Documentation
- [Webhooks Guide](https://developer.paypal.com/docs/api-basics/notifications/webhooks/)
- [Orders API](https://developer.paypal.com/docs/api/orders/v2/)
- [Sandbox Testing](https://developer.paypal.com/docs/api-basics/sandbox/)

### Testing Tools
- [PayPal Webhook Simulator](https://developer.paypal.com/dashboard/webhooks)
- [Postman Collection](https://www.postman.com/paypal/workspace/paypal-public-api-workspace)

### Event Types Reference
| Event Type | Description | License Action |
|-----------|-------------|----------------|
| `PAYMENT.CAPTURE.COMPLETED` | Payment successful | ✅ Create license |
| `CHECKOUT.ORDER.APPROVED` | Buyer approved order | ⏸️ Wait for capture |
| `PAYMENT.CAPTURE.DECLINED` | Payment declined | ❌ No action |
| `PAYMENT.CAPTURE.REFUNDED` | Payment refunded | 🔄 Revoke license |

---

## ✅ Success Checklist

- [ ] PayPal sandbox account created
- [ ] Credentials added to `.env`
- [ ] Webhook endpoint registered on PayPal
- [ ] Mock webhook tests passing
- [ ] Real payment flow tested
- [ ] License auto-generated successfully
- [ ] Idempotency verified
- [ ] Webhook signature verification working
- [ ] Database logging confirmed

---

## 🎯 Next Steps

1. **Production Setup:**
   - Create production PayPal app
   - Update credentials to production
   - Change `PAYPAL_MODE=production`
   - Re-register webhooks with production URL

2. **Monitoring:**
   - Set up webhook event monitoring
   - Add alerts for failed webhooks
   - Track license generation metrics

3. **Security:**
   - Enable webhook signature verification
   - Implement rate limiting
   - Add IP whitelisting for PayPal webhook IPs

---

**Need Help?**
Check backend logs or run diagnostics:
```bash
# View recent logs
npm run dev

# Test configuration
npx ts-node scripts/test-paypal-sandbox.ts

# Test webhooks
npx ts-node scripts/test-paypal-webhook.ts
```
