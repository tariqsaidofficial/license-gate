import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { autoGenerateLicense } from '../services/license/auto-generator';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

/**
 * 🎯 معالج Webhook الرئيسي لـ Stripe
 * 
 * يستقبل أحداث Stripe ويعالجها بناءً على نوع الحدث
 */
export async function handleStripeWebhook(event: Stripe.Event): Promise<{
  success: boolean;
  message: string;
}> {
  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  try {
    // 1️⃣ تسجيل الحدث في قاعدة البيانات (لتجنب التكرار)
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId: event.id },
    });

    if (existingEvent && existingEvent.status === 'processed') {
      console.log(`[Stripe Webhook] Event already processed: ${event.id}`);
      return {
        success: true,
        message: 'Event already processed',
      };
    }

    // حفظ أو تحديث الحدث
    await prisma.webhookEvent.upsert({
      where: { eventId: event.id },
      create: {
        provider: 'stripe',
        eventType: event.type,
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

    // 2️⃣ معالجة الحدث بناءً على نوعه
    let result: { success: boolean; message: string };

    switch (event.type) {
      case 'payment_intent.succeeded':
        result = await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case 'checkout.session.completed':
        result = await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case 'payment_intent.payment_failed':
        result = await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case 'charge.refunded':
        result = await handleChargeRefunded(
          event.data.object as Stripe.Charge
        );
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        result = {
          success: true,
          message: `Event type ${event.type} not handled`,
        };
    }

    // 3️⃣ تحديث حالة الحدث
    await prisma.webhookEvent.update({
      where: { eventId: event.id },
      data: {
        status: result.success ? 'processed' : 'failed',
        errorMessage: result.success ? null : result.message,
        processedAt: new Date(),
      },
    });

    return result;
  } catch (error) {
    console.error('[Stripe Webhook] Error processing event:', error);

    // تحديث حالة الحدث كفاشل
    await prisma.webhookEvent.update({
      where: { eventId: event.id },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        processedAt: new Date(),
      },
    });

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 💳 معالجة نجاح الدفع - Payment Intent Succeeded
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
): Promise<{ success: boolean; message: string }> {
  console.log(`[Stripe] Payment succeeded: ${paymentIntent.id}`);

  try {
    // استخراج البيانات من metadata
    const metadata = paymentIntent.metadata;
    const email = metadata.email || paymentIntent.receipt_email;
    const phone = metadata.phone;
    const userId = metadata.userId ? parseInt(metadata.userId) : undefined;

    if (!email) {
      throw new Error('No email found in payment intent');
    }

    // استخراج إعدادات الترخيص من metadata
    const licenseConfig = {
      planName: metadata.planName || 'Standard License',
      duration: metadata.duration ? parseInt(metadata.duration) : undefined,
      validationLimit: metadata.validationLimit
        ? parseInt(metadata.validationLimit)
        : undefined,
      ipLimit: metadata.ipLimit ? parseInt(metadata.ipLimit) : undefined,
      scopes: metadata.scopes ? metadata.scopes.split(',') : [],
    };

    // إنشاء الترخيص تلقائياً
    const result = await autoGenerateLicense({
      email,
      phone,
      amount: paymentIntent.amount / 100, // تحويل من سنتات
      currency: paymentIntent.currency,
      paymentId: paymentIntent.id,
      provider: 'stripe',
      userId,
      licenseConfig,
    });

    if (!result.success) {
      throw new Error('Failed to generate license');
    }

    console.log(`[Stripe] License auto-generated:`, {
      licenseKey: result.licenseKey,
      userId: result.userId,
      isNewUser: result.isNewUser,
    });

    return {
      success: true,
      message: `License created successfully for ${email}`,
    };
  } catch (error) {
    console.error('[Stripe] Error handling payment success:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 🛒 معالجة إتمام Checkout Session
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<{ success: boolean; message: string }> {
  console.log(`[Stripe] Checkout completed: ${session.id}`);

  try {
    // إذا كان الدفع عبر PaymentIntent، سيتم معالجته في payment_intent.succeeded
    // هنا نتعامل مع حالات خاصة فقط

    const email = session.customer_email || session.metadata?.email;
    const paymentIntentId = session.payment_intent as string;

    if (!email) {
      throw new Error('No email found in checkout session');
    }

    console.log(`[Stripe] Checkout session completed for: ${email}`);

    // يمكن إضافة منطق إضافي هنا إذا لزم الأمر
    // مثل: إرسال بريد تأكيد الطلب، تحديث الإحصائيات، إلخ

    return {
      success: true,
      message: `Checkout completed for ${email}`,
    };
  } catch (error) {
    console.error('[Stripe] Error handling checkout completion:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * ❌ معالجة فشل الدفع
 */
async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent
): Promise<{ success: boolean; message: string }> {
  console.log(`[Stripe] Payment failed: ${paymentIntent.id}`);

  const email = paymentIntent.metadata?.email || paymentIntent.receipt_email;
  const failureMessage = paymentIntent.last_payment_error?.message;

  console.error(`[Stripe] Payment failed for ${email}:`, failureMessage);

  // يمكن إضافة منطق هنا:
  // - إرسال بريد إعلام بفشل الدفع
  // - تسجيل في لوحة التحكم
  // - إعادة المحاولة التلقائية في حالات معينة

  return {
    success: true,
    message: `Payment failure logged for ${email}`,
  };
}

/**
 * 💰 معالجة استرجاع المال (Refund)
 */
async function handleChargeRefunded(
  charge: Stripe.Charge
): Promise<{ success: boolean; message: string }> {
  console.log(`[Stripe] Charge refunded: ${charge.id}`);

  try {
    const paymentIntentId = charge.payment_intent as string;

    if (!paymentIntentId) {
      throw new Error('No payment intent found in refunded charge');
    }

    // البحث عن الدفع المرتبط
    const payment = await prisma.paymentLicense.findUnique({
      where: { paymentId: paymentIntentId },
      include: { license: true },
    });

    if (!payment) {
      console.log(`[Stripe] No license found for refunded payment: ${paymentIntentId}`);
      return {
        success: true,
        message: 'No action needed - payment not in system',
      };
    }

    // تعطيل الترخيص المرتبط
    await prisma.license.update({
      where: { id: payment.licenseId },
      data: {
        active: false,
        notes: `License deactivated due to refund on ${new Date().toISOString()}`,
      },
    });

    console.log(`[Stripe] License deactivated due to refund: ${payment.license.licenseKey}`);

    // يمكن إضافة: إرسال بريد للعميل بإعلامه

    return {
      success: true,
      message: `License ${payment.license.licenseKey} deactivated due to refund`,
    };
  } catch (error) {
    console.error('[Stripe] Error handling refund:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 🔐 التحقق من توقيع Webhook من Stripe
 */
export function verifyStripeWebhook(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Stripe] Webhook secret not configured');
    return null;
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('[Stripe] Webhook signature verification failed:', error);
    return null;
  }
}

/**
 * 📊 الحصول على إحصائيات Stripe Webhooks
 */
export async function getStripeWebhookStats() {
  const stats = await prisma.webhookEvent.groupBy({
    by: ['eventType', 'status'],
    where: {
      provider: 'stripe',
    },
    _count: {
      id: true,
    },
  });

  const totalEvents = await prisma.webhookEvent.count({
    where: { provider: 'stripe' },
  });

  const successfulEvents = await prisma.webhookEvent.count({
    where: {
      provider: 'stripe',
      status: 'processed',
    },
  });

  const failedEvents = await prisma.webhookEvent.count({
    where: {
      provider: 'stripe',
      status: 'failed',
    },
  });

  return {
    totalEvents,
    successfulEvents,
    failedEvents,
    successRate: totalEvents > 0 ? (successfulEvents / totalEvents) * 100 : 0,
    byEventType: stats,
  };
}
