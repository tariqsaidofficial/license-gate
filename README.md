<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/DevLeoko/license-gate/assets/13747815/65026d9c-86eb-47c8-804a-6b768a5786de">
  <source media="(prefers-color-scheme: light)" srcset="https://github.com/DevLeoko/license-gate/assets/13747815/e6425f96-e41b-431c-975c-4699006c6b04">
  <img src="https://github.com/DevLeoko/license-gate/assets/13747815/35c05ca5-51b7-440f-b589-29da9e27c876">
</picture>

# LicenseGate

LicenseGate is an open-source licensing tool for developers. Create and manage license or api keys for your software with ease. Easily check the validity of a license through our REST API or with one of our wrapper libraries.

## As easy as a GET request

```http
GET /license/{user-id}/{license-key}/verify
```

```json
{
  "valid": true,
  "status": "VALID"
}
```

## Documentation

You can find the documentation for LicenseGate at [docs.licensegate.io](https://docs.licensegate.io).

## Hosted Version

We offer a hosted version of LicenseGate. You can sign up for free at [licensegate.io](https://licensegate.io).

## Self-Hosting

You can also self-host LicenseGate. You can find the installation instructions in our [documentation](https://docs.licensegate.io).

## Features

- Create and manage licenses
- Live usage statistics
- REST API and wrapper libraries
- RSA key validation for unsecure environments
- Restrict license key usage
  - IP Limit
  - Rate Limit
  - Expiration Date
  - Scopes
- Discord Integration (Third Party)

## 3rd Party Extensions and Integrations

### Discord Integration

Issue license keys to your users using a fully automated bot on your discord server.
Users with a certain role can request their license keys.

GitHub: https://github.com/abhiyanpa/Discord-License-Manager-Bot

### WHMCS Modules

A WHMCS module for selling software licenses on a WHMCS page integrated with LicenseGate.

GitHub: https://github.com/NekoMonci12/LicenseGate-WHMCS

## Community

Join our thriving community on [Discord](https://discord.gg/ycDG6rS)! Contribute to our open-source project, share ideas, or ask questions. Together, we shape the future of LicenseGate.

## Repository Structure

LicenseGate is organized as a monorepo containing both frontend and backend applications:

### Backend (`/backend`)
- **Technology**: Node.js with Express and TypeScript
- **API Framework**: TSOA for OpenAPI/Swagger documentation
- **Database ORM**: Prisma with MySQL
- **Key Features**:
  - REST API for license verification
  - Admin API with API key authentication
  - License validation with multiple restriction options
  - RSA signature verification for secure environments
  - Automated rate limiting and IP tracking
  - Comprehensive logging system

### Frontend (`/frontend`)
- **Technology**: SvelteKit with TypeScript
- **Styling**: TailwindCSS
- **Key Features**:
  - User authentication and account management
  - License creation and management dashboard
  - Real-time usage statistics and analytics
  - API key management
  - RSA key pair generation

### Database Schema
The application uses a MySQL database with the following main entities:
- **User**: Account management with RSA key pairs
- **License**: License keys with restriction options (IP limit, rate limit, scopes, expiration)
- **Log**: Validation attempt tracking with IP, result, and metadata
- **ApiKey**: API authentication keys for admin operations

### Docker Deployment
- Docker Compose configuration for easy self-hosting
- Includes MySQL database, backend API, frontend, and Caddy reverse proxy
- Production-ready with automatic SSL/TLS certificates

## Integration Guide

LicenseGate offers multiple ways to integrate license validation into your applications:

### 1. REST API Integration (Recommended for Most Use Cases)

The simplest way to verify licenses is through the REST API:

```bash
# GET Request
curl "https://your-instance.com/license/{user-id}/{license-key}/verify"

# With optional parameters
curl "https://your-instance.com/license/{user-id}/{license-key}/verify?scope=premium&challenge=1634567890123"
```

Response:
```json
{
  "valid": true,
  "result": "VALID",
  "signedChallenge": "signature..." // if challenge was provided
}
```

**Possible Results:**
- `VALID` - License is valid and active
- `NOT_FOUND` - License key doesn't exist
- `NOT_ACTIVE` - License has been disabled
- `EXPIRED` - License expiration date has passed
- `LICENSE_SCOPE_FAILED` - Requested scope doesn't match license scope
- `IP_LIMIT_EXCEEDED` - Too many IPs have used this license
- `RATE_LIMIT_EXCEEDED` - Rate limit validation points exhausted

### 2. Language-Specific Integration Examples

#### JavaScript/Node.js
```javascript
async function verifyLicense(userId, licenseKey) {
  const response = await fetch(
    `https://your-instance.com/license/${userId}/${licenseKey}/verify`
  );
  const data = await response.json();
  return data.valid;
}
```

#### Python
```python
import requests

def verify_license(user_id, license_key):
    url = f"https://your-instance.com/license/{user_id}/{license_key}/verify"
    response = requests.get(url)
    data = response.json()
    return data['valid']
```

#### C#
```csharp
using System.Net.Http;
using System.Text.Json;

public async Task<bool> VerifyLicense(string userId, string licenseKey)
{
    using var client = new HttpClient();
    var url = $"https://your-instance.com/license/{userId}/{licenseKey}/verify";
    var response = await client.GetAsync(url);
    var json = await response.Content.ReadAsStringAsync();
    var data = JsonSerializer.Deserialize<Dictionary<string, object>>(json);
    return (bool)data["valid"];
}
```

#### Java
```java
import java.net.http.*;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

public boolean verifyLicense(String userId, String licenseKey) throws Exception {
    HttpClient client = HttpClient.newHttpClient();
    String url = String.format("https://your-instance.com/license/%s/%s/verify", 
                               userId, licenseKey);
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(url))
        .build();
    
    HttpResponse<String> response = client.send(request, 
                                               HttpResponse.BodyHandlers.ofString());
    JsonObject json = JsonParser.parseString(response.body()).getAsJsonObject();
    return json.get("valid").getAsBoolean();
}
```

### 3. Admin API Integration

For managing licenses programmatically, use the Admin API with an API key:

```bash
# Create a license
curl -X POST "https://your-instance.com/admin/licenses" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "active": true,
    "name": "Customer License",
    "notes": "Premium subscription",
    "licenseScope": "premium",
    "expirationDate": "2025-12-31T23:59:59Z",
    "ipLimit": 3
  }'

