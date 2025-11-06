# SMTP Configuration Guide

## 📧 Complete SMTP Setup for LicenseGate

This guide will help you configure SMTP settings for sending emails from your LicenseGate application.

---

## 🚀 Quick Start

### Method 1: Using the Web Interface (Recommended)

1. **Login as Admin**
   - Navigate to: `http://localhost:5173/login`
   - Login with admin credentials

2. **Access SMTP Settings**
   - Go to: Settings → Account
   - Click on "SMTP Settings" in Quick Actions
   - Or navigate directly to: `http://localhost:5173/settings/smtp`

3. **Configure SMTP**
   - Enter your SMTP server details
   - Click "Test Connection" to verify
   - Click "Send Test Email" to test email delivery
   - Click "Save Settings" to store in database

### Method 2: Using CLI Script

```bash
cd backend
npm run test:smtp-live
```

This interactive script will:
- Ask for SMTP configuration
- Save settings to database
- Test the connection
- Send a test email
- Show audit logs

---

## 📝 Configuration Parameters

### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| **Host** | SMTP server hostname | `smtp.gmail.com` |
| **Port** | SMTP server port | `587` (TLS) or `465` (SSL) |
| **Username** | SMTP authentication username | `your-email@gmail.com` |
| **Password** | SMTP authentication password | App-specific password |
| **Sender** | Email address for outgoing mail | `noreply@yourdomain.com` |
| **Secure** | Use TLS/SSL encryption | `true` (recommended) |

---

## 🔧 Common SMTP Providers

### Gmail

```
Host: smtp.gmail.com
Port: 587 (TLS) or 465 (SSL)
Secure: Yes
Username: your-email@gmail.com
Password: App Password (not your Gmail password)
Sender: your-email@gmail.com
```

**Setup Instructions:**
1. Enable 2-Factor Authentication on your Google Account
2. Generate an App Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the generated 16-character password
3. Use the App Password (not your regular Gmail password)

### Microsoft Outlook / Office 365

```
Host: smtp.office365.com
Port: 587
Secure: Yes
Username: your-email@outlook.com
Password: Your Outlook password
Sender: your-email@outlook.com
```

### SendGrid

```
Host: smtp.sendgrid.net
Port: 587 or 465
Secure: Yes
Username: apikey
Password: Your SendGrid API Key
Sender: verified@yourdomain.com
```

**Setup Instructions:**
1. Sign up at: https://sendgrid.com
2. Verify your sender domain/email
3. Create an API Key in Settings
4. Use "apikey" as username
5. Use your API Key as password

### Amazon SES

```
Host: email-smtp.{region}.amazonaws.com
Port: 587 or 465
Secure: Yes
Username: Your SMTP username (from AWS)
Password: Your SMTP password (from AWS)
Sender: verified@yourdomain.com
```

**Setup Instructions:**
1. Verify your email/domain in AWS SES
2. Create SMTP credentials in AWS Console
3. Note your region-specific SMTP endpoint
4. Use generated SMTP username and password

### Mailgun

```
Host: smtp.mailgun.org
Port: 587 or 465
Secure: Yes
Username: postmaster@your-domain.com
Password: Your Mailgun SMTP password
Sender: noreply@your-domain.com
```

---

## 🧪 Testing SMTP Configuration

### Test via Web Interface

1. Navigate to: `http://localhost:5173/settings/smtp`
2. Fill in SMTP details
3. Click **"Test Connection"** - Verifies server connectivity
4. Enter a recipient email
5. Click **"Send Test Email"** - Sends actual test email

### Test via CLI

```bash
# Full interactive test
npm run test:smtp-live

# Quick validation test
npm run test:smtp-validation

# Integration test with database
npm run test:settings-integration
```

---

## 🔒 Security Features

### Automatic Encryption
- All sensitive fields (password, secrets) are **automatically encrypted** using AES-256-GCM
- Encryption happens before storing in database
- Decryption happens automatically when retrieving

### Encryption Key Setup

Add to your `.env` file:
```env
SETTINGS_ENCRYPTION_KEY=your-64-character-hex-key
```

Generate a key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Admin-Only Access
- SMTP settings are only accessible to admin users
- All changes are logged in audit trail
- IP address and user agent tracking

---

## 📊 Database Storage

### Settings Table
```sql
SELECT * FROM settings WHERE category = 'smtp';
```

| Field | Description |
|-------|-------------|
| `category` | Always 'smtp' |
| `key` | Setting name (host, port, username, etc.) |
| `value` | Encrypted value (for sensitive fields) |
| `isEncrypted` | True for password/secrets |
| `isActive` | Soft delete flag |
| `createdBy` | User ID who created |
| `updatedBy` | User ID who last updated |

### Audit Trail
```sql
SELECT * FROM setting_audits 
WHERE category = 'smtp' 
ORDER BY timestamp DESC;
```

All changes are automatically logged with:
- Old value and new value
- Action (CREATE, UPDATE, DELETE)
- User ID, IP address, user agent
- Timestamp

---

## 🐛 Troubleshooting

### Connection Refused (ECONNREFUSED)
**Problem:** Cannot connect to SMTP server

**Solutions:**
- Check host and port are correct
- Verify firewall settings
- Try alternate port (587 vs 465)
- Check if server is running

### Authentication Failed (EAUTH)
**Problem:** Login credentials rejected

**Solutions:**
- For Gmail: Use App Password, not regular password
- Verify username and password are correct
- Check if 2FA is required
- Ensure account is not locked

