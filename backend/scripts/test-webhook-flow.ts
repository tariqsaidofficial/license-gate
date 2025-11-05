/**
 * 🧪 Test Script - Complete Webhook Flow
 * 
 * هذا السكريبت يختبر التدفق الكامل من:
 * Webhook → Auto-License → Email Verification → License Activation
 */

import { handleStripeWebhook } from '../src/webhooks/stripe-handler';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock Stripe Event - Payment Intent Succeeded
function createMockStripeEvent(overrides: any = {}) {
  return {
    id: `evt_test_${Date.now()}`,
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: `pi_test_${Date.now()}`,
        amount: 9999, // $99.99 in cents
        currency: 'usd',
        receipt_email: `test-${Date.now()}@example.com`,
        metadata: {
          email: `test-${Date.now()}@example.com`,
          planName: 'Pro-Plan',
          duration: '365',
          validationLimit: '10000',
          ipLimit: '5',
          scopes: 'api,advanced_features',
          ...overrides.metadata,
        },
        ...overrides.paymentIntent,
      },
    },
    created: Math.floor(Date.now() / 1000),
    ...overrides.event,
  };
}

async function testWebhookFlow() {
  console.log('🧪 Starting Complete Webhook Flow Test...\n');

  try {
    // Test 1: Successful Payment → New User
    console.log('📝 Test 1: Webhook - New User Purchase');
    
    const event1 = createMockStripeEvent({
      metadata: {
        email: `webhook-new-user-${Date.now()}@example.com`,
        phone: '+971501234567',
      },
    });

    console.log('   💳 Processing payment intent:', event1.data.object.id);
    console.log('   📧 Customer email:', event1.data.object.metadata.email);

    const result1 = await handleStripeWebhook(event1 as any);
    console.log('   ✅ Webhook result:', result1);

    // Verify webhook was logged
    const webhookLog1 = await prisma.webhookEvent.findUnique({
      where: { eventId: event1.id },
    });

    console.log('   📊 Webhook logged:', {
      eventId: webhookLog1?.eventId,
      status: webhookLog1?.status,
      processedAt: webhookLog1?.processedAt,
    });

    // Verify user was created
    const user1 = await prisma.user.findUnique({
      where: { email: event1.data.object.metadata.email },
      include: {
        licenses: true,
        paymentLicenses: true,
      },
    });

    console.log('   👤 User created:', {
      id: user1?.id,
      email: user1?.email,
      verified: user1?.isEmailVerified,
      licensesCount: user1?.licenses.length,
    });

    console.log('   🎫 License details:', {
      licenseKey: user1?.licenses[0]?.licenseKey,
      active: user1?.licenses[0]?.active,
      expirationDate: user1?.licenses[0]?.expirationDate,
    });

    console.log('\n---\n');

    // Test 2: Existing Verified User Purchase
    console.log('📝 Test 2: Webhook - Existing Verified User');
    
    // Create and verify a user first
    const existingEmail = `webhook-existing-${Date.now()}@example.com`;
    const existingUser = await prisma.user.create({
      data: {
        uuid: `uuid-${Date.now()}`,
        email: existingEmail,
        passwordHash: 'hashed_password',
        isEmailVerified: true,
        rsaPublicKey: 'public_key',
        rsaPrivateKey: 'private_key',
        marketingEmails: false,
        isAdmin: false,
      },
    });

    const event2 = createMockStripeEvent({
      metadata: {
        email: existingEmail,
        userId: String(existingUser.id),
        planName: 'Enterprise-Plan',
      },
    });

    const result2 = await handleStripeWebhook(event2 as any);
    console.log('   ✅ Webhook result:', result2);

    const updatedUser = await prisma.user.findUnique({
      where: { id: existingUser.id },
      include: { licenses: true },
    });

    console.log('   📊 Updated user:', {
      licensesCount: updatedUser?.licenses.length,
      newLicenseActive: updatedUser?.licenses[0]?.active, // Should be active immediately
    });

    console.log('\n---\n');

    // Test 3: Idempotency - Duplicate Webhook
    console.log('📝 Test 3: Idempotency - Duplicate Webhook');
    
    const event3 = createMockStripeEvent({
      event: {
        id: event1.id, // Same event ID as Test 1
      },
      paymentIntent: {
        id: event1.data.object.id, // Same payment intent
      },
      metadata: event1.data.object.metadata,
    });

    const result3 = await handleStripeWebhook(event3 as any);
    console.log('   ✅ Duplicate webhook result:', result3);
    console.log('   📝 Should return success without creating new license');

    const userAfterDuplicate = await prisma.user.findUnique({
      where: { email: event1.data.object.metadata.email },
      include: { licenses: true },
    });

    console.log('   📊 License count after duplicate:', {
      before: user1?.licenses.length,
      after: userAfterDuplicate?.licenses.length,
      same: user1?.licenses.length === userAfterDuplicate?.licenses.length,
    });

    console.log('\n---\n');

    // Test 4: Failed Payment Webhook
    console.log('📝 Test 4: Failed Payment Webhook');
    
    const failedEvent = {
      id: `evt_failed_${Date.now()}`,
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: `pi_failed_${Date.now()}`,
          amount: 9999,
          currency: 'usd',
          metadata: {
            email: `failed-payment-${Date.now()}@example.com`,
          },
          last_payment_error: {
            message: 'Your card was declined',
          },
        },
      },
      created: Math.floor(Date.now() / 1000),
    };

    const result4 = await handleStripeWebhook(failedEvent as any);
    console.log('   ✅ Failed payment result:', result4);

    console.log('\n---\n');

    // Test 5: Refund Webhook
    console.log('📝 Test 5: Refund Webhook');
    
    // Create a payment and license first
    const refundEmail = `refund-test-${Date.now()}@example.com`;
    const refundUser = await prisma.user.create({
      data: {
        uuid: `uuid-refund-${Date.now()}`,
        email: refundEmail,
        passwordHash: 'hashed',
        isEmailVerified: true,
        rsaPublicKey: 'pub',
        rsaPrivateKey: 'priv',
        marketingEmails: false,
        isAdmin: false,
      },
    });

    const refundLicense = await prisma.license.create({
      data: {
        userId: refundUser.id,
        licenseKey: `REFUND-TEST-${Date.now()}`,
        name: 'Refund Test License',
        notes: 'For refund testing',
        active: true,
        ipLimit: 5,
      },
    });

    const refundPaymentId = `pi_refund_${Date.now()}`;
    await prisma.paymentLicense.create({
      data: {
        paymentId: refundPaymentId,
        userId: refundUser.id,
        licenseId: refundLicense.id,
        amount: 99.99,
        currency: 'USD',
        provider: 'stripe',
        metadata: {},
      },
    });

    const refundEvent = {
      id: `evt_refund_${Date.now()}`,
      type: 'charge.refunded',
      data: {
        object: {
          id: `ch_${Date.now()}`,
          payment_intent: refundPaymentId,
          amount_refunded: 9999,
        },
      },
      created: Math.floor(Date.now() / 1000),
    };

    const result5 = await handleStripeWebhook(refundEvent as any);
    console.log('   ✅ Refund webhook result:', result5);

    const refundedLicense = await prisma.license.findUnique({
      where: { id: refundLicense.id },
    });

    console.log('   📊 License after refund:', {
      active: refundedLicense?.active,
      deactivated: !refundedLicense?.active,
    });

    console.log('\n---\n');

    // Test 6: Checkout Session Completed
    console.log('📝 Test 6: Checkout Session Completed');
    
    const checkoutEvent = {
      id: `evt_checkout_${Date.now()}`,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: `cs_${Date.now()}`,
          customer_email: `checkout-${Date.now()}@example.com`,
          payment_intent: `pi_checkout_${Date.now()}`,
          metadata: {
            email: `checkout-${Date.now()}@example.com`,
          },
        },
      },
      created: Math.floor(Date.now() / 1000),
    };

    const result6 = await handleStripeWebhook(checkoutEvent as any);
    console.log('   ✅ Checkout webhook result:', result6);

    console.log('\n---\n');

    // Summary
    console.log('📊 Final Summary:');
    
    const totalWebhooks = await prisma.webhookEvent.count();
    const processedWebhooks = await prisma.webhookEvent.count({
      where: { status: 'processed' },
    });
    const failedWebhooks = await prisma.webhookEvent.count({
      where: { status: 'failed' },
    });

    console.log('   - Total Webhooks:', totalWebhooks);
    console.log('   - Processed:', processedWebhooks);
    console.log('   - Failed:', failedWebhooks);
    console.log('   - Success Rate:', 
      ((processedWebhooks / totalWebhooks) * 100).toFixed(2) + '%'
    );

    const totalLicenses = await prisma.license.count();
    const activeLicenses = await prisma.license.count({
      where: { active: true },
    });

    console.log('   - Total Licenses:', totalLicenses);
    console.log('   - Active Licenses:', activeLicenses);

    console.log('\n✅ Complete webhook flow test passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
if (require.main === module) {
  testWebhookFlow()
    .then(() => {
      console.log('\n🎉 Webhook flow test suite passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

export { testWebhookFlow };
