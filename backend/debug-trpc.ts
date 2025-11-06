// Debug tRPC router structure
import { appRouter } from './src/routers/_app';

console.log('🔍 Debugging tRPC Router Structure');
console.log('='.repeat(50));

// Check if appRouter is defined
console.log('App Router defined:', !!appRouter);

// Check router structure
const routerDef = (appRouter as any)._def;
console.log('Router definition exists:', !!routerDef);

if (routerDef && routerDef.procedures) {
  console.log('Available top-level procedures:', Object.keys(routerDef.procedures));
  
  // Check admin router specifically
  const adminRouter = routerDef.procedures.admin;
  if (adminRouter) {
    console.log('✅ Admin router found');
    
    const adminDef = (adminRouter as any)._def;
    if (adminDef && adminDef.procedures) {
      console.log('Admin procedures:', Object.keys(adminDef.procedures));
      
      // Check setCustomPassword specifically
      const setCustomPassword = adminDef.procedures.setCustomPassword;
      if (setCustomPassword) {
        console.log('✅ setCustomPassword found!');
        console.log('Procedure type:', (setCustomPassword as any)._def?.type);
      } else {
        console.log('❌ setCustomPassword NOT found');
        console.log('Available admin procedures:', Object.keys(adminDef.procedures));
      }
    } else {
      console.log('❌ Admin router has no procedures definition');
    }
  } else {
    console.log('❌ Admin router not found');
  }
} else {
  console.log('❌ No procedures found in router');
}

// Try to call the procedure directly
try {
  console.log('');
  console.log('🧪 Testing direct procedure call...');
  
  const caller = appRouter.createCaller({
    userId: 1,
    res: {} as any
  });
  
  // This should fail but tell us if the procedure exists
  console.log('Caller created successfully');
  
} catch (error) {
  console.log('Error creating caller:', error);
}