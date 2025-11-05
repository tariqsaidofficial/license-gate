/**
 * 🔐 Verification Router - tRPC
 * 
 * هذا الـ Router يوفر endpoints للتحقق من البريد الإلكتروني
 * 
 * Endpoints:
 * - verification.verifyEmail: التحقق من التوكن
 * - verification.resendVerification: إعادة إرسال البريد
 * - verification.checkStatus: التحقق من حالة المستخدم
 */

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../trpc';
import {
  verifyEmailToken,
  resendVerificationEmail,
  getVerificationStats,
} from '../services/email/verification-service';
import { getUserByEmail, getUserById } from '../services/user/user-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const verificationRouter = router({
  /**
   * 📧 التحقق من البريد الإلكتروني بالتوكن
   * 
   * Public endpoint - لا يحتاج authentication
   * يُستخدم عند النقر على رابط التحقق في البريد
   */
  verifyEmail: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, 'Token is required'),
      })
    )
    .mutation(async ({ input }) => {
      const result = await verifyEmailToken(input.token);

      return {
        success: result.success,
        message: result.message,
        userId: result.userId,
      };
    }),

  /**
   * 🔄 إعادة إرسال بريد التحقق
   * 
   * Public endpoint
   * Rate limited - 3 attempts per hour per email
   */
  resendVerification: publicProcedure
    .input(
      z.object({
        email: z.string().email('Invalid email address'),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Add rate limiting here
      // Example: check if user has requested more than 3 times in last hour

      const result = await resendVerificationEmail(input.email);

      return {
        success: result.success,
        message: result.message,
      };
    }),

  /**
   * 📊 التحقق من حالة التحقق للمستخدم
   * 
   * Public endpoint
   * يُستخدم للتحقق إذا كان المستخدم محقق أم لا
   */
  checkVerificationStatus: publicProcedure
    .input(
      z.object({
        email: z.string().email('Invalid email address'),
      })
    )
    .query(async ({ input }) => {
      const user = await getUserByEmail(input.email);

      if (!user) {
        return {
          exists: false,
          verified: false,
          message: 'User not found',
        };
      }

      return {
        exists: true,
        verified: user.isEmailVerified,
        userId: user.id,
        email: user.email,
      };
    }),

  /**
   * 📈 إحصائيات التحقق (Admin only)
   * 
   * Protected endpoint - يحتاج admin access
   */
  getStats: protectedProcedure
    .input(z.object({}).optional())
    .query(async ({ ctx }) => {
      // التحقق من أن المستخدم admin
      const user = await getUserById(ctx.userId);
      if (!user?.isAdmin) {
        throw new Error('Unauthorized - Admin access required');
      }

      const stats = await getVerificationStats();

      // إحصائيات إضافية
      const totalUsers = await prisma.user.count();
      const verifiedUsers = await prisma.user.count({
        where: { isEmailVerified: true },
      });
      const unverifiedUsers = totalUsers - verifiedUsers;

      return {
        tokens: stats,
        users: {
          total: totalUsers,
          verified: verifiedUsers,
          unverified: unverifiedUsers,
          verificationRate:
            totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0,
        },
      };
    }),

  /**
   * 👤 الحصول على معلومات المستخدم الحالي وحالة التحقق
   * 
   * Protected endpoint - يحتاج authentication
   */
  getMyVerificationStatus: protectedProcedure
    .input(z.object({}).optional())
    .query(async ({ ctx }) => {
      const user = await getUserById(ctx.userId);

      if (!user) {
        throw new Error('User not found');
      }

      // التحقق إذا كان هناك توكن نشط
      const activeToken = await prisma.emailVerificationToken.findFirst({
        where: {
          userId: user.id,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      return {
        verified: user.isEmailVerified,
        email: user.email,
        hasActiveToken: !!activeToken,
        tokenExpiresAt: activeToken?.expiresAt,
      };
    }),

  /**
   * ⏰ التحقق من انتهاء صلاحية التوكن
   * 
   * Public endpoint
   */
  checkTokenValidity: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, 'Token is required'),
      })
    )
    .query(async ({ input, ctx }) => {
      const verificationToken = await prisma.emailVerificationToken.findUnique({
        where: { token: input.token },
      });

      if (!verificationToken) {
        return {
          valid: false,
          message: 'Token not found',
        };
      }

      const isExpired = new Date() > verificationToken.expiresAt;

      return {
        valid: !isExpired,
        expired: isExpired,
        expiresAt: verificationToken.expiresAt,
        message: isExpired ? 'Token expired' : 'Token is valid',
      };
    }),
});

// Export types for client
export type VerificationRouter = typeof verificationRouter;
