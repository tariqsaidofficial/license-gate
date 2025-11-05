# 🔗 Integration Examples - LicenseGate API

نماذج عملية لدمج LicenseGate API مع تطبيقاتك

---

## 📱 Frontend Integration

### React + tRPC

#### 1. **Setup (One-time)**

```bash
npm install @trpc/client @trpc/react-query @tanstack/react-query superjson
```

#### 2. **Create tRPC Client**

```typescript
// src/lib/trpc.ts
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../backend/src/routers/_app';
import SuperJSON from 'superjson';

export const trpc = createTRPCProxyClient<AppRouter>({
  transformer: SuperJSON,
  links: [
    httpBatchLink({
      url: 'http://localhost:3001/trpc',
      credentials: 'include', // Important: Include cookies
    }),
  ],
});
```

#### 3. **Login Component**

```typescript
// src/components/Login.tsx
import { useState } from 'react';
import { trpc } from '../lib/trpc';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const result = await trpc.auth.loginWithPassword.mutate({
        email,
        password,
      });

      console.log('Logged in! User ID:', result.userId);
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Login</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}
```

#### 4. **Email Verification Page**

```typescript
// src/pages/VerifyEmail.tsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { trpc } from '../lib/trpc';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    // Verify the token
    trpc.verification.verifyEmail
      .mutate({ token })
      .then((result) => {
        if (result.success) {
          setStatus('success');
          setMessage('Email verified successfully! Your license is now active.');
        } else {
          setStatus('error');
          setMessage(result.message);
        }
      })
      .catch((err) => {
        setStatus('error');
        setMessage('Verification failed. Token may be expired.');
      });
  }, [searchParams]);

  return (
    <div className="verify-email-container">
      {status === 'loading' && <p>Verifying your email...</p>}
      
      {status === 'success' && (
        <div className="success">
          <h1>✅ Success!</h1>
          <p>{message}</p>
          <a href="/dashboard">Go to Dashboard</a>
        </div>
      )}
      
      {status === 'error' && (
        <div className="error">
          <h1>❌ Verification Failed</h1>
          <p>{message}</p>
          <a href="/resend-verification">Resend Verification Email</a>
        </div>
      )}
    </div>
  );
}
```

#### 5. **Create License Component**

```typescript
// src/components/CreateLicense.tsx
import { useState } from 'react';
import { trpc } from '../lib/trpc';

export function CreateLicense() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const license = await trpc.license.create.mutate({
        name,
        notes: 'Created via dashboard',
        active: true,
        expirationDate: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        ).toISOString(), // 1 year
        ipLimit: 3,
      });

      setLicenseKey(license.licenseKey);
      alert('License created successfully!');
    } catch (err: any) {
      alert('Failed to create license: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Create New License</h2>
      <form onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="License Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create License'}
        </button>
      </form>

      {licenseKey && (
        <div className="license-result">
          <h3>License Created!</h3>
          <p>
            <strong>License Key:</strong>
          </p>
          <code>{licenseKey}</code>
          <button onClick={() => navigator.clipboard.writeText(licenseKey)}>
            Copy to Clipboard
          </button>
        </div>
      )}
    </div>
  );
}
```

#### 6. **Dashboard with Stats**

```typescript
// src/components/Dashboard.tsx
import { useEffect, useState } from 'react';
import { trpc } from '../lib/trpc';

export function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Load user info
    trpc.auth.me.query({}).then(setUser);

    // Load stats
    trpc.logs.quickStats.query({}).then(setStats);
  }, []);

  if (!user || !stats) {
    return <p>Loading...</p>;
  }

  return (
    <div className="dashboard">
      <h1>Welcome, {user.email}</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Active Licenses</h3>
          <p className="stat-value">{stats.activeLicenses}</p>
        </div>

        <div className="stat-card">
          <h3>Successful Checks (7d)</h3>
          <p className="stat-value">{stats.successfulChecksLast7Days}</p>
        </div>

        <div className="stat-card">
          <h3>Failed Checks (7d)</h3>
          <p className="stat-value">{stats.failedChecksLast7Days}</p>
        </div>

        <div className="stat-card">
          <h3>Last Check</h3>
          <p className="stat-value">
            {stats.lastSuccessfulCheck
              ? new Date(stats.lastSuccessfulCheck).toLocaleString()
              : 'Never'}
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## 💳 Payment Integration (Stripe)

### Frontend: Stripe Checkout

```typescript
// src/components/Checkout.tsx
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

