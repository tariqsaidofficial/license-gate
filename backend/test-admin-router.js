// Test admin router endpoints
const fetch = require('node-fetch');

async function testAdminEndpoints() {
  console.log('🧪 Testing Admin Router Endpoints');
  console.log('='.repeat(50));

  const baseUrl = 'http://localhost:3001/trpc';
  
  // Test available endpoints
  const endpoints = [
    'admin.users',
    'admin.dashboardStats', 
    'admin.resetUserPassword',
    'admin.setCustomPassword'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      
      const response = await fetch(`${baseUrl}/${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`  Status: ${response.status}`);
      
      if (response.status === 401) {
        console.log('  ✅ Endpoint exists (requires auth)');
      } else if (response.status === 404) {
        console.log('  ❌ Endpoint NOT FOUND');
      } else {
        console.log('  ✅ Endpoint accessible');
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log('');
  }
}

testAdminEndpoints().catch(console.error);