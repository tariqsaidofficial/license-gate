"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStripeWebhookStats = exports.verifyStripeWebhook = exports.handleStripeWebhook = void 0;
const stripe_1 = __importDefault(require("stripe"));
const client_1 = require("@prisma/client");
const auto_generator_1 = require("../services/license/auto-generator");
const prisma = new client_1.PrismaClient();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});
/**
 * 🎯 معالج Webhook الرئيسي لـ Stripe
 *
 * يستقبل أحداث Stripe ويعالجها بناءً على نوع الحدث
 */
function handleStripeWebhook(event) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[Stripe Webhook] Received event: ${event.type}`);
        try {
            // 1️⃣ تسجيل الحدث في قاعدة البيانات (لتجنب التكرار)
            const existingEvent = yield prisma.webhookEvent.findUnique({
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
            yield prisma.webhookEvent.upsert({
                where: { eventId: event.id },
                create: {
                    provider: 'stripe',
                    eventType: event.type,
                    eventId: event.id,
                    payload: event,
                    status: 'pending',
                },
                update: {
                    status: 'pending',
                    processedAt: null,
                    errorMessage: null,
                },
            });
            // 2️⃣ معالجة الحدث بناءً على نوعه
            let result;
            switch (event.type) {
                case 'payment_intent.succeeded':
                    result = yield handlePaymentIntentSucceeded(event.data.object);
                    break;
                case 'checkout.session.completed':
                    result = yield handleCheckoutSessionCompleted(event.data.object);
                    break;
                case 'payment_intent.payment_failed':
                    result = yield handlePaymentIntentFailed(event.data.object);
                    break;
                case 'charge.refunded':
                    result = yield handleChargeRefunded(event.data.object);
                    break;
                default:
                    console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
                    result = {
                        success: true,
                        message: `Event type ${event.type} not handled`,
                    };
            }
            // 3️⃣ تحديث حالة الحدث
            yield prisma.webhookEvent.update({
                where: { eventId: event.id },
                data: {
                    status: result.success ? 'processed' : 'failed',
                    errorMessage: result.success ? null : result.message,
                    processedAt: new Date(),
                },
            });
            return result;
        }
        catch (error) {
            console.error('[Stripe Webhook] Error processing event:', error);
            // تحديث حالة الحدث كفاشل
            yield prisma.webhookEvent.update({
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
    });
}
exports.handleStripeWebhook = handleStripeWebhook;
/**
 * 💳 معالجة نجاح الدفع - Payment Intent Succeeded
 */
function handlePaymentIntentSucceeded(paymentIntent) {
    return __awaiter(this, void 0, void 0, function* () {
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
            const result = yield (0, auto_generator_1.autoGenerateLicense)({
                email,
                phone,
                amount: paymentIntent.amount / 100,
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
        }
        catch (error) {
            console.error('[Stripe] Error handling payment success:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    });
}
/**
 * 🛒 معالجة إتمام Checkout Session
 */
function handleCheckoutSessionCompleted(session) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[Stripe] Checkout completed: ${session.id}`);
        try {
            // إذا كان الدفع عبر PaymentIntent، سيتم معالجته في payment_intent.succeeded
            // هنا نتعامل مع حالات خاصة فقط
            const email = session.customer_email || ((_a = session.metadata) === null || _a === void 0 ? void 0 : _a.email);
            const paymentIntentId = session.payment_intent;
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
        }
        catch (error) {
            console.error('[Stripe] Error handling checkout completion:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    });
}
/**
 * ❌ معالجة فشل الدفع
 */
function handlePaymentIntentFailed(paymentIntent) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[Stripe] Payment failed: ${paymentIntent.id}`);
        const email = ((_a = paymentIntent.metadata) === null || _a === void 0 ? void 0 : _a.email) || paymentIntent.receipt_email;
        const failureMessage = (_b = paymentIntent.last_payment_error) === null || _b === void 0 ? void 0 : _b.message;
        console.error(`[Stripe] Payment failed for ${email}:`, failureMessage);
        // يمكن إضافة منطق هنا:
        // - إرسال بريد إعلام بفشل الدفع
        // - تسجيل في لوحة التحكم
        // - إعادة المحاولة التلقائية في حالات معينة
        return {
            success: true,
            message: `Payment failure logged for ${email}`,
        };
    });
}
/**
 * 💰 معالجة استرجاع المال (Refund)
 */
function handleChargeRefunded(charge) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[Stripe] Charge refunded: ${charge.id}`);
        try {
            const paymentIntentId = charge.payment_intent;
            if (!paymentIntentId) {
                throw new Error('No payment intent found in refunded charge');
            }
            // البحث عن الدفع المرتبط
            const payment = yield prisma.paymentLicense.findUnique({
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
            yield prisma.license.update({
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
        }
        catch (error) {
            console.error('[Stripe] Error handling refund:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    });
}
/**
 * 🔐 التحقق من توقيع Webhook من Stripe
 */
function verifyStripeWebhook(payload, signature) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error('[Stripe] Webhook secret not configured');
        return null;
    }
    try {
        return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    }
    catch (error) {
        console.error('[Stripe] Webhook signature verification failed:', error);
        return null;
    }
}
exports.verifyStripeWebhook = verifyStripeWebhook;
/**
 * 📊 الحصول على إحصائيات Stripe Webhooks
 */
function getStripeWebhookStats() {
    return __awaiter(this, void 0, void 0, function* () {
        const stats = yield prisma.webhookEvent.groupBy({
            by: ['eventType', 'status'],
            where: {
                provider: 'stripe',
            },
            _count: {
                id: true,
            },
        });
        const totalEvents = yield prisma.webhookEvent.count({
            where: { provider: 'stripe' },
        });
        const successfulEvents = yield prisma.webhookEvent.count({
            where: {
                provider: 'stripe',
                status: 'processed',
            },
        });
        const failedEvents = yield prisma.webhookEvent.count({
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
    });
}
exports.getStripeWebhookStats = getStripeWebhookStats;
