# Settings Management Testing Guide

This directory contains comprehensive tests for the Settings Management System (Task 2.3).

## 🧪 Test Scripts

### 1. Settings Validation Tests
**File**: `test-settings-validation.ts`  
**Command**: `npm run test:settings-validation`

Tests all validation schemas without requiring database or SMTP server:
- ✅ SMTP settings validation
- ✅ OAuth settings validation
- ✅ General settings validation
- ✅ Security settings validation
- ✅ Conversion functions (to/from string records)
- ✅ Sanitization functions

**Usage**:
```bash
cd backend
npm run test:settings-validation
```

**Expected Output**: All validation tests should pass, showing which settings are valid/invalid.

---

### 2. SMTP Connection Tests
**File**: `test-smtp-validation.ts`  
**Command**: `npm run test:smtp-validation`

Tests SMTP connection and email sending functionality:
- ✅ SMTP settings validation
- ✅ Connection testing with real SMTP server
- ✅ Test email sending
- ✅ Error handling (wrong credentials, invalid host, wrong port)

**Configuration Required**:
Add these to your `.env` file to test with real SMTP server:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_SENDER=noreply@your-domain.com
SMTP_SECURE=false
TEST_EMAIL_RECIPIENT=recipient@example.com
```

**Usage**:
```bash
cd backend
npm run test:smtp-validation
```

**Expected Output**: 
- Without credentials: Validation tests pass, connection tests skipped
- With credentials: All tests including real SMTP connection and email sending

---

### 3. Settings Integration Tests
**File**: `test-settings-integration.ts`  
**Command**: `npm run test:settings-integration`

Tests full integration with database and services:
- ✅ Database connection
- ✅ Encryption/decryption service
- ✅ Settings CRUD operations
- ✅ Audit logging
- ✅ Settings validation before saving
- ✅ SMTP testing integration

**Prerequisites**:
1. Database must be running and migrated
2. At least one admin user in database (ID=1 by default)
3. Optional: SMTP credentials for full testing

**Usage**:
```bash
cd backend
npm run test:settings-integration
```

**Expected Output**: All database operations complete successfully, audit logs created.

---

## 🎯 What Was Implemented (Task 2.3)

### ✅ Validation Schemas (Zod)
**File**: `src/utils/validation.schemas.ts`

Created comprehensive validation schemas for:
- **SMTP Settings**: Host, port, username, password, sender, secure
- **OAuth Settings**: Google/GitHub client IDs and secrets with cross-validation
- **General Settings**: Site name, support email, maintenance mode
- **Security Settings**: Session timeout, login attempts, password requirements

**Features**:
- Type-safe validation with TypeScript inference
- Detailed error messages with field-level feedback
- Helper functions for email, port, URL validation
- Data sanitization for logging (hides sensitive data)
- Conversion utilities (objects ↔ string records for database storage)

---

### ✅ SMTP Connection Testing
**File**: `src/services/smtp-test.service.ts`

Implemented real SMTP server testing:
- **Connection Testing**: Verify SMTP credentials without sending email
- **Test Email Sending**: Send beautifully formatted HTML test emails
- **Error Handling**: User-friendly error messages for common SMTP issues
- **Validation**: Pre-flight validation before attempting connection

**Error Codes Handled**:
- `ECONNREFUSED` - Connection refused
- `ENOTFOUND` - Host not found
- `ETIMEDOUT` - Connection timeout
- `EAUTH` - Authentication failed
- `ESOCKET` - Socket error

---

### ✅ OAuth Configuration Validation
**File**: `src/services/settings.service.ts`

Implemented OAuth validation:
- **Google OAuth**: Client ID + Secret validation
- **GitHub OAuth**: Client ID + Secret validation
- **Cross-validation**: ID requires Secret and vice versa
- **Format Validation**: Proper string formats and lengths

---

### ✅ Settings Service Methods
**File**: `src/services/settings.service.ts`

New validation and testing methods:
- `validateSettings(category, settings)` - Validate before saving
- `testSmtpSettings(settings)` - Test SMTP without saving
- `sendTestEmail(settings, recipient, data)` - Send test email
- `getCurrentSmtpSettings()` - Get current SMTP config from DB
- `testCurrentSmtpSettings()` - Test saved SMTP settings

---

### ✅ tRPC API Endpoints
**File**: `src/routers/settings.router.ts`

Updated endpoints use centralized validation schemas:
- `testSmtpConnection` - Test SMTP without saving
- `sendTestEmail` - Send test email with custom settings
- `testCurrentSmtp` - Test current saved SMTP settings
- `sendTestEmailCurrent` - Send test email with saved settings
- `validateSettings` - Validate settings before saving

---

## 📊 Test Coverage

### Validation Testing
- ✅ Valid input acceptance
- ✅ Invalid input rejection
- ✅ Field-level error messages
- ✅ Cross-field validation (OAuth)
- ✅ Type coercion (strings ↔ numbers/booleans)

### SMTP Testing
- ✅ Connection validation
- ✅ Real server connection testing
- ✅ Test email sending with HTML template
- ✅ Authentication error handling
- ✅ Network error handling
- ✅ Invalid host/port handling

### Integration Testing
- ✅ Database CRUD operations
- ✅ Encryption for sensitive fields
- ✅ Audit log creation
- ✅ Settings retrieval and decryption
- ✅ Soft delete functionality
- ✅ Transaction safety

---

## 🔧 Running All Tests

Run all settings tests in sequence:
```bash
cd backend

