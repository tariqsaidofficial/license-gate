# 🔧 Admin Scripts - LicenseGate

Collection of scripts for managing users and permissions in LicenseGate.

## 📋 Available Scripts

### 1. List All Users
Display a list of all users with their details.

```bash
cd backend
npm run list-users
```

**Output:**
- User ID
- Email
- Is Admin?
- Is Email Verified?
- Number of Licenses
- Number of API Keys
- Creation Date

---

### 2. Set User as Admin
Grant admin privileges to a specific user.

```bash
cd backend
npm run set-admin <email>
```

**Example:**
```bash
npm run set-admin info@dxbmark.com
```

**Output:**
```
🔍 Searching for user: info@dxbmark.com

📋 Current user details:
   ID: 1
   Email: info@dxbmark.com
   Email Verified: false
   Is Admin: false
   Created At: 2025-11-04...

🔧 Setting user as admin...

✅ Success! User is now an admin:
   ID: 1
   Email: info@dxbmark.com
   Is Admin: true
```

---

### 3. Check Specific User Details
Display all details for a specific user.

```bash
cd backend
npm run check-user <email>
# or
npx ts-node --files scripts/check-user.ts <email>
```

**Example:**
```bash
npm run check-user info@dxbmark.com
```

**Output:**
```
📋 User Information:
====================
Email: info@dxbmark.com
ID: 1
Email Verified: ✅ Yes
Admin: ✅ Yes
Has Password: ✅ Yes
Created: 2025-11-04...
```

---

### 4. Verify User Email
Activate email verification for a specific user.

```bash
cd backend
npm run verify-user <email>
# or
npx ts-node --files scripts/verify-user.ts <email>
```

**Example:**
```bash
npm run verify-user info@dxbmark.com
```

---

### 5. Verify All Users
Activate email verification for all users.

```bash
cd backend
npm run verify-all-users
# or
npx ts-node --files scripts/verify-all-users.ts
```

---

## 🗄️ Database Schema Changes

Added `isAdmin` field to `User` table:

```prisma
model User {
  id              Int      @id @default(autoincrement())
  email           String   @unique
  isEmailVerified Boolean
  passwordHash    String?
  refreshSession  String?
  createdAt       DateTime @default(now())

  marketingEmails Boolean @default(false)
  isAdmin         Boolean @default(false)  // ← جديد!
  rsaPublicKey    String  @db.Text
  rsaPrivateKey   String  @db.Text

  licenses License[]
  logs     Log[]
  apiKeys ApiKey[]
}
```

---

## 🔐 Using MySQL Directly

You can also use MySQL directly:

### View Users

```bash
docker exec -i license-gate-mysql mysql -uroot -ppassword license_gate \
  -e "SELECT id, email, isAdmin, isEmailVerified FROM User;"
```

### Set Admin

```bash
docker exec -i license-gate-mysql mysql -uroot -ppassword license_gate \
  -e "UPDATE User SET isAdmin = 1 WHERE email = 'user@example.com';"
```

### Remove Admin

```bash
docker exec -i license-gate-mysql mysql -uroot -ppassword license_gate \
  -e "UPDATE User SET isAdmin = 0 WHERE email = 'user@example.com';"
```

---

## 📝 Notes

1. **Default Value:** All new users are created with `isAdmin = false`
2. **Security:** Only grant admin access to trusted users
3. **Applying Changes:** If you modify the Schema, run:
   ```bash
   npm run prisma-up
   ```

---

## 🚀 Next Steps

After setting up an admin, you can:

1. Add middleware to verify admin permissions in API routes
2. Create an Admin dashboard in Frontend
3. Add admin-only endpoints

Example middleware:

```typescript
// src/middleware/admin.middleware.ts
import { Request, Response, NextFunction } from 'express';

export const requireAdmin = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const user = req.user; // from authentication middleware
  
  if (!user || !user.isAdmin) {
    return res.status(403).json({
      error: 'Forbidden: Admin access required'
    });
  }
  
  next();
};
```

---

**Created:** November 5, 2025  
**Status:** ✅ Ready to Use