# List all licenses
curl "https://your-instance.com/admin/licenses" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Get specific license
curl "https://your-instance.com/admin/licenses/{license-id}" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Update a license
curl -X PATCH "https://your-instance.com/admin/licenses/{license-id}" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"active": false}'

# Delete a license
curl -X DELETE "https://your-instance.com/admin/licenses/{license-id}" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 4. RSA Signature Verification (For Offline/Untrusted Environments)

For applications where the client might not be able to make HTTP requests or shouldn't be trusted:

1. Generate an RSA key pair in your LicenseGate account
2. Include your public key in your application
3. Request a signed challenge during verification:

```javascript
const timestamp = Date.now().toString();
const response = await fetch(
  `https://your-instance.com/license/${userId}/${licenseKey}/verify?challenge=${timestamp}`
);
const { valid, signedChallenge } = await response.json();

// Verify the signature with your public RSA key
const crypto = require('crypto');
const verifier = crypto.createVerify('SHA256');
verifier.update(timestamp);
const isSignatureValid = verifier.verify(publicKey, signedChallenge, 'base64');
```

### 5. Embedding in Desktop Applications

For desktop applications (Electron, .NET, Java, C++, etc.):

1. Embed the license verification logic in your application startup
2. Optionally cache validation results with a reasonable TTL
3. Handle offline scenarios gracefully
4. Consider using RSA signatures for enhanced security

### 6. Web Application Integration

For web applications:

1. Verify licenses server-side to prevent tampering
2. Never expose license keys in client-side code
3. Use the verification API from your backend
4. Cache results with appropriate TTL to reduce API calls

### 7. Integration with E-commerce Platforms

LicenseGate can be integrated with platforms like:
- **WHMCS**: Use the [WHMCS Module](https://github.com/NekoMonci12/LicenseGate-WHMCS)
- **WooCommerce**: Create custom integration using the REST API
- **Shopify**: Use webhooks and the Admin API for license creation

### 8. Discord Bot Integration

Automatically distribute licenses to Discord server members:
- Use the [Discord License Manager Bot](https://github.com/abhiyanpa/Discord-License-Manager-Bot)
- Assign licenses based on Discord roles
- Automated license key distribution

## API Reference

### Public Endpoints

**Verify License (GET)**
```
GET /license/{userId}/{licenseKey}/verify
Query Parameters:
  - scope (optional): License scope to validate
  - challenge (optional): String to be signed by server
  - metadata (optional): Custom data to log with validation
```

**Verify License (POST)**
```
POST /license/{userId}/{licenseKey}/verify
Body: {
  "scope": "premium",
  "challenge": "1634567890123",
  "metadata": "app-version:2.0"
}
```

### Admin Endpoints (Require API Key)

All admin endpoints require the `Authorization: Bearer YOUR_API_KEY` header.

**Create License**
```
POST /admin/licenses
Body: {
  "active": boolean,
  "name": string,
  "notes": string,
  "licenseKey": string (optional, auto-generated if not provided),
  "ipLimit": number | null,
  "licenseScope": string | null,
  "expirationDate": ISO8601 date | null,
  "validationLimit": number | null,
  "replenishAmount": number | null,
  "replenishInterval": "TEN_SECONDS" | "MINUTE" | "HOUR" | "DAY" | null
}
```

**List Licenses**
```
GET /admin/licenses?take=10&skip=0&filterStatus=active&includeLogs=false
```

**Get License by ID**
```
GET /admin/licenses/{licenseId}?includeLogs=false
```

**Get License by Key**
```
GET /admin/licenses/key/{licenseKey}?includeLogs=false
```

**Update License**
```
PATCH /admin/licenses/{licenseId}
Body: Partial<License>
```

**Delete License**
```
DELETE /admin/licenses/{licenseId}
```

### OpenAPI Documentation

Complete API documentation is available in OpenAPI/Swagger format:
- View `open-api.json` in the repository root
- Or access the interactive API playground at `/api-playground.html` on your instance

## Stack

Key technologies used in LicenseGate:

### Backend
- **Express**: Fast, minimalist web framework for Node.js
- **TypeScript**: Type-safe JavaScript
- **TSOA**: OpenAPI/Swagger spec generation from TypeScript
- **Prisma**: Next-generation ORM for TypeScript and Node.js
- **Zod**: TypeScript-first schema declaration and validation
- **JWT**: Secure authentication tokens
- **Node-RSA**: RSA encryption for license signatures
- **Argon2**: Secure password hashing

### Frontend
- **SvelteKit**: Fast, lightweight web application framework
- **TailwindCSS**: Utility-first CSS framework
- **tRPC**: End-to-end type-safe API calls
- **TanStack Query**: Asynchronous state management and data fetching
- **D3.js**: Data visualization for analytics

### Infrastructure
- **MySQL**: Relational database
- **Docker**: Containerization
- **Caddy**: Automatic HTTPS reverse proxy
