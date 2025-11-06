# 📚 LicenseGate API Documentation

**Version:** 2.0.0  
**Base URL:** `http://localhost:3001` (Development)  
**Protocol:** tRPC + Express REST  
**Last Updated:** November 5, 2025

---

## 📖 Table of Contents

1. [Authentication](#authentication)
2. [tRPC Endpoints](#trpc-endpoints)
3. [REST Endpoints](#rest-endpoints)
4. [Data Structures](#data-structures)
5. [Error Handling](#error-handling)
6. [Integration Examples](#integration-examples)

---

## 🔐 Authentication

### Methods

#### 1. **Cookie-based Authentication** (Recommended)
```http
Cookie: accessToken=xxx; refreshToken=yyy
```

#### 2. **API Key Authentication** (For server-to-server)
```http
Authorization: Bearer YOUR_API_KEY
```

### Authentication Flow

```
1. User logs in → POST /trpc/auth.loginWithPassword
2. Server sets cookies (accessToken, refreshToken)
3. Client includes cookies in subsequent requests
4. Token expires → Auto-refresh using refreshToken
```

---

## 🌐 tRPC Endpoints

### Base URL
```
http://localhost:3001/trpc
```

### Request Format
```typescript
POST /trpc/{router}.{procedure}
Content-Type: application/json

{
  "input": { /* procedure input */ }
}
```

---

## 1️⃣ Auth Router (`/trpc/auth.*`)

### 🔓 Public Endpoints

#### `auth.loginWithPassword`
**Login with email and password**

```typescript
// Request
POST /trpc/auth.loginWithPassword
{
  "input": {
    "email": "user@example.com",
    "password": "securePassword123"
  }
}

// Response
{
  "result": {
    "data": {
      "userId": "hex_user_id"
    }
  }
}

// Sets cookies: accessToken, refreshToken
```

---

#### `auth.signUpWithPassword`
**Create new account with email/password**

```typescript
// Request
POST /trpc/auth.signUpWithPassword
{
  "input": {
    "email": "newuser@example.com",
    "password": "securePassword123",
    "token": "recaptcha_token", // if DISABLE_RECAPTCHA=false
    "marketingEmails": false
  }
}

// Response
{
  "result": {
    "data": null  // Success - verification email sent
  }
}
```

**Note:** If `DISABLE_SIGN_UP=true`, this will throw error

---

#### `auth.loginWithGoogle`
**Login/Signup with Google OAuth**

```typescript
// Request
POST /trpc/auth.loginWithGoogle
{
  "input": {
    "token": "google_oauth_token",
    "createAccountIfNotFound": true,
    "marketingEmails": false
  }
}

// Response
{
  "result": {
    "data": {
      "userId": "hex_user_id",
      "email": "user@gmail.com"
    }
  }
}
```

---

#### `auth.verifyEmail`
**Verify email address with token**

```typescript
// Request
POST /trpc/auth.verifyEmail
{
  "input": {
    "token": "verification_token_from_email",
    "email": "user@example.com"
  }
}

// Response
{
  "result": {
    "data": null  // Success
  }
}
```

---

#### `auth.requestPasswordReset`
**Request password reset email**

```typescript
// Request
POST /trpc/auth.requestPasswordReset
{
  "input": {
    "email": "user@example.com",
    "token": "recaptcha_token"
  }
}

// Response
{
  "result": {
    "data": null  // Always succeeds (doesn't leak user existence)
  }
}
```

---

#### `auth.resetPassword`
**Reset password with token**

```typescript
// Request
POST /trpc/auth.resetPassword
{
  "input": {
    "token": "reset_token_from_email",
    "email": "user@example.com",
    "password": "newSecurePassword123"
  }
}

// Response
{
  "result": {
    "data": null  // Success
  }
}
```

---

### 🔒 Protected Endpoints (Require Authentication)

#### `auth.me`
**Get current user information**

```typescript
// Request
POST /trpc/auth.me
{
  "input": {}
}

// Response
{
  "result": {
    "data": {
      "userId": "hex_user_id",
      "email": "user@example.com",
      "isPasswordAccount": true,
      "marketingEmails": false,
      "rsaPublicKey": "-----BEGIN PUBLIC KEY-----\n..."
    }
  }
}
```

---

#### `auth.update`
**Update user preferences**

```typescript
// Request
POST /trpc/auth.update
{
  "input": {
    "marketingEmails": true
  }
}

// Response
{
  "result": {
    "data": null  // Success
  }
}
```

---

#### `auth.deleteAccount`
**Delete user account permanently**

```typescript
// Request
POST /trpc/auth.deleteAccount
{
  "input": {}
}

// Response
{
  "result": {
    "data": null  // Success - account deleted
  }
}
```

---

#### `auth.requestPasswordResetNoCaptcha`
**Request password reset (authenticated users)**

```typescript
// Request
POST /trpc/auth.requestPasswordResetNoCaptcha
{
  "input": {
    "signOutAllDevices": true
  }
}

// Response
{
  "result": {
    "data": null  // Success - reset email sent
  }
}
```

---

#### `auth.updateRsaPublicKey`
**Update RSA encryption keys**

```typescript
// Request
POST /trpc/auth.updateRsaPublicKey
{
  "input": {
    "rsaPublicKey": "-----BEGIN PUBLIC KEY-----\n...",
    "rsaPrivateKey": "-----BEGIN PRIVATE KEY-----\n..."
  }
}

// Response
{
  "result": {
    "data": null  // Success
  }
}
```

---

## 2️⃣ License Router (`/trpc/license.*`)

### 🔒 All endpoints require authentication

#### `license.create`
**Create new license**

```typescript
// Request
POST /trpc/license.create
{
  "input": {
    "name": "My App License",
    "notes": "Production license for client XYZ",
    "licenseKey": "PROD-2025-XXXX-YYYY",  // Optional - auto-generated if not provided
    "active": true,
    "ipLimit": 5,
    "licenseScope": "app1,app2",
    "expirationDate": "2026-01-01T00:00:00Z",  // ISO 8601
    "validationLimit": 1000,
    "validationPoints": 1000,
    "replenishAmount": 100,
    "replenishInterval": "DAY"  // TEN_SECONDS | MINUTE | HOUR | DAY
  }
}

// Response
{
  "result": {
    "data": {
      "id": 123,
      "licenseKey": "PROD-2025-XXXX-YYYY",
      "name": "My App License",
      "active": true,
      "userId": 1,
      "createdAt": "2025-11-05T12:00:00Z",
      // ... other fields
    }
  }
}
```

---

#### `license.read`
**Get license details**

```typescript
// Request
POST /trpc/license.read
{
  "input": {
    "id": 123
  }
}

// Response
{
  "result": {
    "data": {
      "id": 123,
      "licenseKey": "PROD-2025-XXXX-YYYY",
      "name": "My App License",
      "notes": "Production license",
      "active": true,
      "userId": 1,
      "ipLimit": 5,
      "licenseScope": "app1,app2",
      "expirationDate": "2026-01-01T00:00:00Z",
      "validationPoints": 850,
      "validationLimit": 1000,
      "replenishAmount": 100,
      "replenishInterval": "DAY",
      "createdAt": "2025-11-05T12:00:00Z",
      "updatedAt": "2025-11-05T12:00:00Z",
      "logs": [
        {
          "id": 1,
          "result": "VALID",
          "ip": "192.168.1.1",
          "timestamp": "2025-11-05T13:00:00Z",
          "metadata": "{\"deviceId\":\"ABC123\"}"
        }
      ]
    }
  }
}
```

---

#### `license.update`
**Update license**

```typescript
// Request
POST /trpc/license.update
{
  "input": {
    "id": 123,
    "active": false,  // Deactivate license
    "notes": "License suspended due to payment issue"
  }
}

// Response
{
  "result": {
    "data": {
      "id": 123,
      "active": false,
      // ... updated fields
    }
  }
}
```

---

#### `license.delete`
**Delete license**

```typescript
// Request
POST /trpc/license.delete
{
  "input": {
    "id": 123
  }
}

// Response
{
  "result": {
    "data": {
      "id": 123,
      // ... deleted license data
    }
  }
}
```

---

#### `license.list`
**List user's licenses**

```typescript
// Request
POST /trpc/license.list
{
  "input": {
    "skip": 0,
    "take": 25,
    "filterStatus": "active"  // "all" | "active" | "inactive" | "expired"
  }
}

// Response
{
  "result": {
    "data": [
      {
        "id": 123,
        "licenseKey": "PROD-2025-XXXX-YYYY",
        "name": "My App License",
        "active": true,
        // ... other fields
      }
    ]
  }
}
```

---

#### `license.countActive`
**Count active licenses**

```typescript
// Request
POST /trpc/license.countActive
{
  "input": {}
}

// Response
{
  "result": {
    "data": 5  // Number of active licenses
  }
}
```

---

## 3️⃣ API Key Router (`/trpc/apiKey.*`)

### 🔒 All endpoints require authentication

#### `apiKey.create`
**Create new API key**

```typescript
// Request
POST /trpc/apiKey.create
{
  "input": {
    "name": "Production Server API Key"
  }
}

// Response
{
  "result": {
    "data": {
      "apiKey": {
        "id": 1,
        "name": "Production Server API Key",
        "key": "ab12...ef",  // Censored version
        "createdAt": "2025-11-05T12:00:00Z"
      },
      "uncensoredApiKey": {
        "id": 1,
        "name": "Production Server API Key",
        "key": "ab123456-789a-bcde-f012-3456789abcde",  // SAVE THIS!
        "createdAt": "2025-11-05T12:00:00Z"
      }
    }
  }
}
```

**⚠️ Important:** Save `uncensoredApiKey.key` - it won't be shown again!

---

#### `apiKey.list`
**List API keys**

```typescript
// Request
POST /trpc/apiKey.list
{
  "input": {}
}

// Response
{
  "result": {
    "data": [
      {
        "id": 1,
        "name": "Production Server API Key",
        "key": "ab12...de",  // Censored
        "createdAt": "2025-11-05T12:00:00Z"
      }
    ]
  }
}
```

---

#### `apiKey.delete`
**Delete API key**

```typescript
// Request
POST /trpc/apiKey.delete
{
  "input": {
    "id": 1
  }
}

// Response
{
  "result": {
    "data": {
      "count": 1  // Number of deleted keys
    }
  }
}
```

---

## 4️⃣ Logs Router (`/trpc/logs.*`)

### 🔒 All endpoints require authentication

#### `logs.quickStats`
**Get quick statistics**

```typescript
// Request
POST /trpc/logs.quickStats
{
  "input": {}
}

// Response
{
  "result": {
    "data": {
      "activeLicenses": 5,
      "successfulChecksLast7Days": 1250,
      "failedChecksLast7Days": 15,
      "successfulCheckPrevious7Days": 1100,
      "failedCheckPrevious7Days": 20,
      "lastSuccessfulCheck": "2025-11-05T13:45:00Z"
    }
  }
}
```

---

#### `logs.histogram`
**Get validation histogram**

```typescript
// Request
POST /trpc/logs.histogram
{
  "input": {
    "interval": "day",  // "minute" | "hour" | "day" | "month"
    "intervalCount": 7,
    "licenseId": 123  // Optional - filter by license
  }
}

// Response
{
  "result": {
    "data": {
      "histogram": [
        {
          "date": "2025-10-29T00:00:00Z",
          "valid": 150,
          "invalid": 5
        },
        {
          "date": "2025-10-30T00:00:00Z",
          "valid": 180,
          "invalid": 3
        }
        // ... 7 days total
      ]
    }
  }
}
```

---

#### `logs.list`
**List validation logs**

```typescript
// Request
POST /trpc/logs.list
{
  "input": {
    "filter": {
      "licenseId": 123,  // Optional
      "result": ["VALID", "EXPIRED"]  // Optional - filter by result type
    },
    "size": 25,  // Max 100
    "after": 1000,  // Optional - pagination
    "before": 2000  // Optional - pagination
  }
}

// Response
{
  "result": {
    "data": [
      {
        "id": 1001,
        "userId": 1,
        "licenseId": 123,
        "ip": "192.168.1.1",
        "result": "VALID",
        "metadata": "{\"deviceId\":\"ABC123\"}",
        "timestamp": "2025-11-05T13:45:00Z",
        "license": {
          "name": "My App License",
          "licenseKey": "PROD-2025-XXXX-YYYY"
        }
      }
    ]
  }
}
```

**Validation Results:**
- `VALID` - License is valid
- `NOT_FOUND` - License key not found
- `NOT_ACTIVE` - License is inactive
- `EXPIRED` - License has expired
- `LICENSE_SCOPE_FAILED` - App not in allowed scopes
- `IP_LIMIT_EXCEEDED` - Too many IPs using this license
- `RATE_LIMIT_EXCEEDED` - Validation points exhausted

---

## 5️⃣ Verification Router (`/trpc/verification.*`) ✨ NEW

### 🔓 Public Endpoints

#### `verification.verifyEmail`
**Verify email with token**

```typescript
// Request
POST /trpc/verification.verifyEmail
{
  "input": {
    "token": "a1b2c3d4e5f6..."
  }
}

// Response
{
  "result": {
    "data": {
      "success": true,
      "message": "Email verified successfully! Your license has been activated.",
      "userId": 123
    }
  }
}
```

---

#### `verification.resendVerification`
**Resend verification email**

```typescript
// Request
POST /trpc/verification.resendVerification
{
  "input": {
    "email": "user@example.com"
  }
}

// Response
{
  "result": {
    "data": {
      "success": true,
      "message": "Verification email sent successfully"
    }
  }
}
```

**Rate Limit:** 3 requests per hour per email (recommended to implement)

---

#### `verification.checkVerificationStatus`
**Check if user email is verified**

```typescript
// Request
POST /trpc/verification.checkVerificationStatus
{
  "input": {
    "email": "user@example.com"
  }
}

// Response
{
  "result": {
    "data": {
      "exists": true,
      "verified": true,
      "userId": 123,
      "email": "user@example.com"
    }
  }
}
```

---

#### `verification.checkTokenValidity`
**Check if verification token is valid**

```typescript
// Request
POST /trpc/verification.checkTokenValidity
{
  "input": {
    "token": "a1b2c3d4e5f6..."
  }
}

// Response
{
  "result": {
    "data": {
      "valid": true,
      "expired": false,
      "expiresAt": "2025-11-06T12:00:00Z",
      "message": "Token is valid"
    }
  }
}
```

---

### 🔒 Protected Endpoints

#### `verification.getMyVerificationStatus`
**Get current user's verification status**

```typescript
// Request
POST /trpc/verification.getMyVerificationStatus
{
  "input": {}
}

// Response
{
  "result": {
    "data": {
      "verified": true,
      "email": "user@example.com",
      "hasActiveToken": false,
      "tokenExpiresAt": null
    }
  }
}
```

---

#### `verification.getStats` (Admin Only)
**Get verification statistics**

```typescript
// Request
POST /trpc/verification.getStats
{
  "input": {}
}

// Response
{
  "result": {
    "data": {
      "tokens": {
        "totalTokens": 150,
        "activeTokens": 25,
        "expiredTokens": 100,
        "usedTokens": 125
      },
      "users": {
        "total": 500,
        "verified": 450,
        "unverified": 50,
        "verificationRate": 90
      }
    }
  }
}
```

---

## 🌐 REST Endpoints

### 1. Stripe Webhook Handler

#### `POST /webhooks/stripe`
**Receive Stripe payment webhooks**

```http
POST /webhooks/stripe
Content-Type: application/json
Stripe-Signature: t=xxx,v1=yyy

{
  "id": "evt_xxx",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_xxx",
      "amount": 9900,
      "currency": "usd",
      "metadata": {
        "userEmail": "customer@example.com",
        "planName": "Pro-Plan",
        "duration": "365"
      }
    }
  }
}
```

**Response:**
```json
{
  "received": true
}
```

**Supported Events:**
- `payment_intent.succeeded` - Payment successful → Create license
- `checkout.session.completed` - Checkout completed
- `payment_intent.payment_failed` - Payment failed
- `charge.refunded` - Payment refunded → Deactivate license

**Auto-Generated License Flow:**
1. Payment succeeds
2. Find or create user by email
3. Create license (inactive if new user)
4. Send verification email
5. User verifies → License activated

---

### 2. Public License Verification

#### `POST /public/license/verify`
**Verify license key (for your app)**

```http
POST /public/license/verify
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "licenseKey": "PROD-2025-XXXX-YYYY",
  "ip": "192.168.1.1",
  "scope": "app1",
  "metadata": {
    "deviceId": "ABC123",
    "version": "1.0.0"
  }
}
```

**Response (Valid):**
```json
{
  "valid": true,
  "result": "VALID",
  "license": {
    "id": 123,
    "active": true,
    "expirationDate": "2026-01-01T00:00:00Z",
    "validationPoints": 950,
    "validationLimit": 1000
  }
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "result": "EXPIRED",
  "message": "License has expired"
}
```

---

## 📊 Data Structures

### User
```typescript
interface User {
  id: number;
  uuid: string;
  email: string;
  phone: string | null;
  isEmailVerified: boolean;
  passwordHash: string | null;
  refreshSession: string | null;
  createdAt: Date;
  updatedAt: Date;
  marketingEmails: boolean;
  isAdmin: boolean;
  rsaPublicKey: string;
  rsaPrivateKey: string;
}
```

### License
```typescript
interface License {
  id: number;
  userId: number;
  licenseKey: string;
  name: string;
  notes: string;
  active: boolean;
  ipLimit: number | null;
  licenseScope: string | null;
  expirationDate: Date | null;
  validationPoints: number | null;
  validationLimit: number | null;
  replenishAmount: number | null;
  replenishInterval: ReplenishInterval | null;
  createdAt: Date;
  updatedAt: Date;
}

enum ReplenishInterval {
  TEN_SECONDS = "TEN_SECONDS",
  MINUTE = "MINUTE",
  HOUR = "HOUR",
  DAY = "DAY"
}
```

### WebhookEvent
```typescript
interface WebhookEvent {
  id: number;
  provider: PaymentProvider;  // "stripe" | "paypal" | "ziina"
  eventType: string;
  eventId: string;
  payload: any;
  status: WebhookStatus;  // "pending" | "processed" | "failed"
  errorMessage: string | null;
  createdAt: Date;
  processedAt: Date | null;
}
```

### PaymentLicense
```typescript
interface PaymentLicense {
  id: number;
  paymentId: string;
  userId: number;
  licenseId: number;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  metadata: any;
  createdAt: Date;
}
```

### EmailVerificationToken ✨ NEW
```typescript
interface EmailVerificationToken {
  id: number;
  token: string;
  userId: number;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}
```

### Log
```typescript
interface Log {
  id: number;
  userId: number;
  licenseId: number;
  ip: string;
  result: ValidationResult;
  metadata: string;
  timestamp: Date;
}

enum ValidationResult {
  VALID = "VALID",
  NOT_FOUND = "NOT_FOUND",
  NOT_ACTIVE = "NOT_ACTIVE",
  EXPIRED = "EXPIRED",
  LICENSE_SCOPE_FAILED = "LICENSE_SCOPE_FAILED",
  IP_LIMIT_EXCEEDED = "IP_LIMIT_EXCEEDED",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
}
```

---

## ❌ Error Handling

### Error Response Format
```typescript
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "data": {
      // Additional error details
    }
  }
}
```

### Common Error Codes
- `error.notAuthenticated` - Not logged in
- `failed-captcha` - reCAPTCHA verification failed
- `sign-up-disabled` - Sign up is disabled
- `user-not-found` - User doesn't exist
- `invalid-credentials` - Wrong email/password
- `license-not-found` - License doesn't exist
- `unauthorized` - No permission to access resource
- `validation-error` - Input validation failed
- `token-expired` - Verification token expired
- `token-used` - Token already used

---

## 🔗 Integration Examples

### Frontend Integration (React + tRPC)

#### 1. Setup tRPC Client
```typescript
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './server/src/routers/_app';
import SuperJSON from 'superjson';

export const trpc = createTRPCProxyClient<AppRouter>({
  transformer: SuperJSON,
  links: [
    httpBatchLink({
      url: 'http://localhost:3001/trpc',
      credentials: 'include', // Include cookies
    }),
  ],
});
```

#### 2. Login Example
```typescript
async function login(email: string, password: string) {
  try {
    const result = await trpc.auth.loginWithPassword.mutate({
      email,
      password,
    });
    
    console.log('Logged in! User ID:', result.userId);
    // Cookies are automatically set
  } catch (error) {
    console.error('Login failed:', error);
  }
}
```

#### 3. Create License Example
```typescript
async function createLicense() {
  try {
    const license = await trpc.license.create.mutate({
      name: 'Pro License',
      notes: 'Annual subscription',
      active: true,
      expirationDate: new Date('2026-11-05'),
      ipLimit: 3,
    });
    
    console.log('License created:', license.licenseKey);
  } catch (error) {
    console.error('Failed to create license:', error);
  }
}
```

#### 4. Verify Email Example
```typescript
// In your verify-email page component
async function handleVerify(token: string) {
  try {
    const result = await trpc.verification.verifyEmail.mutate({ token });
    
    if (result.success) {
      // Show success message
      alert('Email verified! Your license is now active.');
    }
  } catch (error) {
    alert('Verification failed. Token may be expired.');
  }
}
```

---

### Backend Integration (Stripe Webhook)

#### Setup Webhook Endpoint
```typescript
import express from 'express';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

app.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature']!;
    
    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
      
      // Handle the event
      await handleStripeWebhook(event);
      
      res.json({ received: true });
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);
```

---

### Mobile App Integration (License Verification)

#### Verify License Key
```typescript
async function verifyLicense(
  licenseKey: string,
  apiKey: string
): Promise<boolean> {
  const response = await fetch('http://localhost:3001/public/license/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      licenseKey,
      ip: await getDeviceIP(),
      scope: 'mobile-app',
      metadata: {
        deviceId: await getDeviceId(),
        platform: 'iOS',
        version: '1.0.0',
      },
    }),
  });
  
  const data = await response.json();
  return data.valid;
}
```

---

## 🎯 Features Integration Checklist

### ✅ Payment Flow (Stripe)
```
1. User pays on Stripe Checkout
2. Stripe sends webhook → /webhooks/stripe
3. System creates/finds user by email
4. System creates license (inactive if new user)
5. System sends verification email
6. User clicks link → verification.verifyEmail
7. License activated ✅
```

### ✅ Email Verification Flow
```
1. New user signs up → auth.signUpWithPassword
2. Verification email sent automatically
3. User clicks link → verification.verifyEmail
4. Account verified ✅
```

### ✅ License Management Flow
```
1. Create license → license.create
2. View license → license.read
3. Update license → license.update
4. Deactivate/Delete → license.update/delete
5. Monitor usage → logs.list, logs.histogram
```

### ✅ API Key Flow
```
1. Create API key → apiKey.create
2. Save the uncensored key (shown once!)
3. Use in Authorization header
4. Verify licenses from your app
```

---

## 🔐 Security Best Practices

1. **Always use HTTPS in production**
2. **Store API keys securely** (environment variables)
3. **Validate webhook signatures** (Stripe)
4. **Rate limit public endpoints** (verification, password reset)
5. **Use strong passwords** (min 8 chars, mixed case, numbers)
6. **Enable reCAPTCHA** in production
7. **Rotate API keys** periodically
8. **Monitor webhook events** for anomalies

---

## 📞 Support

- **Documentation:** See `SETUP_COMPLETE.md`
- **Quick Start:** See `QUICKSTART_NOW.md`
- **Implementation Guide:** See `IMPLEMENTATION_GUIDE.md`

---

**Last Updated:** November 5, 2025  
**Version:** 2.0.0 - Phase 2 Complete ✅
