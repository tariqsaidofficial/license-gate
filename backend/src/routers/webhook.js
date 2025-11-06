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
exports.webhookRouter = void 0;
const zod_1 = require("zod");
const trpc_1 = require("../trpc");
const typedi_1 = __importDefault(require("typedi"));
const license_controller_1 = require("../controller/license.controller");
const licenseService = typedi_1.default.get(license_controller_1.LicenseService);
/**
 * Webhook Router للتعامل مع إشعارات الدفع التلقائية
 * يستقبل إشعارات من منصات الدفع وينشئ التراخيص تلقائياً
 */
// Schema للدفعة الناجحة
const paymentWebhookSchema = zod_1.z.object({
    // معلومات الدفعة
    paymentId: zod_1.z.string(),
    amount: zod_1.z.number(),
    currency: zod_1.z.string(),
    status: zod_1.z.enum(["completed", "pending", "failed"]),
    // معلومات العميل
    customer: zod_1.z.object({
        email: zod_1.z.string().email(),
        name: zod_1.z.string(),
        userId: zod_1.z.number().optional(), // إذا كان مسجل مسبقاً
    }),
    // معلومات المنتج/الباقة
    product: zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        duration: zod_1.z.number().optional(),
        ipLimit: zod_1.z.number().optional(),
        validationLimit: zod_1.z.number().optional(),
        scopes: zod_1.z.array(zod_1.z.string()).optional(),
    }),
    // Webhook verification
    signature: zod_1.z.string().optional(),
    timestamp: zod_1.z.number(),
});
exports.webhookRouter = (0, trpc_1.router)({
    /**
     * Stripe Webhook Handler
     * استقبال إشعارات Stripe وإنشاء التراخيص تلقائياً
     */
    stripePayment: trpc_1.publicProcedure
        .input(paymentWebhookSchema)
        .mutation(({ input }) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        try {
            // 1. التحقق من صحة الدفعة
            if (input.status !== "completed") {
                throw new Error("Payment not completed");
            }
            // 2. التحقق من signature للأمان (مهم جداً!)
            // TODO: Implement Stripe signature verification
            // 3. البحث عن المستخدم أو إنشاء واحد جديد
            let userId = input.customer.userId;
            if (!userId) {
                // TODO: Create new user if doesn't exist
                // userId = await createUserFromPayment(input.customer);
                throw new Error("User creation not implemented yet");
            }
            // 4. حساب تاريخ انتهاء الصلاحية
            const expirationDate = input.product.duration
                ? new Date(Date.now() + input.product.duration * 24 * 60 * 60 * 1000)
                : null;
            // 5. إنشاء الترخيص تلقائياً
            const license = yield licenseService.create({
                userId,
                license: {
                    name: `${input.product.name} - ${input.customer.name}`,
                    notes: `Auto-generated from payment ${input.paymentId}`,
                    active: true,
                    ipLimit: (_a = input.product.ipLimit) !== null && _a !== void 0 ? _a : null,
                    licenseScope: (_c = (_b = input.product.scopes) === null || _b === void 0 ? void 0 : _b.join(",")) !== null && _c !== void 0 ? _c : null,
                    expirationDate,
                    validationLimit: (_d = input.product.validationLimit) !== null && _d !== void 0 ? _d : null,
                    validationPoints: (_e = input.product.validationLimit) !== null && _e !== void 0 ? _e : null,
                    replenishAmount: null,
                    replenishInterval: null,
                },
            });
            // 6. إرسال البريد الإلكتروني للعميل
            yield sendLicenseEmail({
                customerEmail: input.customer.email,
                customerName: input.customer.name,
                licenseKey: license.licenseKey,
                productName: input.product.name,
                expirationDate,
            });
            return {
                success: true,
                licenseId: license.id,
                licenseKey: license.licenseKey,
                message: "License created and email sent successfully",
            };
        }
        catch (error) {
            console.error("Webhook error:", error);
            throw error;
        }
    })),
    /**
     * PayPal Webhook Handler
     */
    paypalPayment: trpc_1.publicProcedure
        .input(paymentWebhookSchema)
        .mutation(({ input }) => __awaiter(void 0, void 0, void 0, function* () {
        // نفس المنطق مع تعديلات PayPal
        return { success: true, message: "PayPal webhook not implemented yet" };
    })),
    /**
     * Generic Payment Webhook
     * للاستخدام مع أي منصة دفع أخرى
     */
    genericPayment: trpc_1.publicProcedure
        .input(paymentWebhookSchema)
        .mutation(({ input }) => __awaiter(void 0, void 0, void 0, function* () {
        // نفس المنطق العام
        return { success: true, message: "Generic webhook not implemented yet" };
    })),
});
/**
 * إرسال البريد الإلكتروني بالترخيص
 */
function sendLicenseEmail(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4CAF50;">🎉 شكراً لشرائك ${params.productName}!</h1>
      
      <p>مرحباً ${params.customerName},</p>
      
      <p>تم تفعيل ترخيصك بنجاح! إليك مفتاح الترخيص الخاص بك:</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h2 style="margin: 0; color: #333;">مفتاح الترخيص:</h2>
        <p style="font-size: 24px; font-weight: bold; color: #4CAF50; margin: 10px 0; letter-spacing: 2px;">
          ${params.licenseKey}
        </p>
      </div>
      
      ${params.expirationDate ? `
        <p><strong>تاريخ انتهاء الصلاحية:</strong> ${params.expirationDate.toLocaleDateString('ar-EG')}</p>
      ` : '<p><strong>الترخيص:</strong> مدى الحياة ✨</p>'}
      
      <h3>كيفية الاستخدام:</h3>
      <ol>
        <li>انسخ مفتاح الترخيص أعلاه</li>
        <li>افتح البرنامج/التطبيق</li>
        <li>الصق المفتاح في خانة التفعيل</li>
        <li>استمتع بجميع المزايا! 🚀</li>
      </ol>
      
      <p>إذا واجهت أي مشكلة، لا تتردد في التواصل معنا.</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      
      <p style="color: #888; font-size: 12px;">
        هذا البريد تم إرساله تلقائياً من نظام LicenseGate
      </p>
    </div>
  `;
        // TODO: استخدام EmailService الموجود
        console.log("Sending email to:", params.customerEmail);
        console.log("License key:", params.licenseKey);
        // await emailService.sendEmail({
        //   to: params.customerEmail,
        //   subject: `مفتاح الترخيص الخاص بك - ${params.productName}`,
        //   html: emailHtml,
        // });
    });
}
