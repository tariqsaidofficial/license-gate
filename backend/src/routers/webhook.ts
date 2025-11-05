import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import Container from "typedi";
import { LicenseService } from "../controller/license.controller";

const licenseService = Container.get(LicenseService);

/**
 * Webhook Router للتعامل مع إشعارات الدفع التلقائية
 * يستقبل إشعارات من منصات الدفع وينشئ التراخيص تلقائياً
 */

// Schema للدفعة الناجحة
const paymentWebhookSchema = z.object({
  // معلومات الدفعة
  paymentId: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(["completed", "pending", "failed"]),
  
  // معلومات العميل
  customer: z.object({
    email: z.string().email(),
    name: z.string(),
    userId: z.number().optional(), // إذا كان مسجل مسبقاً
  }),
  
  // معلومات المنتج/الباقة
  product: z.object({
    id: z.string(),
    name: z.string(),
    duration: z.number().optional(), // بالأيام
    ipLimit: z.number().optional(),
    validationLimit: z.number().optional(),
    scopes: z.array(z.string()).optional(),
  }),
  
  // Webhook verification
  signature: z.string().optional(), // للتحقق من صحة الطلب
  timestamp: z.number(),
});

export const webhookRouter = router({
  /**
   * Stripe Webhook Handler
   * استقبال إشعارات Stripe وإنشاء التراخيص تلقائياً
   */
  stripePayment: publicProcedure
    .input(paymentWebhookSchema)
    .mutation(async ({ input }) => {
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
        const license = await licenseService.create({
          userId,
          license: {
            name: `${input.product.name} - ${input.customer.name}`,
            notes: `Auto-generated from payment ${input.paymentId}`,
            active: true,
            ipLimit: input.product.ipLimit ?? null,
            licenseScope: input.product.scopes?.join(",") ?? null,
            expirationDate,
            validationLimit: input.product.validationLimit ?? null,
            validationPoints: input.product.validationLimit ?? null,
            replenishAmount: null,
            replenishInterval: null,
          },
        });

        // 6. إرسال البريد الإلكتروني للعميل
        await sendLicenseEmail({
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
      } catch (error) {
        console.error("Webhook error:", error);
        throw error;
      }
    }),

  /**
   * PayPal Webhook Handler
   */
  paypalPayment: publicProcedure
    .input(paymentWebhookSchema)
    .mutation(async ({ input }) => {
      // نفس المنطق مع تعديلات PayPal
      return { success: true, message: "PayPal webhook not implemented yet" };
    }),

  /**
   * Generic Payment Webhook
   * للاستخدام مع أي منصة دفع أخرى
   */
  genericPayment: publicProcedure
    .input(paymentWebhookSchema)
    .mutation(async ({ input }) => {
      // نفس المنطق العام
      return { success: true, message: "Generic webhook not implemented yet" };
    }),
});

/**
 * إرسال البريد الإلكتروني بالترخيص
 */
async function sendLicenseEmail(params: {
  customerEmail: string;
  customerName: string;
  licenseKey: string;
  productName: string;
  expirationDate: Date | null;
}) {
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
}
