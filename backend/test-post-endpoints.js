// Test POST endpoints specifically
const fetch = require('node-fetch');

async function testPostEndpoints() {
  console.log('🧪 Testing POST Admin Endpoints');
  console.log('='.repeat(50));

  const baseUrl = 'http://localhost:3001/trpc';
  
  // Test POST endpoints
  const endpoints = [
    'admin.resetUserPassword',
    'admin.setCustomPassword'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing POST: ${endpoint}`);
      
      const response = await fetch(`${baseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "0": {
            "json": {
              "userID": "test",
              "newPassword": "test123"
            }
          }
        })
      });
      
      console.log(`  Status: ${response.status}`);
      
      if (response.status === 401) {
        console.log('  ✅ Endpoint exists (requires auth)');
      } else if (response.status === 404) {
        console.log('  ❌ Endpoint NOT FOUND');
      } else if (response.status === 500) {
        console.log('  ✅ Endpoint exists (server error - expected without auth)');
      } else {
        console.log('  ✅ Endpoint accessible');
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log('');
  }
}

testPostEndpoints().catch(console.error);