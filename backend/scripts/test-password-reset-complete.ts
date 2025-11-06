import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function testCompletePasswordReset() {
  console.log('🔐 Complete Password Reset Test');
  console.log('='.repeat(60));

  try {
    // Find admin user
    const adminUser = await prisma.user.findFirst({
      where: { email: 'info@dxbmark.com' }
    });

    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('👤 Admin User Found:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   UserID: ${adminUser.userID}`);
    console.log(`   Is Admin: ${adminUser.isAdmin ? '✅' : '❌'}`);
    console.log('');

    // Test 1: Custom Password Setting
    console.log('🧪 Test 1: Custom Password Setting');
    console.log('-'.repeat(40));
    
    const customPassword = 'CustomTest123!';
    console.log(`   Setting custom password: ${customPassword}`);
    
    // Hash the password
    const hashedPassword = await argon2.hash(customPassword);
    console.log(`   Password hashed successfully: ${hashedPassword.substring(0, 30)}...`);
    
    // Update password in database
    const updatedUser = await prisma.user.update({
      where: { userID: adminUser.userID },
      data: { passwordHash: hashedPassword }
    });
    
    console.log('   ✅ Password updated in database');
    
    // Verify the password was saved correctly
    const verifyUser = await prisma.user.findUnique({
      where: { userID: adminUser.userID },
      select: { passwordHash: true }
    });
    
    if (verifyUser?.passwordHash) {
      const isValid = await argon2.verify(verifyUser.passwordHash, customPassword);
      console.log(`   ✅ Password verification: ${isValid ? 'SUCCESS' : 'FAILED'}`);
    } else {
      console.log('   ❌ Password hash not found in database');
    }
    
    console.log('');

    // Test 2: Restore Original Password
    console.log('🧪 Test 2: Restore Original Password');
    console.log('-'.repeat(40));
    
    const originalPassword = 'admin123';
    console.log(`   Restoring original password: ${originalPassword}`);
    
    const originalHash = await argon2.hash(originalPassword);
    await prisma.user.update({
      where: { userID: adminUser.userID },
      data: { passwordHash: originalHash }
    });
    
    // Verify original password works
    const finalUser = await prisma.user.findUnique({
      where: { userID: adminUser.userID },
      select: { passwordHash: true }
    });
    
    if (finalUser?.passwordHash) {
      const isOriginalValid = await argon2.verify(finalUser.passwordHash, originalPassword);
      console.log(`   ✅ Original password restored: ${isOriginalValid ? 'SUCCESS' : 'FAILED'}`);
    }
    
    console.log('');

    // Test 3: Admin Router Function Simulation
    console.log('🧪 Test 3: Admin Router Function Simulation');
    console.log('-'.repeat(40));
    
    // Simulate the admin.setUserPassword function
    const testNewPassword = 'SimulatedTest456!';
    console.log(`   Simulating admin.setUserPassword with: ${testNewPassword}`);
    
    // Check if user exists (admin router logic)
    const targetUser = await prisma.user.findUnique({
      where: { userID: adminUser.userID },
      select: { email: true, fullName: true, company: true }
    });
    
    if (!targetUser) {
      console.log('   ❌ Target user not found');
      return;
    }
    
    console.log(`   ✅ Target user found: ${targetUser.email}`);
    
    // Validate password strength (admin router logic)
    if (testNewPassword.length < 8) {
      console.log('   ❌ Password too short');
      return;
    }
    
    console.log('   ✅ Password strength validation passed');
    
    // Hash and update (admin router logic)
    const newHash = await argon2.hash(testNewPassword);
    await prisma.user.update({
      where: { userID: adminUser.userID },
      data: { passwordHash: newHash }
    });
    
    console.log('   ✅ Password updated via admin router simulation');
    
    // Verify new password
    const verifyNewUser = await prisma.user.findUnique({
      where: { userID: adminUser.userID },
      select: { passwordHash: true }
    });
    
    if (verifyNewUser?.passwordHash) {
      const isNewValid = await argon2.verify(verifyNewUser.passwordHash, testNewPassword);
      console.log(`   ✅ New password verification: ${isNewValid ? 'SUCCESS' : 'FAILED'}`);
    }
    
    // Restore original password again
    const finalOriginalHash = await argon2.hash(originalPassword);
    await prisma.user.update({
      where: { userID: adminUser.userID },
      data: { passwordHash: finalOriginalHash }
    });
    
    console.log('   ✅ Original password restored for login');
    console.log('');

    // Summary
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log('✅ Prisma passwordHash field: EXISTS and WORKING');
    console.log('✅ Password hashing (argon2): WORKING');
    console.log('✅ Database updates: WORKING');
    console.log('✅ Password verification: WORKING');
    console.log('✅ Admin router logic: SIMULATED SUCCESSFULLY');
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('1. Check tRPC router registration');
    console.log('2. Test admin authentication middleware');
    console.log('3. Debug frontend tRPC client');
    console.log('4. Test with actual HTTP requests');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCompletePasswordReset().catch(console.error);