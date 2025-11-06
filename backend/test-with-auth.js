// Test with proper authentication
const fetch = require('node-fetch');

async function testWithAuth() {
  console.log('🔐 Testing with Authentication');
  console.log('='.repeat(50));

  const baseUrl = 'http://localhost:3001';
  
  try {
    // First, login to get a token
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${baseUrl}/trpc/auth.loginWithPassword`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "0": {
          "json": {
            "email": "info@dxbmark.com",
            "password": "admin123"
          }
        }
      })
    });
    
    console.log(`Login Status: ${loginResponse.status}`);
    
    if (loginResponse.status !== 200) {
      console.log('❌ Login failed');
      return;
    }
    
    // Get the token from cookies
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Login successful');
    console.log('Cookies:', cookies);
    
    // Extract token
    let token = '';
    if (cookies) {
      const tokenMatch = cookies.match(/token=([^;]+)/);
      if (tokenMatch) {
        token = tokenMatch[1];
        console.log('✅ Token extracted');
      }
    }
    
    if (!token) {
      console.log('❌ No token found');
      return;
    }
    
    console.log('');
    console.log('2. Testing setCustomPassword with auth...');
    
    // Test setCustomPassword with authentication
    const testResponse = await fetch(`${baseUrl}/trpc/admin.setCustomPassword`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${token}`
      },
      body: JSON.stringify({
        "0": {
          "json": {
            "userID": "3r1Yh6TGSGdcnQLh97rb1",
            "newPassword": "TestPassword123!"
          }
        }
      })
    });
    
    console.log(`setCustomPassword Status: ${testResponse.status}`);
    
    if (testResponse.status === 200) {
      const result = await testResponse.json();
      console.log('✅ SUCCESS! Response:', JSON.stringify(result, null, 2));
    } else if (testResponse.status === 404) {
      console.log('❌ Endpoint still not found');
    } else {
      const errorText = await testResponse.text();
      console.log('❌ Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWithAuth().catch(console.error);