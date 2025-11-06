import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendMail } from '../../utils/mailer';

const prisma = new PrismaClient();

const VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 ساعة

export interface VerificationToken {
  token: string;
  userId: number;
  expiresAt: Date;
}

/**
 * 🎫 إنشاء توكن تحقق جديد
 * 
 * يتم إنشاء توكن آمن باستخدام crypto.randomBytes
 * وحفظه في قاعدة البيانات مع تاريخ انتهاء صلاحيته
 */
export async function createVerificationToken(
  userId: number
): Promise<string> {
  // توليد توكن عشوائي آمن
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY);

  // حذف التوكنات القديمة للمستخدم
  await prisma.emailVerificationToken.deleteMany({
    where: { userId },
  });

  // إنشاء توكن جديد
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  console.log(`[Verification] Token created for user ${userId}`);
  return token;
}

/**
 * 📧 إرسال بريد التحقق
 */
export async function sendVerificationEmail(params: {
  email: string;
  userName: string;
  verificationToken: string;
  licenseKey?: string;
}): Promise<void> {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${params.verificationToken}`;

  const subject = '📧 تحقق من بريدك الإلكتروني - LicenseGate';
  
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content {
          padding: 40px 30px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px 40px;
          text-decoration: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          margin: 20px 0;
        }
        .button:hover {
          opacity: 0.9;
        }
        .info-box {
          background: #f8f9fa;
          border-right: 4px solid #667eea;
          padding: 20px;
          margin: 20px 0;
          border-radius: 6px;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #6c757d;
          font-size: 14px;
        }
        .expiry-warning {
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
          color: #856404;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📧 تحقق من بريدك الإلكتروني</h1>
          <p>مرحباً ${params.userName}!</p>
        </div>

        <div class="content">
          <p>شكراً لتسجيلك في LicenseGate!</p>
          
          <p>للبدء في استخدام حسابك ${params.licenseKey ? 'وتفعيل ترخيصك' : ''}, يرجى التحقق من بريدك الإلكتروني بالنقر على الزر أدناه:</p>

          <center>
            <a href="${verificationUrl}" class="button">
              ✅ تحقق من بريدي الإلكتروني
            </a>
          </center>

          ${params.licenseKey ? `
          <div class="info-box">
            <h3>🎫 ترخيصك في انتظارك!</h3>
            <p>مفتاح الترخيص: <strong>${params.licenseKey}</strong></p>
            <p><em>⚠️ سيتم تفعيل الترخيص تلقائياً بمجرد التحقق من بريدك.</em></p>
          </div>
          ` : ''}

          <div class="expiry-warning">
            <strong>⏰ تنبيه مهم:</strong>
            <p style="margin: 5px 0;">هذا الرابط صالح لمدة 24 ساعة فقط. بعد انتهاء المدة، ستحتاج إلى طلب رابط جديد.</p>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e9ecef;">

          <p><strong>لم تطلب هذا البريد؟</strong></p>
          <p>إذا لم تقم بالتسجيل في LicenseGate، يمكنك تجاهل هذا البريد بأمان.</p>

          <p>أو يمكنك نسخ الرابط التالي ولصقه في متصفحك:</p>
          <p style="background: #f8f9fa; padding: 15px; border-radius: 6px; word-break: break-all; font-size: 12px;">
            ${verificationUrl}
          </p>
        </div>

        <div class="footer">
          <p>إذا كانت لديك أي أسئلة، تواصل معنا على:</p>
          <p><a href="mailto:support@licensegate.io">support@licensegate.io</a></p>
          <p>© 2025 LicenseGate. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendMail(params.email, subject, 'verification' as any, {
    VERIFY_URL: verificationUrl,
    USER_NAME: params.userName,
    LICENSE_KEY: params.licenseKey || '',
  });

  console.log(`[Verification] Email sent to: ${params.email}`);
}

/**
 * ✅ التحقق من توكن وتفعيل البريد
 */
export async function verifyEmailToken(token: string): Promise<{
  success: boolean;
  userId?: number;
  message: string;
}> {
  try {
    // البحث عن التوكن
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      return {
        success: false,
        message: 'رمز التحقق غير صالح',
      };
    }

    // التحقق من انتهاء الصلاحية
    if (new Date() > verificationToken.expiresAt) {
      // حذف التوكن المنتهي
      await prisma.emailVerificationToken.delete({
        where: { token },
      });

      return {
        success: false,
        message: 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.',
      };
    }

    // تفعيل البريد الإلكتروني
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        isEmailVerified: true,
        updatedAt: new Date(),
      },
    });

    // تفعيل جميع التراخيص المعلقة للمستخدم
    await prisma.license.updateMany({
      where: {
        userId: verificationToken.userId,
        active: false,
      },
      data: {
        active: true,
        updatedAt: new Date(),
      },
    });

    // حذف التوكن بعد الاستخدام
    await prisma.emailVerificationToken.delete({
      where: { token },
    });

    console.log(`[Verification] Email verified for user ${verificationToken.userId}`);

    // إرسال بريد تأكيد التفعيل
    await sendActivationConfirmationEmail({
      email: verificationToken.user.email,
      userName: verificationToken.user.email.split('@')[0],
    });

    return {
      success: true,
      userId: verificationToken.userId,
      message: 'تم تفعيل بريدك الإلكتروني بنجاح!',
    };
  } catch (error) {
    console.error('[Verification] Error verifying token:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى.',
    };
  }
}

/**
 * 🔄 إعادة إرسال بريد التحقق
 */
export async function resendVerificationEmail(
  email: string
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        licenses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      return {
        success: false,
        message: 'المستخدم غير موجود',
      };
    }

    if (user.isEmailVerified) {
      return {
        success: false,
        message: 'البريد الإلكتروني مفعل بالفعل',
      };
    }

    // إنشاء توكن جديد
    const token = await createVerificationToken(user.id);

    // إرسال البريد
    await sendVerificationEmail({
      email: user.email,
      userName: user.email.split('@')[0],
      verificationToken: token,
      licenseKey: user.licenses[0]?.licenseKey,
    });

    return {
      success: true,
      message: 'تم إرسال بريد التحقق بنجاح',
    };
  } catch (error) {
    console.error('[Verification] Error resending email:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء إرسال البريد',
    };
  }
}

/**
 * 🎉 إرسال بريد تأكيد التفعيل
 */
async function sendActivationConfirmationEmail(params: {
  email: string;
  userName: string;
}): Promise<void> {
  const subject = '🎉 تم تفعيل حسابك - LicenseGate';
  
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .content {
          padding: 40px 30px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px 40px;
          text-decoration: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #6c757d;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 مبروك ${params.userName}!</h1>
          <p>تم تفعيل حسابك بنجاح</p>
        </div>

        <div class="content">
          <p>تم تأكيد بريدك الإلكتروني وتفعيل جميع تراخيصك!</p>
          
          <p>يمكنك الآن:</p>
          <ul>
            <li>✅ تسجيل الدخول إلى لوحة التحكم</li>
            <li>✅ إدارة تراخيصك</li>
            <li>✅ الوصول إلى جميع الميزات</li>
          </ul>

          <center>
            <a href="${process.env.FRONTEND_URL}/dashboard" class="button">
              انتقل إلى لوحة التحكم
            </a>
          </center>
        </div>

        <div class="footer">
          <p>شكراً لاستخدامك LicenseGate!</p>
          <p>© 2025 LicenseGate. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendMail(params.email, subject, 'activation-confirmation' as any, {
    USER_NAME: params.userName,
    DASHBOARD_URL: `${process.env.FRONTEND_URL}/dashboard`,
  });

  console.log(`[Verification] Activation email sent to: ${params.email}`);
}

/**
 * 🧹 تنظيف التوكنات المنتهية (Cron Job)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.emailVerificationToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  console.log(`[Verification] Cleaned up ${result.count} expired tokens`);
  return result.count;
}

/**
 * 📊 إحصائيات التحقق
 */
export async function getVerificationStats() {
  const totalTokens = await prisma.emailVerificationToken.count();
  const expiredTokens = await prisma.emailVerificationToken.count({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return {
    totalTokens,
    activeTokens: totalTokens - expiredTokens,
    expiredTokens,
  };
}
