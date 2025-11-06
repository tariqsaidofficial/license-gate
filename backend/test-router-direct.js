// Test router structure directly
console.log('🔍 Testing Router Structure Directly');
console.log('='.repeat(50));

// Import the app router
const { appRouter } = require('./dist/routers/_app.js');

console.log('📋 App Router Structure:');
console.log('Available routers:', Object.keys(appRouter._def.procedures || {}));

if (appRouter._def.procedures && appRouter._def.procedures.admin) {
  console.log('');
  console.log('🔧 Admin Router Found!');
  const adminRouter = appRouter._def.procedures.admin;
  
  if (adminRouter._def && adminRouter._def.procedures) {
    console.log('Admin procedures:', Object.keys(adminRouter._def.procedures));
    
    if (adminRouter._def.procedures.setCustomPassword) {
      console.log('✅ setCustomPassword found in admin router!');
    } else {
      console.log('❌ setCustomPassword NOT found in admin router');
    }
  } else {
    console.log('❌ Admin router has no procedures');
  }
} else {
  console.log('❌ Admin router not found in app router');
}

console.log('');
console.log('🔍 Full Router Structure:');
console.log(JSON.stringify(Object.keys(appRouter._def.procedures || {}), null, 2));