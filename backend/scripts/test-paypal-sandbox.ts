/**
 * PayPal Sandbox Integration Test
 * Creates real PayPal orders and tests the full payment flow
 */

import 'dotenv-safe/config';
import { PrismaClient } from '@prisma/client';
import { createPayPalOrder, capturePayPalOrder, getPayPalOrder } from '../src/services/payment/paypal-service';

const prisma = new PrismaClient();

/**
 * Test 1: Create PayPal Order
 */
async function testCreatePayPalOrder() {
  console.log('\n📋 Test 1: Create PayPal Order');
  console.log('='.repeat(50));

  const testEmail = `test-${Date.now()}@example.com`;

  try {
    const order = await createPayPalOrder({
      email: testEmail,
      productName: 'LicenseGate Premium License',
      amount: 99.00,
      currency: 'USD',
      licenseConfig: {
        planName: 'Premium-Plan',
        duration: 365,
        validationLimit: 50000,
        ipLimit: 10,
        scopes: ['premium', 'api'],
      },
    });

    console.log('✅ Order created successfully!');
    console.log('   Order ID:', order.orderId);
    console.log('   Status:', order.status);
    console.log('   Approval URL:', order.approvalUrl);
    console.log('\n💡 Next step: Open the approval URL in a browser to complete payment');
    console.log('   (PayPal Sandbox buyer credentials required)');

    return { success: true, order };
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 2: Get Order Details
 */
async function testGetOrderDetails(orderId: string) {
  console.log('\n📋 Test 2: Get Order Details');
  console.log('='.repeat(50));

  try {
    const order = await getPayPalOrder(orderId);

    console.log('✅ Order details retrieved!');
    console.log('   Order ID:', order.orderId);
    console.log('   Status:', order.status);
    console.log('   Amount:', order.amount?.value, order.amount?.currency_code);
    console.log('   Payer:', order.payer?.email_address);

    return { success: true, order };
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 3: Capture Order (Complete Payment)
 * NOTE: This requires the order to be approved by buyer first
 */
async function testCaptureOrder(orderId: string) {
  console.log('\n📋 Test 3: Capture Order');
  console.log('='.repeat(50));

  try {
    const capture = await capturePayPalOrder(orderId);

    console.log('✅ Order captured successfully!');
    console.log('   Order ID:', capture.orderId);
    console.log('   Status:', capture.status);
    console.log('   Capture ID:', capture.captureId);
    console.log('   Email:', capture.email);
    console.log('   Amount:', capture.amount?.value, capture.amount?.currency_code);

    return { success: true, capture };
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 4: Full Payment Flow (Create + Manual Approval + Capture)
 */
async function testFullPaymentFlow() {
  console.log('\n🚀 Full Payment Flow Test');
  console.log('='.repeat(50));

  const testEmail = `fulltest-${Date.now()}@example.com`;

  try {
    // Step 1: Create order
    console.log('\n📝 Step 1: Creating PayPal order...');
    const orderResult = await createPayPalOrder({
      email: testEmail,
      productName: 'LicenseGate Standard License',
      amount: 49.00,
      currency: 'USD',
      licenseConfig: {
        planName: 'Standard-Plan',
        duration: 365,
        validationLimit: 10000,
        ipLimit: 5,
        scopes: ['basic'],
      },
    });

    console.log('✅ Order created:', orderResult.orderId);
    console.log('   Approval URL:', orderResult.approvalUrl);

    // Step 2: Manual approval (user must approve in browser)
    console.log('\n⏸️  Step 2: Manual approval required');
    console.log('   Please open this URL in your browser:');
    console.log('   ' + orderResult.approvalUrl);
    console.log('\n   📌 Use PayPal Sandbox buyer account:');
    console.log('      Email: sb-buyer@personal.example.com');
    console.log('      Password: (your sandbox buyer password)');
    console.log('\n   After approval, run this command to capture:');
    console.log(`   npx ts-node scripts/capture-paypal-order.ts ${orderResult.orderId}`);

    return {
      success: true,
      orderId: orderResult.orderId,
      approvalUrl: orderResult.approvalUrl,
      nextStep: 'manual_approval_required',
    };
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test Environment Configuration
 */
async function testEnvironmentConfig() {
  console.log('\n🔧 PayPal Environment Configuration');
  console.log('='.repeat(50));

  const config = {
    clientId: process.env.PAYPAL_CLIENT_ID ? '✅ Set' : '❌ Missing',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET ? '✅ Set' : '❌ Missing',
    mode: process.env.PAYPAL_MODE || 'sandbox',
    webhookId: process.env.PAYPAL_WEBHOOK_ID ? '✅ Set' : '⚠️  Not set',
  };

  console.log('Client ID:', config.clientId);
  console.log('Client Secret:', config.clientSecret);
  console.log('Mode:', config.mode);
  console.log('Webhook ID:', config.webhookId);

  const isConfigured = config.clientId.includes('✅') && config.clientSecret.includes('✅');

  if (!isConfigured) {
    console.log('\n❌ PayPal is not properly configured!');
    console.log('   Please add to .env:');
    console.log('   PAYPAL_CLIENT_ID=your_sandbox_client_id');
    console.log('   PAYPAL_CLIENT_SECRET=your_sandbox_client_secret');
    console.log('   PAYPAL_MODE=sandbox');
  }

  return { success: isConfigured, config };
}

/**
 * Main Test Runner
 */
async function runTests() {
  console.log('🧪 PayPal Sandbox Integration Tests');
  console.log('='.repeat(50));

  // Test environment
  const envTest = await testEnvironmentConfig();
  if (!envTest.success) {
    console.log('\n❌ Environment not configured. Exiting.');
    await prisma.$disconnect();
    process.exit(1);
  }

  // Get test mode from command line
  const testMode = process.argv[2];

  switch (testMode) {
    case 'create':
      await testCreatePayPalOrder();
      break;

    case 'get':
      if (!process.argv[3]) {
        console.log('❌ Order ID required: npm run test:paypal get <order-id>');
        break;
      }
      await testGetOrderDetails(process.argv[3]);
      break;

    case 'capture':
      if (!process.argv[3]) {
        console.log('❌ Order ID required: npm run test:paypal capture <order-id>');
        break;
      }
      await testCaptureOrder(process.argv[3]);
      break;

    case 'flow':
    default:
      await testFullPaymentFlow();
      break;
  }

  await prisma.$disconnect();
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