# 1. Validation tests (no dependencies)
npm run test:settings-validation

# 2. SMTP tests (requires SMTP credentials)
npm run test:smtp-validation

# 3. Integration tests (requires database)
npm run test:settings-integration
```

---

## 🐛 Troubleshooting

### Test Script Won't Run
**Issue**: `Cannot find module` errors  
**Solution**: Run `npm install` to install dependencies

### Database Connection Failed
**Issue**: Integration tests can't connect to database  
**Solution**: 
1. Check `DATABASE_URL` in `.env`
2. Ensure database is running
3. Run migrations: `npm run prisma-migrate`

### SMTP Tests Failing
**Issue**: SMTP connection or email tests fail  
**Solution**:
1. Verify SMTP credentials in `.env`
2. Check if using Gmail: Enable "App Passwords"
3. Check firewall/network settings
4. Try different port (587 vs 465)

### Admin User Not Found
**Issue**: Integration tests report admin user not found  
**Solution**: Create admin user: `npm run set-admin`

---

## 📝 Next Steps

With Task 2.3 complete, the following are ready:
- ✅ Validation schemas for all setting categories
- ✅ SMTP connection testing with real servers
- ✅ OAuth configuration validation
- ✅ Full integration with database and services
- ✅ Comprehensive test coverage

**Next Tasks**:
- Task 3.1: Configuration Loading System
- Task 4.1: Complete Settings API Endpoints
- Task 6.1: Frontend Settings Management UI

---

## 🎉 Success Criteria

Task 2.3 is considered complete when:
- ✅ All validation schemas implemented and tested
- ✅ SMTP connection testing works with real servers
- ✅ Test emails can be sent successfully
- ✅ OAuth settings validation implemented
- ✅ All test scripts pass successfully
- ✅ Error handling covers common failure scenarios

**Status**: ✅ COMPLETE

---

## 📚 Related Documentation

- [Settings Service](../src/services/settings.service.ts)
- [SMTP Test Service](../src/services/smtp-test.service.ts)
- [Encryption Service](../src/services/encryption.service.ts)
- [Validation Schemas](../src/utils/validation.schemas.ts)
- [Settings Router](../src/routers/settings.router.ts)
- [Settings Types](../src/types/settings.ts)

