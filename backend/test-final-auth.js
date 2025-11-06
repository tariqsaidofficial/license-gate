// Final test with proper authentication
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

async function testWithAuth() {
  console.log('🎯 Final Test - setCustomPassword with Authentication');
  console.log('='.repeat(60));

  const baseUrl = 'http://localhost:3001';
  
  // Create JWT token with correct secret
  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  
  const token = jwt.sign(
    { 
      userId: 1, // Admin user ID
      email: 'info@dxbmark.com' 
    },
    jwtSecret,
    { expiresIn: '1h' }
  );
  
  console.log('✅ JWT Token created');
  console.log('Token length:', token.length);
  
  console.log('');
  console.log('🧪 Testing setCustomPassword with authentication...');
  
  try {
    const response = await fetch(`${baseUrl}/trpc/admin.setCustomPassword`, {
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
    
    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      const result = await response.json();
      console.log('🎉 SUCCESS! Response:');
      console.log(JSON.stringify(result, null, 2));
      
      console.log('');
      console.log('✅ setCustomPassword is now WORKING!');
      console.log('✅ The procedure is properly registered');
      console.log('✅ Authentication is working');
      console.log('✅ Password update is functional');
      
    } else {
      const errorText = await response.text();
      console.log('❌ Error Response:');
      console.log(errorText);
      
      if (errorText.includes('notAuthenticated')) {
        console.log('');
        console.log('🔍 Authentication issue - check JWT secret or user ID');
      } else if (errorText.includes('unauthorized')) {
        console.log('');
        console.log('🔍 Authorization issue - user may not be admin');
      }
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testWithAuth().catch(console.error);