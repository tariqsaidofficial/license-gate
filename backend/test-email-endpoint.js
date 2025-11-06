// Test the sendTestEmail endpoint
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

async function testEmailEndpoint() {
  console.log('📧 Testing sendTestEmail Endpoint');
  console.log('='.repeat(50));

  const baseUrl = 'http://localhost:3001';
  
  // Create JWT token with correct secret
  const jwtSecret = process.env.JWT_SECRET || '8f3a2c1e5d7b9a4f6e8c2a5d7b9f1e3c8a5f2e7d9c1a4f6e8b2d5c7a9f1e3b6c8a5f2d7e9c1a4b6f8e2d5c7a9f1b3e6c8a5d2f7e9c1b4a6f8e2d5c7';
  
  const token = jwt.sign(
    { 
      data: {
        userId: 1, // Admin user ID
        email: 'info@dxbmark.com',
        isAdmin: true
      }
    },
    jwtSecret,
    { expiresIn: '1h' }
  );
  
  console.log('✅ JWT Token created for admin user');
  
  try {
    const response = await fetch(`${baseUrl}/trpc/admin.sendTestEmail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `accessToken=${token}`
      },
      body: JSON.stringify({
        "0": {
          "json": {
            "recipientEmail": "test@example.com",
            "templateName": "Welcome New User",
            "templateData": {
              "userName": "Test User",
              "userEmail": "test@example.com",
              "productName": "LicenseGate Pro",
              "licenseKey": "TEST-ABCD-EFGH-IJKL"
            }
          }
        }
      })
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      const result = await response.json();
      console.log('🎉 SUCCESS! sendTestEmail endpoint is working:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Error Response:');
      console.log(errorText);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testEmailEndpoint().catch(console.error);