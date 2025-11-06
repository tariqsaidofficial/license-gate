"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationRouter = void 0;
const zod_1 = require("zod");
const trpc_1 = require("../trpc");
const verification_service_1 = require("../services/email/verification-service");
const user_service_1 = require("../services/user/user-service");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.verificationRouter = (0, trpc_1.router)({
    /**
     * 📧 التحقق من البريد الإلكتروني بالتوكن
     *
     * Public endpoint - لا يحتاج authentication
     * يُستخدم عند النقر على رابط التحقق في البريد
     */
    verifyEmail: trpc_1.publicProcedure
        .input(zod_1.z.object({
        token: zod_1.z.string().min(1, 'Token is required'),
    }))
        .mutation(({ input }) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield (0, verification_service_1.verifyEmailToken)(input.token);
        return {
            success: result.success,
            message: result.message,
            userId: result.userId,
        };
    })),
    /**
     * 🔄 إعادة إرسال بريد التحقق
     *
     * Public endpoint
     * Rate limited - 3 attempts per hour per email
     */
    resendVerification: trpc_1.publicProcedure
        .input(zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
    }))
        .mutation(({ input }) => __awaiter(void 0, void 0, void 0, function* () {
        // TODO: Add rate limiting here
        // Example: check if user has requested more than 3 times in last hour
        const result = yield (0, verification_service_1.resendVerificationEmail)(input.email);
        return {
            success: result.success,
            message: result.message,
        };
    })),
    /**
     * 📊 التحقق من حالة التحقق للمستخدم
     *
     * Public endpoint
     * يُستخدم للتحقق إذا كان المستخدم محقق أم لا
     */
    checkVerificationStatus: trpc_1.publicProcedure
        .input(zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
    }))
        .query(({ input }) => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, user_service_1.getUserByEmail)(input.email);
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
    })),
    /**
     * 📈 إحصائيات التحقق (Admin only)
     *
     * Protected endpoint - يحتاج admin access
     */
    getStats: trpc_1.protectedProcedure
        .input(zod_1.z.object({}).optional())
        .query(({ ctx }) => __awaiter(void 0, void 0, void 0, function* () {
        // التحقق من أن المستخدم admin
        const user = yield (0, user_service_1.getUserById)(ctx.userId);
        if (!(user === null || user === void 0 ? void 0 : user.isAdmin)) {
            throw new Error('Unauthorized - Admin access required');
        }
        const stats = yield (0, verification_service_1.getVerificationStats)();
        // إحصائيات إضافية
        const totalUsers = yield prisma.user.count();
        const verifiedUsers = yield prisma.user.count({
            where: { isEmailVerified: true },
        });
        const unverifiedUsers = totalUsers - verifiedUsers;
        return {
            tokens: stats,
            users: {
                total: totalUsers,
                verified: verifiedUsers,
                unverified: unverifiedUsers,
                verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0,
            },
        };
    })),
    /**
     * 👤 الحصول على معلومات المستخدم الحالي وحالة التحقق
     *
     * Protected endpoint - يحتاج authentication
     */
    getMyVerificationStatus: trpc_1.protectedProcedure
        .input(zod_1.z.object({}).optional())
        .query(({ ctx }) => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, user_service_1.getUserById)(ctx.userId);
        if (!user) {
            throw new Error('User not found');
        }
        // التحقق إذا كان هناك توكن نشط
        const activeToken = yield prisma.emailVerificationToken.findFirst({
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
            tokenExpiresAt: activeToken === null || activeToken === void 0 ? void 0 : activeToken.expiresAt,
        };
    })),
    /**
     * ⏰ التحقق من انتهاء صلاحية التوكن
     *
     * Public endpoint
     */
    checkTokenValidity: trpc_1.publicProcedure
        .input(zod_1.z.object({
        token: zod_1.z.string().min(1, 'Token is required'),
    }))
        .query(({ input, ctx }) => __awaiter(void 0, void 0, void 0, function* () {
        const verificationToken = yield prisma.emailVerificationToken.findUnique({
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
    })),
});