### Timeout (ETIMEDOUT)
**Problem:** Connection times out

**Solutions:**
- Check internet connectivity
- Verify DNS resolution works
- Try different network (VPN issues)
- Increase timeout in code (currently 10s)

### Host Not Found (ENOTFOUND)
**Problem:** SMTP server hostname not found

**Solutions:**
- Verify hostname spelling
- Check DNS settings
- Try IP address instead of hostname
- Ensure no typos in host field

### Certificate Errors
**Problem:** SSL/TLS certificate validation fails

**Solutions:**
- In production: Fix certificate issue
- For testing: Service allows self-signed certs
- Verify `secure` setting matches port (587=TLS, 465=SSL)

---

## 📤 Email Template

The test email uses a beautiful HTML template with:
- Responsive design
- Professional styling
- Success indicators
- Email details section
- Next steps guidance
- Footer with branding

Preview the template:
```bash
npm run test:smtp-live
# Then send a test email to yourself
```

---

## 🔄 Migration from Environment Variables

If you're currently using environment variables for SMTP:

### Old Method (.env file)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=user@gmail.com
SMTP_PASSWORD=password
SMTP_SENDER=noreply@example.com
```

### New Method (Database + UI)
1. Run the migration script:
   ```bash
   npm run test:smtp-live
   ```
2. Enter your current settings when prompted
3. Settings are now stored in database
4. You can manage them via web interface
5. Old .env variables can be kept as fallback

### Priority Order
1. **Database settings** (highest priority)
2. Environment variables (fallback)
3. Default values (last resort)

---

## 🎯 Integration with Application

### Sending Emails from Code

```typescript
import { settingsService } from './services/settings.service';
import { mailerService } from './services/mailer.service';

// Get current SMTP settings
const smtpSettings = await settingsService.getCurrentSmtpSettings();

if (smtpSettings) {
  // Send email using stored settings
  await mailerService.sendEmail({
    to: 'user@example.com',
    subject: 'Welcome to LicenseGate',
    html: emailTemplate,
    smtpConfig: smtpSettings
  });
}
```

### Configuration Loader (Coming in Task 3.1)
```typescript
// Future: Hot-reload without server restart
configLoader.refresh(); // Reloads SMTP settings from DB
```

---

## 📈 Monitoring

### Check SMTP Status
```typescript
// Via tRPC
const result = await trpc.settings.testCurrentSmtp.mutate();
if (result.success) {
  console.log('SMTP is working');
}
```

### View Audit Logs
```sql
SELECT 
  sa.action,
  sa.key,
  sa.timestamp,
  u.email as user_email
FROM setting_audits sa
JOIN users u ON sa.userId = u.id
WHERE sa.category = 'smtp'
ORDER BY sa.timestamp DESC
LIMIT 10;
```

---

## 🚨 Important Notes

### Security
- ⚠️ Never commit SMTP passwords to git
- ✅ Always use environment variables or database storage
- ✅ Use App Passwords for Gmail (not regular password)
- ✅ Enable 2FA on email accounts
- ✅ Rotate passwords regularly

### Best Practices
- ✅ Test SMTP settings before saving
- ✅ Send test email to verify delivery
- ✅ Monitor audit logs for changes
- ✅ Use dedicated email account for app
- ✅ Set up SPF/DKIM records for your domain

### Rate Limits
Different providers have different limits:
- **Gmail**: 500 emails/day (free), 2000/day (workspace)
- **SendGrid**: 100 emails/day (free), unlimited (paid)
- **Amazon SES**: Pay per email, no hard limit
- **Mailgun**: 100 emails/day (free), unlimited (paid)

---

## 🎓 Educational Resources

### Learn More
- [Nodemailer Documentation](https://nodemailer.com/)
- [SMTP Protocol (RFC 5321)](https://tools.ietf.org/html/rfc5321)
- [Gmail SMTP Setup](https://support.google.com/mail/answer/7126229)
- [Email Best Practices](https://sendgrid.com/blog/email-best-practices/)

### Video Tutorials
- Search YouTube: "SMTP configuration nodemailer"
- Search YouTube: "Gmail app password setup"

---

## ✅ Checklist

Before going to production:

- [ ] SMTP settings tested and working
- [ ] Test email received successfully
- [ ] Encryption key set in production .env
- [ ] Admin user has access to SMTP settings
- [ ] Audit logs being created
- [ ] Backup of SMTP settings taken
- [ ] Rate limits understood
- [ ] SPF/DKIM configured for sender domain
- [ ] Monitoring set up for email failures
- [ ] Documentation updated for team

---

## 🆘 Support

### Getting Help
1. Check troubleshooting section above
2. Review test scripts output
3. Check audit logs in database
4. Review application logs
5. Test with different SMTP provider

### Common Commands
```bash
# Test validation
npm run test:settings-validation

# Test SMTP (requires credentials)
npm run test:smtp-validation

# Interactive setup
npm run test:smtp-live

# Full integration test
npm run test:settings-integration
```

---

## 🎉 Success!

If you've completed the setup:
- ✅ SMTP settings saved to database
- ✅ Connection tested successfully
- ✅ Test email received
- ✅ Settings accessible via web interface
- ✅ Audit trail created

You're ready to send emails from LicenseGate! 🚀

---

**Last Updated**: November 6, 2025  
**Version**: 1.0.0  
**Task**: 2.3 - Settings Validation and Testing

