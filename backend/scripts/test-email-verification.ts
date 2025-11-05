/**
 * 🧪 Test Script - Email Verification Flow
 * 
 * هذا السكريبت يختبر:
 * 1. إنشاء توكن التحقق
 * 2. إرسال بريد التحقق
 * 3. التحقق من التوكن
 * 4. تفعيل المستخدم والترخيص
 * 5. إعادة إرسال البريد
 */

import {
  createVerificationToken,
  sendVerificationEmail,
  verifyEmailToken,
  resendVerificationEmail,
  cleanupExpiredTokens,
  getVerificationStats,
} from '../src/services/email/verification-service';
import { createOrFindUser } from '../src/services/user/user-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testEmailVerification() {
  console.log('🧪 Starting Email Verification Test...\n');

  try {
    // Test 1: Create User and Verification Token
    console.log('📝 Test 1: Create User and Verification Token');
    
    const testEmail = `verification-test-${Date.now()}@example.com`;
    const { user, isNewUser, temporaryPassword } = await createOrFindUser(testEmail);

    console.log('   ✅ User created:', {
      id: user.id,
      email: user.email,
      isNewUser,
      isEmailVerified: user.isEmailVerified,
      temporaryPassword,
    });

    // Create verification token
    const token = await createVerificationToken(user.id);
    console.log('   ✅ Token created:', token.substring(0, 20) + '...');

    // Verify token exists in database
    const dbToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    console.log('   📊 Token in database:', {
      exists: !!dbToken,
      userId: dbToken?.userId,
      expiresAt: dbToken?.expiresAt,
    });

    console.log('\n---\n');

    // Test 2: Send Verification Email
    console.log('📝 Test 2: Send Verification Email');
    
    await sendVerificationEmail({
      email: user.email,
      userName: user.email.split('@')[0],
      verificationToken: token,
    });

    console.log('   ✅ Verification email sent (check mailer logs)');

    console.log('\n---\n');

    // Test 3: Verify Email with Token
    console.log('📝 Test 3: Verify Email with Token');
    
    const verifyResult = await verifyEmailToken(token);
    console.log('   ✅ Verification result:', verifyResult);

    // Check user status after verification
    const verifiedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    console.log('   📊 User status after verification:', {
      isEmailVerified: verifiedUser?.isEmailVerified,
    });

    console.log('\n---\n');

    // Test 4: Try to verify with same token again (should fail)
    console.log('📝 Test 4: Verify with Used Token (Should Fail)');
    
    const verifyAgain = await verifyEmailToken(token);
    console.log('   ✅ Second verification attempt:', {
      success: verifyAgain.success,
      message: verifyAgain.message,
    });

    console.log('\n---\n');

    // Test 5: Invalid Token
    console.log('📝 Test 5: Verify with Invalid Token');
    
    const invalidToken = 'invalid-token-12345';
    const invalidResult = await verifyEmailToken(invalidToken);
    console.log('   ✅ Invalid token result:', {
      success: invalidResult.success,
      message: invalidResult.message,
    });

    console.log('\n---\n');

    // Test 6: Resend Verification Email
    console.log('📝 Test 6: Resend Verification Email');
    
    // Create a new unverified user
    const newUser = await createOrFindUser(`resend-test-${Date.now()}@example.com`);
    await createVerificationToken(newUser.user.id);

    const resendResult = await resendVerificationEmail(newUser.user.email);
    console.log('   ✅ Resend result:', resendResult);

    console.log('\n---\n');

    // Test 7: Try to resend to verified user (should fail)
    console.log('📝 Test 7: Resend to Verified User (Should Fail)');
    
    const resendToVerified = await resendVerificationEmail(user.email);
    console.log('   ✅ Resend to verified user:', resendToVerified);

    console.log('\n---\n');

    // Test 8: Expired Token
    console.log('📝 Test 8: Expired Token Test');
    
    const expiredUser = await createOrFindUser(`expired-test-${Date.now()}@example.com`);
    const expiredToken = await createVerificationToken(expiredUser.user.id);

    // Manually set token as expired
    await prisma.emailVerificationToken.update({
      where: { token: expiredToken },
      data: {
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
      },
    });

    const expiredResult = await verifyEmailToken(expiredToken);
    console.log('   ✅ Expired token result:', {
      success: expiredResult.success,
      message: expiredResult.message,
    });

    console.log('\n---\n');

    // Test 9: Cleanup Expired Tokens
    console.log('📝 Test 9: Cleanup Expired Tokens');
    
    const cleanupCount = await cleanupExpiredTokens();
    console.log('   ✅ Cleaned up tokens:', cleanupCount);

    console.log('\n---\n');

    // Test 10: Get Verification Stats
    console.log('📝 Test 10: Verification Statistics');
    
    const stats = await getVerificationStats();
    console.log('   📊 Stats:', stats);

    console.log('\n---\n');

    // Test 11: Full Flow - User Purchase → Verification → License Activation
    console.log('📝 Test 11: Full Flow Test');
    
    const flowUser = await createOrFindUser(`flow-test-${Date.now()}@example.com`);
    console.log('   1️⃣ User created');

    // Create license (inactive)
    const license = await prisma.license.create({
      data: {
        userId: flowUser.user.id,
        licenseKey: `TEST-${Date.now()}-FLOW`,
        name: 'Test License',
        notes: 'Test flow license',
        active: false, // Inactive until verification
        ipLimit: 5,
      },
    });
    console.log('   2️⃣ License created (inactive)');

    // Create verification token
    const flowToken = await createVerificationToken(flowUser.user.id);
    console.log('   3️⃣ Verification token created');

    // Verify email (should activate license)
    const flowVerify = await verifyEmailToken(flowToken);
    console.log('   4️⃣ Email verified:', flowVerify.success);

    // Check license status
    const activatedLicense = await prisma.license.findUnique({
      where: { id: license.id },
    });
    console.log('   5️⃣ License activated:', activatedLicense?.active);

    console.log('\n---\n');

    // Summary
    console.log('📊 Test Summary:');
    const totalTokens = await prisma.emailVerificationToken.count();
    const verifiedUsers = await prisma.user.count({
      where: { isEmailVerified: true },
    });
    const unverifiedUsers = await prisma.user.count({
      where: { isEmailVerified: false },
    });

    console.log('   - Total Active Tokens:', totalTokens);
    console.log('   - Verified Users:', verifiedUsers);
    console.log('   - Unverified Users:', unverifiedUsers);

    console.log('\n✅ All email verification tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
if (require.main === module) {
  testEmailVerification()
    .then(() => {
      console.log('\n🎉 Email verification test suite passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

export { testEmailVerification };
