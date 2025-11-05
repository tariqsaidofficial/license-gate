/**
 * PayPal Webhook Handler
 * Processes PayPal webhook events and generates licenses automatically
 */

import { PrismaClient } from '@prisma/client';
import { autoGenerateLicense } from '../services/license/auto-generator';
import { getPayPalOrder } from '../services/payment/paypal-service';

const prisma = new PrismaClient();

/**
 * Main PayPal Webhook Handler
 */
export async function handlePayPalWebhook(event: any): Promise<{
  success: boolean;
  message: string;
}> {
  console.log(`[PayPal Webhook] Received event: ${event.event_type}`);

  try {
    // 1. Log event to database (idempotency check)
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId: event.id },
    });

    if (existingEvent && existingEvent.status === 'processed') {
      console.log(`[PayPal Webhook] Event already processed: ${event.id}`);
      return {
        success: true,
        message: 'Event already processed',
      };
    }

    // Save or update event
    await prisma.webhookEvent.upsert({
      where: { eventId: event.id },
      create: {
        provider: 'paypal',
        eventType: event.event_type,
        eventId: event.id,
        payload: event as any,
        status: 'pending',
      },
      update: {
        status: 'pending',
        processedAt: null,
        errorMessage: null,
      },
    });

    // 2. Process event based on type
    let result: { success: boolean; message: string };

    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        result = await handlePaymentCaptureCompleted(event);
        break;

      case 'CHECKOUT.ORDER.APPROVED':
        result = await handleCheckoutOrderApproved(event);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED':
        result = await handlePaymentFailed(event);
        break;

      case 'PAYMENT.CAPTURE.REFUNDED':
        result = await handlePaymentRefunded(event);
        break;

      default:
        console.log(`[PayPal Webhook] Unhandled event type: ${event.event_type}`);
        result = {
          success: true,
          message: `Event type ${event.event_type} not handled`,
        };
    }

    // 3. Update event status
    await prisma.webhookEvent.update({
      where: { eventId: event.id },
      data: {
        status: result.success ? 'processed' : 'failed',
        errorMessage: result.success ? null : result.message,
        processedAt: new Date(),
      },
    });

    return result;
  } catch (error: any) {
    console.error('[PayPal Webhook] Error processing event:', error);

    // Update event as failed
    await prisma.webhookEvent.update({
      where: { eventId: event.id },
      data: {
        status: 'failed',
        errorMessage: error.message,
        processedAt: new Date(),
      },
    });

    return {
      success: false,
      message: error.message,
    };
  }
}

/**
 * Handle Payment Capture Completed
 */
async function handlePaymentCaptureCompleted(event: any) {
  const resource = event.resource;
  
  console.log('[PayPal] Payment captured:', resource.id);

  try {
    // Get order details to extract custom data
    const orderId = resource.supplementary_data?.related_ids?.order_id;
    
    if (!orderId) {
      throw new Error('Order ID not found in payment resource');
    }

    const order = await getPayPalOrder(orderId);
    
    // Parse custom data (contains email and license config)
    const customData = order.customId ? JSON.parse(order.customId) : {};
    const email = customData.email || order.payer?.email_address;
    
    if (!email) {
      throw new Error('Customer email not found');
    }

    // Auto-generate license
    const licenseResult = await autoGenerateLicense({
      email,
      phone: customData.phone,
      amount: parseFloat(resource.amount.value),
      currency: resource.amount.currency_code,
      paymentId: resource.id,
      provider: 'paypal',
      licenseConfig: customData.licenseConfig || {
        planName: 'Standard-Plan',
        duration: 365,
        validationLimit: 10000,
        ipLimit: 5,
        scopes: ['basic'],
      },
    });

    console.log('[PayPal] License auto-generated:', {
      licenseKey: licenseResult.licenseKey,
      userId: licenseResult.userId,
      isNewUser: licenseResult.isNewUser,
    });

    return {
      success: true,
      message: `License created successfully for ${email}`,
    };
  } catch (error: any) {
    console.error('[PayPal] Error in payment capture:', error);
    return {
      success: false,
      message: error.message,
    };
  }
}

/**
 * Handle Checkout Order Approved
 */
async function handleCheckoutOrderApproved(event: any) {
  const resource = event.resource;
  
  console.log('[PayPal] Checkout approved:', resource.id);

  // Note: Order is approved but not captured yet
  // We'll process it when PAYMENT.CAPTURE.COMPLETED arrives
  
  return {
    success: true,
    message: `Order ${resource.id} approved, waiting for capture`,
  };
}

/**
 * Handle Payment Failed
 */
async function handlePaymentFailed(event: any) {
  const resource = event.resource;
  
  console.error('[PayPal] Payment failed:', resource.id);

  return {
    success: true,
    message: `Payment ${resource.id} failed`,
  };
}

/**
 * Handle Payment Refunded
 */
async function handlePaymentRefunded(event: any) {
  const resource = event.resource;
  
  console.log('[PayPal] Payment refunded:', resource.id);

  try {
    // Find the license associated with this payment
    const paymentLicense = await prisma.paymentLicense.findFirst({
      where: {
        paymentId: {
          contains: resource.id,
        },
      },
      include: {
        license: true,
      },
    });

    if (paymentLicense) {
      // Deactivate the license
      await prisma.license.update({
        where: { id: paymentLicense.licenseId },
        data: { active: false },
      });

      console.log('[PayPal] License deactivated due to refund:', paymentLicense.license.licenseKey);

      return {
        success: true,
        message: `License ${paymentLicense.license.licenseKey} deactivated due to refund`,
      };
    }

    return {
      success: true,
      message: 'Refund processed, no license found',
    };
  } catch (error: any) {
    console.error('[PayPal] Error processing refund:', error);
    return {
      success: false,
      message: error.message,
    };
  }
}
