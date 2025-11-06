# 📧 SMTP Settings Migration Guide

## 🔄 Migration from Environment Variables to Database

### 📍 **أين كانت إعدادات SMTP القديمة:**

#### **1. Environment Variables (.env file)**
```bash
# Old SMTP Configuration (Environment Variables)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_SENDER=noreply@yourdomain.com
SMTP_SECURE=true
```

**الموقع**: `/backend/.env` أو `/backend/.env.production`

#### **2. Mailer Service (Old Implementation)**
**الملف**: `/backend/src/utils/mailer.ts`

**الكود القديم**:
```typescript
// OLD CODE - Direct environment variable usage
const defaultMailer = createTransport({
  host: process.env.SMTP_HOST,
  port: Number.parseInt(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});
```

---

### 📍 **أين أصبحت إعدادات SMTP الآن:**

#### **1. Database (Primary Source) - أولوية أولى** ✅
**الجدول**: `settings` table في MySQL
**Category**: `smtp`
**Keys**: `host`, `port`, `username`, `password`, `sender`, `secure`

**الموقع**: 
- Database: MySQL `settings` table
- Service: `/backend/src/services/settings.service.ts`
- Router: `/backend/src/routers/settings.router.ts`

**كيفية الوصول**:
```typescript
// Get SMTP settings from database
const smtpSettings = await settingsService.getSettings('smtp');
```

#### **2. Configuration Loader (Dynamic Loading)** ✅
**الملف**: `/backend/src/services/configuration-loader.service.ts`

**Priority System**:
```
1. Database Settings (highest priority) ✅
2. Environment Variables (fallback)
3. Default Values (final fallback)
```

**الكود**:
```typescript
// NEW CODE - Priority-based loading
const smtpConfig = await configurationLoader.getSmtpConfig();
// Automatically loads from: Database > ENV > Defaults
```

#### **3. Configuration Manager (Hot Reload)** ✅
**الملف**: `/backend/src/services/configuration-manager.service.ts`

**Features**:
- Hot-reload بدون restart
- Change detection
- Event-driven updates
- Cache management

#### **4. Dynamic Mailer Integration** ✅
**الملف**: `/backend/src/utils/mailer.ts` (Updated)

**الكود الجديد**:
```typescript
// NEW CODE - Dynamic configuration with hot-reload
async function getMailer(customSmtpSettings?: SmtpSettings): Promise<any> {
  // Get current SMTP configuration from configuration manager
  const currentSmtpConfig = await configurationManager.getSmtpConfig();
  
  // Auto-reload when config changes
  if (!cachedMailer || configChanged) {
    cachedMailer = createTransport({
      host: currentSmtpConfig.host,
      port: currentSmtpConfig.port,
      // ... rest of config
    });
  }
  
  return cachedMailer;
}
```

---

### 🔄 **Migration Path:**

#### **Before (Old System):**
```
Environment Variables (.env)
    ↓
Mailer Service (static)
    ↓
Send Email
```

#### **After (New System):**
```
Database (settings table) ← Primary Source
    ↓
Configuration Loader (priority-based)
    ↓
Configuration Manager (hot-reload)
    ↓
Mailer Service (dynamic)
    ↓
Send Email
```

---

### 📊 **Configuration Priority:**

| Priority | Source | Location | When Used |
|----------|--------|----------|-----------|
| 1️⃣ | **Database** | `settings` table | Always (if exists) |
| 2️⃣ | **Environment** | `.env` file | Fallback if DB empty |
| 3️⃣ | **Defaults** | Code defaults | Final fallback |

---

### 🎯 **Key Benefits:**

1. ✅ **Dynamic Configuration** - تغيير الإعدادات بدون restart
2. ✅ **Database Storage** - إدارة مركزية للإعدادات
3. ✅ **Hot Reload** - تحديث فوري عند التغيير
4. ✅ **Priority System** - Database > ENV > Defaults
5. ✅ **Caching** - Performance optimization
6. ✅ **Type Safety** - TypeScript interfaces
7. ✅ **Encryption** - Sensitive data encrypted

---

### 📝 **How to Access SMTP Settings:**

#### **From Backend Code:**
```typescript
// Method 1: Configuration Loader (Recommended)
import { configurationLoader } from '../services/configuration-loader.service';
const smtpConfig = await configurationLoader.getSmtpConfig();

// Method 2: Configuration Manager
import { configurationManager } from '../services/configuration-manager.service';
const smtpConfig = await configurationManager.getSmtpConfig();

// Method 3: Settings Service (Direct)
import { settingsService } from '../services/settings.service';
const smtpSettings = await settingsService.getCurrentSmtpSettings();
```

#### **From Frontend:**
```typescript
// tRPC API
const response = await trpc.settings.getSettings.query({ category: 'smtp' });
const smtpSettings = response.data;
```

#### **From tRPC Endpoints:**
```typescript
// Get configuration
GET /trpc/configuration.getConfiguration?input={"category":"smtp"}

// Reload configuration (hot-reload)
POST /trpc/configuration.reloadConfiguration?input={"category":"smtp"}
```

---

### 🔧 **Migration Steps:**

1. ✅ **Database Schema** - Created `settings` table
2. ✅ **Settings Service** - Implemented CRUD operations
3. ✅ **Configuration Loader** - Priority-based loading
4. ✅ **Configuration Manager** - Hot-reload system
5. ✅ **Mailer Integration** - Dynamic configuration
6. ✅ **tRPC Endpoints** - API for frontend
7. ✅ **Frontend UI** - Settings management page

---

### 📍 **File Locations:**

| Component | File Path |
|-----------|-----------|
| **Database Schema** | `/backend/prisma/schema.prisma` |
| **Settings Service** | `/backend/src/services/settings.service.ts` |
| **Configuration Loader** | `/backend/src/services/configuration-loader.service.ts` |
| **Configuration Manager** | `/backend/src/services/configuration-manager.service.ts` |
| **Settings Router** | `/backend/src/routers/settings.router.ts` |
| **Configuration Router** | `/backend/src/routers/configuration.router.ts` |
| **Mailer Service** | `/backend/src/utils/mailer.ts` |
| **Frontend Page** | `/frontend/src/routes/(app)/demo/+page.svelte` |

---

### 🎉 **Summary:**

**Old Location**: Environment Variables (`.env` file) + Static mailer  
**New Location**: Database (`settings` table) + Dynamic configuration system

**Migration Complete**: ✅  
**Hot Reload**: ✅  
**Backward Compatible**: ✅ (ENV variables still work as fallback)

---

**📅 Migration Date**: November 6, 2025  
**✅ Status**: Complete and Tested
