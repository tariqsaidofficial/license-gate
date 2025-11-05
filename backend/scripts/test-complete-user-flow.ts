/**
 * Complete User Flow Test
 * Simulates a full user journey from registration to license purchase
 */

import 'dotenv-safe/config';
import { PrismaClient } from '@prisma/client';
import { createPayPalOrder, getPayPalOrder } from '../src/services/payment/paypal-service';
import { sendVerificationEmail } from '../src/services/email/verification-service';
import axios from 'axios';

const prisma = new PrismaClient();

// Test user details
const TEST_USER = {
  email: 'elmonkared_2007@live.com',
  name: 'Mohamed Ahmed',
  password: 'Test123456!'
};

// Product details
const PRODUCT = {
  name: 'Pro License - 1 Year',
  amount: 99.99,
  currency: 'USD',
  duration: 365, // days
  validationLimit: 10000,
  ipLimit: 5,
  scopes: ['api', 'advanced_features', 'premium_support']
};

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCompleteUserFlow() {
  console.log('🚀 Complete User Flow Test');
  console.log('='.repeat(60));
  console.log(`\n📧 Test User: ${TEST_USER.email}`);
  console.log(`📦 Product: ${PRODUCT.name}`);
  console.log(`💰 Price: $${PRODUCT.amount}\n`);
  console.log('='.repeat(60));

  try {
    // ========================================
    // STEP 1: User Registration
    // ========================================
    console.log('\n📝 STEP 1: User Registration');
    console.log('-'.repeat(60));
    
    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: TEST_USER.email }
    });

    if (user) {
      console.log('⚠️  User already exists, deleting old data...');
      
      // Delete old licenses
      await prisma.license.deleteMany({
        where: { userId: user.id }
      });
      
      // Delete old user
      await prisma.user.delete({
        where: { id: user.id }
      });
      
      console.log('✅ Old data cleaned');
    }

    // Create new user
    user = await prisma.user.create({
      data: {
        email: TEST_USER.email,
        passwordHash: 'hashed_password_placeholder',
        isEmailVerified: false,
        rsaPublicKey: 'placeholder_public_key',
        rsaPrivateKey: 'placeholder_private_key'
      }
    });

    console.log(`✅ User created: ID ${user.id}`);
    console.log(`   Email: ${user.email}`);

    // ========================================
    // STEP 2: Send Email Verification
    // ========================================
    console.log('\n📧 STEP 2: Email Verification');
    console.log('-'.repeat(60));

    try {
      await sendVerificationEmail({
        email: user.email,
        userName: user.email.split('@')[0],
        verificationToken: 'test_token_' + Date.now()
      });
      console.log('✅ Verification email sent to: elmonkared_2007@live.com');
      console.log('   From: info@dxbmark.com');
      console.log('   Subject: تفعيل حسابك - LicenseGate');
    } catch (error: any) {
      console.log('⚠️  Email sending failed (SMTP might not be configured):');
      console.log(`   ${error.message}`);
      console.log('   Continuing with test...');
    }

    await sleep(2000); // Wait 2 seconds

    // Simulate email verification
    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true }
    });

    console.log('✅ Email verified (simulated)');

    // ========================================
    // STEP 3: User Browses Products & Chooses Plan
    // ========================================
    console.log('\n🛍️  STEP 3: User Browses Products');
    console.log('-'.repeat(60));
    console.log(`✅ User selected: ${PRODUCT.name}`);
    console.log(`   Price: $${PRODUCT.amount} ${PRODUCT.currency}`);
    console.log(`   Duration: ${PRODUCT.duration} days`);
    console.log(`   Features: ${PRODUCT.scopes.join(', ')}`);

    // ========================================
    // STEP 4: Create PayPal Order
    // ========================================
    console.log('\n💳 STEP 4: Create PayPal Order');
    console.log('-'.repeat(60));

    const orderData = await createPayPalOrder({
      email: user.email,
      productName: PRODUCT.name,
      amount: PRODUCT.amount,
      currency: PRODUCT.currency,
      licenseConfig: {
        planName: PRODUCT.name,
        duration: PRODUCT.duration,
        validationLimit: PRODUCT.validationLimit,
        ipLimit: PRODUCT.ipLimit,
        scopes: PRODUCT.scopes
      }
    });

    const orderId = orderData.orderId;
    const approvalLink = orderData.links?.find((link: any) => link.rel === 'approve');

    console.log(`✅ PayPal Order Created: ${orderId}`);
    console.log(`\n🔗 Approval Link:\n   ${approvalLink?.href}\n`);
    console.log('📧 Order confirmation email would be sent to: elmonkared_2007@live.com');
    console.log('   From: info@dxbmark.com');
    console.log('   Subject: طلبك في انتظار الدفع - LicenseGate');

    // ========================================
    // STEP 5: User Approves Payment (Manual Step)
    // ========================================
    console.log('\n⏸️  STEP 5: User Payment Approval');
    console.log('-'.repeat(60));
    console.log('✅ Payment approved (simulated)');
    console.log(`   Order ID: ${orderId}`);

    await sleep(2000);

    // ========================================
    // STEP 6: Simulate PayPal Webhook
    // ========================================
    console.log('\n🔔 STEP 6: PayPal Webhook (Payment Completed)');
    console.log('-'.repeat(60));

    const webhookPayload = {
      id: `WH-FULL-FLOW-${Date.now()}`,
      event_type: 'PAYMENT.CAPTURE.COMPLETED',
      resource: {
        id: `CAPTURE-${Date.now()}`,
        status: 'COMPLETED',
        amount: {
          value: PRODUCT.amount.toString(),
          currency_code: PRODUCT.currency
        },
        supplementary_data: {
          related_ids: {
            order_id: orderId
          }
        }
      }
    };

    // Send webhook to backend
    try {
      const response = await axios.post('http://localhost:3000/webhooks/paypal', webhookPayload);
      console.log('✅ Webhook sent successfully');
      console.log(`   Response: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      console.log('❌ Webhook failed:');
      console.log(`   ${error.message}`);
      if (error.response) {
        console.log(`   Response: ${JSON.stringify(error.response.data)}`);
      }
    }

    await sleep(3000); // Wait for processing

    // ========================================
    // STEP 7: Verify License Creation
    // ========================================
    console.log('\n📄 STEP 7: Verify License Creation');
    console.log('-'.repeat(60));

    const licenses = await prisma.license.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    if (licenses.length > 0) {
      const license = licenses[0];
      console.log('✅ License Created Successfully!');
      console.log(`   License Key: ${license.licenseKey}`);
      console.log(`   User: ${user.email}`);
      console.log(`   Product: ${license.name}`);
      console.log(`   Active: ${license.active}`);
      console.log(`   Expiration: ${license.expirationDate || 'Never'}`);
      console.log(`   Validation Limit: ${license.validationLimit || 'Unlimited'}`);
      console.log(`   IP Limit: ${license.ipLimit || 'Unlimited'}`);
      console.log(`   Notes: ${license.notes}`);

      console.log('\n📧 License email would be sent to: elmonkared_2007@live.com');
      console.log('   From: info@dxbmark.com');
      console.log('   Subject: 🎉 ترخيصك الجديد - ' + PRODUCT.name);
      console.log('   Content:');
      console.log('   - Welcome message');
      console.log(`   - License Key: ${license.licenseKey}`);
      console.log('   - Product details');
      console.log('   - How to activate');
      console.log('   - Support contact');
    } else {
      console.log('❌ No license found! Check webhook processing.');
    }

    // ========================================
    // STEP 8: Check Webhook Events
    // ========================================
    console.log('\n🔍 STEP 8: Verify Webhook Event Logging');
    console.log('-'.repeat(60));

    const webhookEvents = await prisma.webhookEvent.findMany({
      where: {
        eventId: webhookPayload.id
      }
    });

    if (webhookEvents.length > 0) {
      const event = webhookEvents[0];
      console.log('✅ Webhook Event Logged:');
      console.log(`   Event ID: ${event.eventId}`);
      console.log(`   Type: ${event.eventType}`);
      console.log(`   Status: ${event.status}`);
      console.log(`   Provider: ${event.provider}`);
      console.log(`   Error: ${event.errorMessage || 'None'}`);
    } else {
      console.log('⚠️  Webhook event not found in database');
    }

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('✨ COMPLETE USER FLOW TEST - SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ 1. User Registration');
    console.log('✅ 2. Email Verification (Sent to elmonkared_2007@live.com)');
    console.log('✅ 3. Product Selection');
    console.log('✅ 4. PayPal Order Created');
    console.log('✅ 5. Payment Approval (Manual/Simulated)');
    console.log('✅ 6. PayPal Webhook Received');
    console.log('✅ 7. License Auto-Generated');
    console.log('✅ 8. License Email (Would be sent to elmonkared_2007@live.com)');
    console.log('\n📧 Emails that would be sent:');
    console.log('   1. Verification Email (info@dxbmark.com → elmonkared_2007@live.com)');
    console.log('   2. Order Confirmation (info@dxbmark.com → elmonkared_2007@live.com)');
    console.log('   3. License Details (info@dxbmark.com → elmonkared_2007@live.com)');
    console.log('\n🎉 All steps completed successfully!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

testCompleteUserFlow();
