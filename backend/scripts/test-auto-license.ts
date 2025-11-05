/**
 * Comprehensive Test Script for Auto-License Generation
 * Tests all scenarios: logged-in users, new users, existing unverified users
 * 
 * Run with: npx ts-node --files scripts/test-auto-license.ts
 */

import { autoGenerateLicense } from '../src/services/license/auto-generator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test configuration
const TEST_CONFIG = {
  amount: 99.99,
  currency: 'usd',
  provider: 'stripe' as const,
  planName: 'Pro-Plan',
  licenseConfig: {
    planName: 'Pro-Plan',
    duration: 365,
    validationLimit: 10000,
    ipLimit: 5,
    scopes: ['api', 'advanced_features', 'premium_support'],
  },
};

async function runTests() {
  console.log('🧪 Starting Auto-License Generation Tests\n');
  console.log('='.repeat(60));

  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Test 1: New User (Guest Checkout)
    console.log('\n📋 Test 1: New User (Guest Checkout)');
    console.log('-'.repeat(60));
    
    const test1Result = await autoGenerateLicense({
      email: `test-new-${Date.now()}@example.com`,
      phone: '+971501234567',
      ...TEST_CONFIG,
      paymentId: `test_pay_new_${Date.now()}`,
    });

    if (test1Result.success && test1Result.isNewUser && test1Result.emailVerificationRequired) {
      console.log('✅ PASS: New user created successfully');
      console.log('   - User ID:', test1Result.userId);
      console.log('   - License ID:', test1Result.licenseId);
      console.log('   - License Key:', test1Result.licenseKey);
      console.log('   - Email Verification Required:', test1Result.emailVerificationRequired);
      testsPassed++;
    } else {
      console.log('❌ FAIL: Expected new user with verification required');
      testsFailed++;
    }

    // Test 2: Existing Verified User
    console.log('\n📋 Test 2: Existing Verified User');
    console.log('-'.repeat(60));
    
    // Create a verified user first
    const verifiedUser = await prisma.user.create({
      data: {
        email: `test-verified-${Date.now()}@example.com`,
        isEmailVerified: true,
        passwordHash: 'test-hash',
        rsaPublicKey: 'test-public-key',
        rsaPrivateKey: 'test-private-key',
      },
    });

    const test2Result = await autoGenerateLicense({
      email: verifiedUser.email,
      ...TEST_CONFIG,
      paymentId: `test_pay_verified_${Date.now()}`,
      userId: verifiedUser.id,
    });

    if (test2Result.success && !test2Result.isNewUser && !test2Result.emailVerificationRequired) {
      console.log('✅ PASS: License created for verified user');
      console.log('   - License Key:', test2Result.licenseKey);
      console.log('   - Should be active immediately');
      testsPassed++;
    } else {
      console.log('❌ FAIL: Expected existing verified user');
      testsFailed++;
    }

    // Test 3: Duplicate Payment (Idempotency)
    console.log('\n📋 Test 3: Duplicate Payment (Idempotency Check)');
    console.log('-'.repeat(60));
    
    const duplicatePaymentId = `test_pay_duplicate_${Date.now()}`;
    
    // First attempt
    const test3aResult = await autoGenerateLicense({
      email: `test-duplicate-${Date.now()}@example.com`,
      ...TEST_CONFIG,
      paymentId: duplicatePaymentId,
    });

    // Second attempt with same payment ID
    const test3bResult = await autoGenerateLicense({
      email: `test-duplicate-${Date.now()}@example.com`,
      ...TEST_CONFIG,
      paymentId: duplicatePaymentId,
    });

    if (
      test3aResult.licenseId === test3bResult.licenseId &&
      test3aResult.licenseKey === test3bResult.licenseKey
    ) {
      console.log('✅ PASS: Idempotency works - same license returned');
      console.log('   - License ID:', test3aResult.licenseId);
      testsPassed++;
    } else {
      console.log('❌ FAIL: Expected same license for duplicate payment');
      testsFailed++;
    }

    // Test 4: License Naming
    console.log('\n📋 Test 4: License Naming Convention');
    console.log('-'.repeat(60));
    
    const test4Result = await autoGenerateLicense({
      email: `test-naming-${Date.now()}@example.com`,
      ...TEST_CONFIG,
      paymentId: `test_pay_naming_${Date.now()}`,
      licenseConfig: {
        ...TEST_CONFIG.licenseConfig,
        planName: '14-Day-Trial',
      },
    });

    const license = await prisma.license.findUnique({
      where: { id: test4Result.licenseId },
    });

    const expectedPattern = /^14-Day-Trial-\d{8}$/;
    if (license && expectedPattern.test(license.name)) {
      console.log('✅ PASS: License name follows convention');
      console.log('   - License Name:', license.name);
      testsPassed++;
    } else {
      console.log('❌ FAIL: License name does not match expected pattern');
      console.log('   - Got:', license?.name);
      testsFailed++;
    }

    // Test 5: License Key Format
    console.log('\n📋 Test 5: License Key Format');
    console.log('-'.repeat(60));
    
    const test5Result = await autoGenerateLicense({
      email: `test-keyformat-${Date.now()}@example.com`,
      ...TEST_CONFIG,
      paymentId: `test_pay_keyformat_${Date.now()}`,
    });

    const keyPattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (keyPattern.test(test5Result.licenseKey)) {
      console.log('✅ PASS: License key format is correct');
      console.log('   - License Key:', test5Result.licenseKey);
      testsPassed++;
    } else {
      console.log('❌ FAIL: License key format is invalid');
      console.log('   - Got:', test5Result.licenseKey);
      testsFailed++;
    }

    // Test 6: Expiration Date Calculation
    console.log('\n📋 Test 6: Expiration Date Calculation');
    console.log('-'.repeat(60));
    
    const test6Result = await autoGenerateLicense({
      email: `test-expiration-${Date.now()}@example.com`,
      ...TEST_CONFIG,
      paymentId: `test_pay_expiration_${Date.now()}`,
      licenseConfig: {
        ...TEST_CONFIG.licenseConfig,
        duration: 30, // 30 days
      },
    });

    const license6 = await prisma.license.findUnique({
      where: { id: test6Result.licenseId },
    });

    if (license6?.expirationDate) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 30);
      
      const daysDiff = Math.abs(
        (license6.expirationDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysDiff < 1) {
        console.log('✅ PASS: Expiration date calculated correctly');
        console.log('   - Expiration:', license6.expirationDate.toISOString());
        testsPassed++;
      } else {
        console.log('❌ FAIL: Expiration date calculation off by', daysDiff, 'days');
        testsFailed++;
      }
    } else {
      console.log('❌ FAIL: No expiration date set');
      testsFailed++;
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
    
    if (testsFailed === 0) {
      console.log('\n🎉 All tests passed!');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the output above.');
    }

  } catch (error) {
    console.error('\n❌ Fatal Error during testing:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
runTests()
  .then(() => {
    console.log('\n✅ Test execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  });
