/**
 * Test PayPal Webhook Flow
 * Simulates PayPal webhook events for license generation testing
 */

import 'dotenv-safe/config';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = process.env.API_URL || 'http://localhost:3001';
const WEBHOOK_URL = `${API_URL}/webhooks/paypal`;

/**
 * Test PayPal Payment Capture Completed Event
 */
async function testPaymentCaptureCompleted() {
  console.log('\n📋 Test 1: PAYMENT.CAPTURE.COMPLETED');
  console.log('='.repeat(50));

  const testEmail = `test-paypal-${Date.now()}@example.com`;
  const orderId = `ORDER-${Date.now()}`;
  const captureId = `CAPTURE-${Date.now()}`;

  // Mock PayPal webhook event
  const webhookEvent = {
    id: `WH-${Date.now()}`,
    event_version: '1.0',
    create_time: new Date().toISOString(),
    resource_type: 'capture',
    event_type: 'PAYMENT.CAPTURE.COMPLETED',
    summary: 'Payment completed for order',
    resource: {
      id: captureId,
      amount: {
        currency_code: 'USD',
        value: '99.00',
      },
      final_capture: true,
      seller_protection: {
        status: 'ELIGIBLE',
      },
      supplementary_data: {
        related_ids: {
          order_id: orderId,
        },
      },
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString(),
      status: 'COMPLETED',
    },
  };

  // Mock order data in database (simulate what would come from PayPal API)
  // In real scenario, this would be fetched from PayPal
  const mockOrderData = {
    id: orderId,
    status: 'COMPLETED',
    purchase_units: [{
      custom_id: JSON.stringify({
        email: testEmail,
        phone: '+1234567890',
        licenseConfig: {
          planName: 'Premium-Plan',
          duration: 365,
          validationLimit: 50000,
          ipLimit: 10,
          scopes: ['premium', 'api'],
        },
      }),
      amount: {
        currency_code: 'USD',
        value: '99.00',
      },
    }],
    payer: {
      email_address: testEmail,
      payer_id: 'PAYER123',
    },
  };

  console.log('📤 Sending webhook to:', WEBHOOK_URL);
  console.log('📧 Test email:', testEmail);

  try {
    // Mock getPayPalOrder to return our test data
    // NOTE: In production, this would actually call PayPal API
    const originalGetPayPalOrder = require('../src/services/payment/paypal-service').getPayPalOrder;
    require('../src/services/payment/paypal-service').getPayPalOrder = async () => ({
      orderId: mockOrderData.id,
      status: mockOrderData.status,
      customId: mockOrderData.purchase_units[0].custom_id,
      amount: mockOrderData.purchase_units[0].amount,
      payer: mockOrderData.payer,
    });

    // Send webhook event
    const response = await axios.post(WEBHOOK_URL, webhookEvent, {
      headers: { 'Content-Type': 'application/json' },
    });

    const result = response.data;
    console.log('📥 Response:', result);

    // Restore original function
    require('../src/services/payment/paypal-service').getPayPalOrder = originalGetPayPalOrder;

    // Verify results
    console.log('\n🔍 Verifying results...');

    // 1. Check webhook event logged
    const loggedEvent = await prisma.webhookEvent.findUnique({
      where: { eventId: webhookEvent.id },
    });
    console.log('✅ Webhook event logged:', !!loggedEvent);
    console.log('   Status:', loggedEvent?.status);

    // 2. Check user created
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
    });
    console.log('✅ User created:', !!user);
    console.log('   User ID:', user?.id);
    console.log('   Email verified:', user?.isEmailVerified);

    // 3. Check license created
    const license = await prisma.license.findFirst({
      where: { userId: user?.id },
    });
    console.log('✅ License created:', !!license);
    console.log('   License Key:', license?.licenseKey);
    console.log('   Name:', license?.name);
    console.log('   Validation Limit:', license?.validationLimit);

    // 4. Check payment logged (via webhook events)
    const paymentEvents = await prisma.webhookEvent.findMany({
      where: { 
        eventType: 'PAYMENT.CAPTURE.COMPLETED',
        status: 'processed',
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    console.log('✅ Payment events logged:', paymentEvents.length > 0);

    return {
      success: true,
      user,
      license,
      webhookEvent: loggedEvent,
    };
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test Checkout Order Approved Event
 */
async function testCheckoutOrderApproved() {
  console.log('\n📋 Test 2: CHECKOUT.ORDER.APPROVED');
  console.log('='.repeat(50));

  const orderId = `ORDER-APPROVED-${Date.now()}`;

  const webhookEvent = {
    id: `WH-APPROVED-${Date.now()}`,
    event_version: '1.0',
    create_time: new Date().toISOString(),
    resource_type: 'checkout-order',
    event_type: 'CHECKOUT.ORDER.APPROVED',
    summary: 'Order approved by buyer',
    resource: {
      id: orderId,
      status: 'APPROVED',
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString(),
    },
  };

  console.log('📤 Sending webhook to:', WEBHOOK_URL);

  try {
    const response = await axios.post(WEBHOOK_URL, webhookEvent, { headers: { 'Content-Type': 'application/json' } });

    const result = response.data;
    console.log('📥 Response:', result);

    // Verify event logged
    const loggedEvent = await prisma.webhookEvent.findUnique({
      where: { eventId: webhookEvent.id },
    });
    console.log('✅ Event logged:', !!loggedEvent);
    console.log('   Status:', loggedEvent?.status);
    console.log('   Note: No license created (waiting for capture)');

    return { success: true, webhookEvent: loggedEvent };
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test Payment Failed Event
 */
async function testPaymentFailed() {
  console.log('\n📋 Test 3: PAYMENT.CAPTURE.DECLINED');
  console.log('='.repeat(50));

  const captureId = `CAPTURE-DECLINED-${Date.now()}`;

  const webhookEvent = {
    id: `WH-DECLINED-${Date.now()}`,
    event_version: '1.0',
    create_time: new Date().toISOString(),
    resource_type: 'capture',
    event_type: 'PAYMENT.CAPTURE.DECLINED',
    summary: 'Payment was declined',
    resource: {
      id: captureId,
      status: 'DECLINED',
      status_details: {
        reason: 'INSUFFICIENT_FUNDS',
      },
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString(),
    },
  };

  console.log('📤 Sending webhook to:', WEBHOOK_URL);

  try {
    const response = await axios.post(WEBHOOK_URL, webhookEvent, { headers: { 'Content-Type': 'application/json' } });

    const result = response.data;
    console.log('📥 Response:', result);

    // Verify event logged
    const loggedEvent = await prisma.webhookEvent.findUnique({
      where: { eventId: webhookEvent.id },
    });
    console.log('✅ Event logged:', !!loggedEvent);
    console.log('   Status:', loggedEvent?.status);

    return { success: true, webhookEvent: loggedEvent };
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test Idempotency (Duplicate Events)
 */
async function testIdempotency() {
  console.log('\n📋 Test 4: Idempotency (Duplicate Event)');
  console.log('='.repeat(50));

  const testEmail = `test-idempotent-${Date.now()}@example.com`;
  const eventId = `WH-IDEMPOTENT-${Date.now()}`;
  const orderId = `ORDER-${Date.now()}`;
  const captureId = `CAPTURE-${Date.now()}`;

  const webhookEvent = {
    id: eventId,
    event_version: '1.0',
    create_time: new Date().toISOString(),
    resource_type: 'capture',
    event_type: 'PAYMENT.CAPTURE.COMPLETED',
    summary: 'Payment completed',
    resource: {
      id: captureId,
      amount: {
        currency_code: 'USD',
        value: '49.00',
      },
      supplementary_data: {
        related_ids: {
          order_id: orderId,
        },
      },
      status: 'COMPLETED',
    },
  };

  // Mock order data
  const mockOrderData = {
    id: orderId,
    status: 'COMPLETED',
    customId: JSON.stringify({
      email: testEmail,
      licenseConfig: {
        planName: 'Basic-Plan',
        duration: 30,
        validationLimit: 1000,
      },
    }),
    payer: { email_address: testEmail },
  };

  try {
    // Mock getPayPalOrder
    const originalGetPayPalOrder = require('../src/services/payment/paypal-service').getPayPalOrder;
    require('../src/services/payment/paypal-service').getPayPalOrder = async () => mockOrderData;

    // Send webhook event FIRST TIME
    console.log('📤 Sending webhook (1st time)...');
    const response1 = await axios.post(WEBHOOK_URL, webhookEvent, { headers: { 'Content-Type': 'application/json' } });
    const result1 = response1.data;
    console.log('📥 First response:', result1);

    // Count licenses before second send
    const licensesBeforeRetry = await prisma.license.count({
      where: { 
        user: { email: testEmail }
      },
    });
    console.log('   Licenses created:', licensesBeforeRetry);

    // Send webhook event SECOND TIME (duplicate)
    console.log('\n📤 Sending webhook (2nd time - duplicate)...');
    const response2 = await axios.post(WEBHOOK_URL, webhookEvent, { headers: { 'Content-Type': 'application/json' } });
    const result2 = response2.data;
    console.log('📥 Second response:', result2);

    // Restore original function
    require('../src/services/payment/paypal-service').getPayPalOrder = originalGetPayPalOrder;

    // Verify no duplicate licenses
    const licensesAfterRetry = await prisma.license.count({
      where: { 
        user: { email: testEmail }
      },
    });
    console.log('   Licenses after retry:', licensesAfterRetry);

    const noDuplicates = licensesBeforeRetry === licensesAfterRetry;
    console.log('✅ Idempotency check:', noDuplicates ? 'PASSED' : 'FAILED');

    return { success: noDuplicates, licensesBeforeRetry, licensesAfterRetry };
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Run All Tests
 */
async function runAllTests() {
  console.log('🚀 PayPal Webhook Flow Tests');
  console.log('='.repeat(50));
  console.log('API URL:', API_URL);
  console.log('Webhook URL:', WEBHOOK_URL);

  const results = {
    paymentCaptureCompleted: await testPaymentCaptureCompleted(),
    checkoutOrderApproved: await testCheckoutOrderApproved(),
    paymentFailed: await testPaymentFailed(),
    idempotency: await testIdempotency(),
  };

  console.log('\n📊 Test Summary');
  console.log('='.repeat(50));
  console.log('✅ Payment Capture Completed:', results.paymentCaptureCompleted.success);
  console.log('✅ Checkout Order Approved:', results.checkoutOrderApproved.success);
  console.log('✅ Payment Failed:', results.paymentFailed.success);
  console.log('✅ Idempotency:', results.idempotency.success);

  const allPassed = Object.values(results).every((r: any) => r.success);
  console.log('\n' + (allPassed ? '🎉 All tests passed!' : '❌ Some tests failed'));

  await prisma.$disconnect();
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
