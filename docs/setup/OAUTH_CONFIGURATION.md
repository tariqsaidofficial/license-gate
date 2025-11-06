# 🔗 OAuth Configuration Guide

This guide will help you set up Google and GitHub OAuth authentication for LicenseGate.

## 🎯 Overview

OAuth integration allows users to sign in using their existing Google or GitHub accounts, providing a seamless authentication experience while maintaining security.

## 🔧 Google OAuth Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `LicenseGate OAuth`
4. Click "Create"

### 2. Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on "Google+ API" and click "Enable"

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" for user type
   - Fill in required fields:
     - App name: `LicenseGate`
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users if needed

### 4. Configure OAuth Client

1. Application type: "Web application"
2. Name: `LicenseGate Web Client`
3. Authorized JavaScript origins:
   ```
   http://localhost:5173
   https://yourdomain.com
   ```
4. Authorized redirect URIs:
   ```
   http://localhost:5173/auth/google/callback
   https://yourdomain.com/auth/google/callback
   ```
5. Click "Create"

### 5. Get Client ID

1. Copy the "Client ID" (starts with numbers and ends with `.apps.googleusercontent.com`)
2. Update your `frontend/.env` file:
   ```env
   PUBLIC_GOOGLE_AUTH_CLIENT_ID=your-google-client-id-here
   ```

## 🐙 GitHub OAuth Setup

### 1. Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"

### 2. Configure OAuth App

Fill in the application details:

- **Application name**: `LicenseGate`
- **Homepage URL**: 
  ```
  http://localhost:5173
  ```
  (or your production domain)
- **Application description**: `License management system with OAuth integration`
- **Authorization callback URL**:
  ```
  http://localhost:5173/auth/github/callback
  ```

### 3. Get Client ID and Secret

1. After creating the app, copy the "Client ID"
2. Generate a new client secret and copy it
3. Update your configuration files:

**Frontend (`frontend/.env`):**
```env
PUBLIC_GITHUB_CLIENT_ID=your-github-client-id-here
```

**Backend (`backend/.env`):**
```env
GITHUB_CLIENT_SECRET=your-github-client-secret-here
```

## ⚙️ Environment Configuration

### Frontend Configuration (`frontend/.env`)

```env
# OAuth Configuration
PUBLIC_GOOGLE_AUTH_CLIENT_ID=your-google-client-id
PUBLIC_GITHUB_CLIENT_ID=your-github-client-id

# Other settings
PUBLIC_BACKEND_URL=http://localhost:3001
PUBLIC_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
PUBLIC_DISABLE_RECAPTCHA=true
PUBLIC_DISABLE_SIGN_UP=false
```

### Backend Configuration (`backend/.env`)

```env
# OAuth Secrets (keep these secure!)
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Frontend URLs for redirects
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# Other configuration...
```

## 🧪 Testing OAuth Integration

### 1. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 2. Test Google OAuth

1. Go to `http://localhost:5173/auth/login`
2. Click "Continue with Google" button
3. You should see the Google OAuth consent screen
4. Grant permissions and verify successful login

### 3. Test GitHub OAuth

1. Go to `http://localhost:5173/auth/login`
2. Click "Continue with Github" button
3. You should be redirected to GitHub authorization
4. Grant permissions and verify successful login

## 🚀 Production Configuration

### Domain Setup

For production deployment, update your OAuth applications:

**Google Cloud Console:**
1. Add your production domain to "Authorized JavaScript origins"
2. Add production callback URL to "Authorized redirect URIs"

**GitHub OAuth App:**
1. Update "Homepage URL" to your production domain
2. Update "Authorization callback URL" to production callback

### Environment Variables

**Production Frontend:**
```env
PUBLIC_GOOGLE_AUTH_CLIENT_ID=your-google-client-id
PUBLIC_GITHUB_CLIENT_ID=your-github-client-id
PUBLIC_BACKEND_URL=https://api.yourdomain.com
```

**Production Backend:**
```env
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_SECRET=your-google-client-secret
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

## 🔒 Security Best Practices

### 1. Client Secret Security
- **Never** commit client secrets to version control
- Use environment variables or secure secret management
- Rotate secrets regularly (every 6-12 months)

### 2. Redirect URI Security
- Only use HTTPS in production
- Validate redirect URIs on the server side
- Use exact match for redirect URIs (avoid wildcards)

### 3. Scope Limitations
- Request only necessary scopes (`email`, `profile`)
- Avoid requesting excessive permissions
- Review and audit granted permissions regularly

### 4. Token Management
- Implement proper token expiration
- Use secure token storage (httpOnly cookies)
- Implement token refresh mechanisms

## 🐛 Troubleshooting

### Common Issues

#### "redirect_uri_mismatch" Error
- **Cause**: Redirect URI doesn't match configured URI
- **Solution**: Ensure exact match between configured and actual URIs
- **Check**: Protocol (http/https), domain, port, and path

#### "invalid_client" Error
- **Cause**: Incorrect client ID or secret
- **Solution**: Verify client credentials in environment variables
- **Check**: Copy-paste errors, extra spaces, or wrong environment

#### OAuth Button Not Showing
- **Cause**: Environment variables not set correctly
- **Solution**: Check `PUBLIC_GOOGLE_AUTH_CLIENT_ID` and `PUBLIC_GITHUB_CLIENT_ID`
- **Verify**: Restart frontend server after changing `.env`

#### CORS Errors
- **Cause**: Backend CORS configuration doesn't allow frontend domain
- **Solution**: Update `CORS_ORIGIN` in backend `.env`
- **Check**: Exact domain match including protocol and port

### Debug Steps

1. **Check Environment Variables:**
   ```bash
   # Frontend
   echo $PUBLIC_GOOGLE_AUTH_CLIENT_ID
   echo $PUBLIC_GITHUB_CLIENT_ID
   
   # Backend
   echo $GITHUB_CLIENT_SECRET
   echo $CORS_ORIGIN
   ```

2. **Verify OAuth App Configuration:**
   - Double-check redirect URIs
   - Ensure app is not in "development mode" restrictions
   - Verify domain ownership if required

3. **Check Browser Console:**
   - Look for JavaScript errors
   - Check network requests for failed OAuth calls
   - Verify redirect URLs in network tab

4. **Test with curl:**
   ```bash
   # Test backend health
   curl http://localhost:3001/health
   
   # Test CORS
   curl -H "Origin: http://localhost:5173" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: X-Requested-With" \
        -X OPTIONS \
        http://localhost:3001/trpc/auth.loginWithGoogle
   ```

## 📞 Support

If you encounter issues:

1. Check the [troubleshooting section](#troubleshooting) above
2. Review OAuth provider documentation:
   - [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
   - [GitHub OAuth Apps](https://docs.github.com/en/developers/apps/building-oauth-apps)
3. Create an issue in the project repository with:
   - Error messages (remove sensitive information)
   - Steps to reproduce
   - Environment details

---

**Last Updated**: November 6, 2024  
**Guide Version**: 1.0  
**Compatibility**: LicenseGate v2.0.0+