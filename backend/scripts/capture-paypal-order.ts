/**
 * Capture PayPal Order After Manual Approval
 * Usage: npx ts-node scripts/capture-paypal-order.ts <ORDER_ID>
 */

import 'dotenv-safe/config';
import { capturePayPalOrder, getPayPalOrder } from '../src/services/payment/paypal-service';

async function captureOrder() {
  const orderId = process.argv[2];

  if (!orderId) {
    console.log('❌ Order ID required');
    console.log('Usage: npx ts-node scripts/capture-paypal-order.ts <ORDER_ID>');
    process.exit(1);
  }

  console.log('📦 Capturing PayPal Order');
  console.log('='.repeat(50));
  console.log('Order ID:', orderId);

  try {
    // Check order status first
    console.log('\n🔍 Checking order status...');
    const orderDetails = await getPayPalOrder(orderId);
    console.log('   Status:', orderDetails.status);
    console.log('   Amount:', orderDetails.amount?.value, orderDetails.amount?.currency_code);

    if (orderDetails.status !== 'APPROVED') {
      console.log(`\n❌ Order is not approved yet (status: ${orderDetails.status})`);
      console.log('   Please approve the order first using the approval URL');
      process.exit(1);
    }

    // Capture the order
    console.log('\n💰 Capturing payment...');
    const capture = await capturePayPalOrder(orderId);

    console.log('✅ Payment captured successfully!');
    console.log('   Capture ID:', capture.captureId);
    console.log('   Status:', capture.status);
    console.log('   Email:', capture.email);
    console.log('   Amount:', capture.amount?.value, capture.amount?.currency_code);

    console.log('\n🎉 Success! Webhook should trigger license generation.');
    console.log('   Check your backend logs for webhook events.');
  } catch (error: any) {
    console.error('\n❌ Capture failed:', error.message);
    process.exit(1);
  }
}

captureOrder();
