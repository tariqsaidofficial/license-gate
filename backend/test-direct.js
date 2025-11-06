// Test directly with JWT token
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

async function testDirect() {
  console.log('🎯 Direct Test with JWT');
  console.log('='.repeat(50));

  const baseUrl = 'http://localhost:3001';
  
  // Create JWT token manually (using the same secret as backend)
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
  console.log('🧪 Testing setCustomPassword...');
  
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
    } else if (response.status === 404) {
      console.log('❌ Endpoint NOT FOUND - Router issue');
      
      // Test if resetUserPassword works
      console.log('');
      console.log('🔄 Testing resetUserPassword for comparison...');
      
      const resetResponse = await fetch(`${baseUrl}/trpc/admin.resetUserPassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `token=${token}`
        },
        body: JSON.stringify({
          "0": {
            "json": {
              "userID": "3r1Yh6TGSGdcnQLh97rb1"
            }
          }
        })
      });
      
      console.log(`resetUserPassword Status: ${resetResponse.status}`);
      
      if (resetResponse.status === 200) {
        console.log('✅ resetUserPassword works - setCustomPassword router issue');
      } else {
        console.log('❌ Both endpoints have issues');
      }
      
    } else {
      const errorText = await response.text();
      console.log('❌ Error Response:');
      console.log(errorText);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testDirect().catch(console.error);