export function Checkout() {
  const handleCheckout = async () => {
    const stripe = await stripePromise;

    // Create checkout session on your server
    const response = await fetch('http://localhost:3001/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: 'customer@example.com',
        planName: 'Pro-Plan',
        amount: 9900, // $99.00
      }),
    });

    const session = await response.json();

    // Redirect to Stripe Checkout
    const result = await stripe!.redirectToCheckout({
      sessionId: session.id,
    });

    if (result.error) {
      alert(result.error.message);
    }
  };

  return (
    <div>
      <h2>Subscribe to Pro Plan</h2>
      <button onClick={handleCheckout}>Pay $99.00</button>
    </div>
  );
}
```

### Backend: Create Checkout Session

```typescript
// backend/src/routes/checkout.ts
import express from 'express';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const router = express.Router();

router.post('/create-checkout-session', async (req, res) => {
  const { userEmail, planName, amount } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planName,
            },
            unit_amount: amount, // in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      customer_email: userEmail,
      metadata: {
        userEmail,
        planName,
        duration: '365', // days
      },
    });

    res.json({ id: session.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
```

---

## 📱 Mobile App Integration (React Native)

### License Verification

```typescript
// src/services/licenseService.ts
const API_URL = 'http://your-server.com';
const API_KEY = 'YOUR_API_KEY';

export async function verifyLicense(licenseKey: string): Promise<boolean> {
  try {
    const deviceId = await getDeviceId(); // From react-native-device-info
    const deviceIP = await getDeviceIP(); // From your IP detection service

    const response = await fetch(`${API_URL}/public/license/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        licenseKey,
        ip: deviceIP,
        scope: 'mobile-app',
        metadata: {
          deviceId,
          platform: Platform.OS,
          version: '1.0.0',
        },
      }),
    });

    const data = await response.json();

    if (data.valid) {
      // License is valid - allow access
      await AsyncStorage.setItem('license_verified', 'true');
      return true;
    } else {
      // License invalid - show error
      Alert.alert('License Error', data.message || 'Invalid license');
      return false;
    }
  } catch (error) {
    console.error('License verification failed:', error);
    return false;
  }
}
```

### App Component with License Check

```typescript
// App.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifyLicense } from './services/licenseService';

export default function App() {
  const [isLicensed, setIsLicensed] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLicense();
  }, []);

  const checkLicense = async () => {
    // Check if already verified
    const verified = await AsyncStorage.getItem('license_verified');
    const savedKey = await AsyncStorage.getItem('license_key');

    if (verified === 'true' && savedKey) {
      // Re-verify the saved license
      const valid = await verifyLicense(savedKey);
      setIsLicensed(valid);
    }

    setLoading(false);
  };

  const handleActivate = async () => {
    setLoading(true);
    const valid = await verifyLicense(licenseKey);

    if (valid) {
      await AsyncStorage.setItem('license_key', licenseKey);
      setIsLicensed(true);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!isLicensed) {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        <Text style={{ fontSize: 20, marginBottom: 20 }}>
          Enter Your License Key
        </Text>
        <TextInput
          style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          value={licenseKey}
          onChangeText={setLicenseKey}
        />
        <Button title="Activate" onPress={handleActivate} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Welcome to the App!</Text>
      <Text>License is active ✅</Text>
    </View>
  );
}
```

---

## 🖥️ Desktop App Integration (Electron)

### License Verification

```typescript
// src/main/licenseManager.ts
import { app } from 'electron';
import axios from 'axios';
import Store from 'electron-store';

const store = new Store();
const API_URL = 'http://your-server.com';
const API_KEY = 'YOUR_API_KEY';

export async function verifyLicense(licenseKey: string): Promise<boolean> {
  try {
    const response = await axios.post(
      `${API_URL}/public/license/verify`,
      {
        licenseKey,
        ip: await getPublicIP(),
        scope: 'desktop-app',
        metadata: {
          deviceId: getMachineId(),
          platform: process.platform,
          version: app.getVersion(),
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
        },
      }
    );

    if (response.data.valid) {
      store.set('license_key', licenseKey);
      store.set('license_verified', true);
      return true;
    }

    return false;
  } catch (error) {
    console.error('License verification failed:', error);
    return false;
  }
}

function getMachineId(): string {
  // Use machine-id package
  const { machineIdSync } = require('node-machine-id');
  return machineIdSync();
}

async function getPublicIP(): Promise<string> {
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    return response.data.ip;
  } catch {
    return 'unknown';
  }
}
```

---

## 🔧 Backend-to-Backend Integration

### Verify License from Your API

```typescript
// your-backend/src/middleware/licenseCheck.ts
import axios from 'axios';

const LICENSEGATE_API_URL = 'http://localhost:3001';
const LICENSEGATE_API_KEY = process.env.LICENSEGATE_API_KEY;

export async function checkLicense(
  licenseKey: string,
  userIP: string
): Promise<boolean> {
  try {
    const response = await axios.post(
      `${LICENSEGATE_API_URL}/public/license/verify`,
      {
        licenseKey,
        ip: userIP,
        scope: 'api-access',
        metadata: {
          service: 'your-api',
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${LICENSEGATE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.valid;
  } catch (error) {
    console.error('License check failed:', error);
    return false;
  }
}

// Express middleware
export function requireLicense(req: any, res: any, next: any) {
  const licenseKey = req.headers['x-license-key'];
  const userIP = req.ip;

  checkLicense(licenseKey, userIP)
    .then((valid) => {
      if (valid) {
        next();
      } else {
        res.status(403).json({ error: 'Invalid or expired license' });
      }
    })
    .catch(() => {
      res.status(500).json({ error: 'License verification failed' });
    });
}
```

### Usage in Your API

```typescript
// your-backend/src/routes/protected.ts
import express from 'express';
import { requireLicense } from '../middleware/licenseCheck';

const router = express.Router();

// Protected route
router.get('/api/premium-feature', requireLicense, (req, res) => {
  res.json({ message: 'Welcome to premium feature!' });
});

export default router;
```

---

## 🧪 Testing Examples

### Unit Test (Jest)

```typescript
// __tests__/license.test.ts
import { trpc } from '../src/lib/trpc';

describe('License Management', () => {
  let licenseId: number;

  it('should create a license', async () => {
    const license = await trpc.license.create.mutate({
      name: 'Test License',
      notes: 'Testing',
      active: true,
    });

    expect(license).toHaveProperty('licenseKey');
    expect(license.active).toBe(true);
    licenseId = license.id;
  });

  it('should read a license', async () => {
    const license = await trpc.license.read.query({ id: licenseId });

    expect(license.id).toBe(licenseId);
    expect(license.name).toBe('Test License');
  });

  it('should update a license', async () => {
    const updated = await trpc.license.update.mutate({
      id: licenseId,
      active: false,
    });

    expect(updated.active).toBe(false);
  });

  it('should delete a license', async () => {
    await trpc.license.delete.mutate({ id: licenseId });

    await expect(
      trpc.license.read.query({ id: licenseId })
    ).rejects.toThrow();
  });
});
```

---

## 🎯 Complete Flow Example

### User Purchase → Email Verify → License Active

```typescript
// Complete flow simulation
async function simulateUserPurchase() {
  // 1. User pays on Stripe
  console.log('1. User pays $99 on Stripe...');
  
  // 2. Stripe webhook triggers
  console.log('2. Stripe sends webhook...');
  
  // 3. System creates user and license
  console.log('3. System creates user and license...');
  
  // 4. Verification email sent
  console.log('4. Verification email sent to user...');
  
  // 5. User clicks verification link
  console.log('5. User clicks verification link...');
  const result = await trpc.verification.verifyEmail.mutate({
    token: 'abc123...', // Token from email
  });
  
  // 6. License activated!
  if (result.success) {
    console.log('6. ✅ License activated!');
    console.log('   User can now use the product.');
  }
}
```

---

**🎉 Ready to integrate!** Choose the example that matches your use case and start building!
