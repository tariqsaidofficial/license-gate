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
  
  try {
    await sendMail(params.email, subject, 'verify-email', {
      url: verificationUrl,
      username: params.userName,
    });
    
    console.log(`[Verification] Email sent successfully to: ${params.email}`);
  } catch (error) {
    console.error(`[Verification] Failed to send email to ${params.email}:`, error);
    throw new Error(`Failed to send verification email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
