"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const argon2 = __importStar(require("argon2"));
const node_rsa_1 = __importDefault(require("node-rsa"));
const zod_1 = require("zod");
const prisma_1 = require("../prisma");
const trpc_1 = require("../trpc");
const ShowError_1 = require("../utils/ShowError");
const license_key_generator_1 = require("../utils/license-key-generator");
const mailer_1 = require("../utils/mailer");
const nanoid_1 = require("../utils/nanoid");
// Helper function to check admin access
const requireAdmin = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true }
    });
    if (!(user === null || user === void 0 ? void 0 : user.isAdmin)) {
        throw new ShowError_1.ShowError("Admin access required", "unauthorized");
    }
});
exports.adminRouter = (0, trpc_1.router)({
    // Get all users with statistics
    users: trpc_1.protectedProcedure.query(({ ctx }) => __awaiter(void 0, void 0, void 0, function* () {
        yield requireAdmin(ctx.userId);
        const users = yield prisma_1.prisma.user.findMany({
            select: {
                id: true,
                userID: true,
                email: true,
                fullName: true,
                company: true,
                isEmailVerified: true,
                isAdmin: true,
                isActive: true,
                maxLicenses: true,
                maxApiKeys: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        // Get counts separately for each user
        const usersWithCounts = yield Promise.all(users.map((user) => __awaiter(void 0, void 0, void 0, function* () {
            const [licenseCount, apiKeyCount] = yield Promise.all([
                prisma_1.prisma.license.count({
                    where: { userId: user.id, active: true }
                }),
                prisma_1.prisma.apiKey.count({
                    where: { userId: user.id }
                })
            ]);
            return Object.assign(Object.assign({}, user), { currentLicenses: licenseCount, currentApiKeys: apiKeyCount });
        })));
        return usersWithCounts;
    })),
    // Get dashboard KPIs
    dashboardStats: trpc_1.protectedProcedure.query(({ ctx }) => __awaiter(void 0, void 0, void 0, function* () {
        yield requireAdmin(ctx.userId);
        const [totalUsers, activeUsers, totalLicenses, activeLicenses, totalApiKeys] = yield Promise.all([
            prisma_1.prisma.user.count(),
            prisma_1.prisma.user.count({ where: { isActive: true } }),
            prisma_1.prisma.license.count(),
            prisma_1.prisma.license.count({ where: { active: true } }),
            prisma_1.prisma.apiKey.count()
        ]);
        return {
            totalUsers,
            activeUsers,
            totalLicenses,
            activeLicenses,
            totalApiKeys
        };
    })),
    // Create new user
    createUser: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        email: zod_1.z.string().email(),
        fullName: zod_1.z.string().min(1, "Full name is required"),
        company: zod_1.z.string().optional(),
        isAdmin: zod_1.z.boolean().default(false),
        maxLicenses: zod_1.z.number().min(0).default(10),
        maxApiKeys: zod_1.z.number().min(0).default(5),
        isActive: zod_1.z.boolean().default(true)
    }))
        .mutation(({ ctx, input }) => __awaiter(void 0, void 0, void 0, function* () {
        yield requireAdmin(ctx.userId);
        // Check if user already exists
        const existingUser = yield prisma_1.prisma.user.findUnique({
            where: { email: input.email }
        });
        if (existingUser) {
            throw new ShowError_1.ShowError("User with this email already exists", "email-already-in-use");
        }
        // Generate secure password and user ID
        const temporaryPassword = (0, license_key_generator_1.generateSecurePassword)(12);
        const passwordHash = yield argon2.hash(temporaryPassword);
        const userID = (0, nanoid_1.generateUserID)();
        // Generate RSA keys
        const rsaKey = new node_rsa_1.default({ b: 2048 });
        const publicKey = rsaKey.exportKey('public');
        const privateKey = rsaKey.exportKey('private');
        // Create user
        const newUser = yield prisma_1.prisma.user.create({
            data: {
                userID,
                email: input.email,
                fullName: input.fullName,
                company: input.company,
                passwordHash,
                isEmailVerified: true,
                isAdmin: input.isAdmin,
                isActive: input.isActive,
                maxLicenses: input.maxLicenses,
                maxApiKeys: input.maxApiKeys,
                rsaPublicKey: publicKey,
                rsaPrivateKey: privateKey,
                marketingEmails: false
            }
        });
        // Send welcome email with credentials
        try {
            yield (0, mailer_1.sendMail)(input.email, "Welcome to LicenseGate - Your Account Details", "verify-email", // Using verify-email template as placeholder
            {
                email: input.email,
                password: temporaryPassword,
                userId: userID,
                company: input.company || '',
                maxLicenses: input.maxLicenses.toString(),
                maxApiKeys: input.maxApiKeys.toString(),
                loginUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
            });
        }
        catch (error) {
            console.error('Failed to send welcome email:', error);
            // Don't fail the user creation if email fails
        }
        return Object.assign(Object.assign({}, newUser), { temporaryPassword // Return for admin to see
         });
    })),
    // Update user
    updateUser: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        userID: zod_1.z.string(),
        fullName: zod_1.z.string().optional(),
        company: zod_1.z.string().optional(),
        isAdmin: zod_1.z.boolean().optional(),
        maxLicenses: zod_1.z.number().min(0).optional(),
        maxApiKeys: zod_1.z.number().min(0).optional(),
        isActive: zod_1.z.boolean().optional()
    }))
        .mutation(({ ctx, input }) => __awaiter(void 0, void 0, void 0, function* () {
        yield requireAdmin(ctx.userId);
        const { userID } = input, updateData = __rest(input, ["userID"]);
        const updatedUser = yield prisma_1.prisma.user.update({
            where: { userID },
            data: updateData,
            select: {
                id: true,
                userID: true,
                email: true,
                fullName: true,
                company: true,
                isEmailVerified: true,
                isAdmin: true,
                isActive: true,
                maxLicenses: true,
                maxApiKeys: true,
                updatedAt: true
            }
        });
        return updatedUser;
    })),
    // Reset user password
    resetUserPassword: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        userID: zod_1.z.string()
    }))
        .mutation(({ ctx, input }) => __awaiter(void 0, void 0, void 0, function* () {
        yield requireAdmin(ctx.userId);
        const user = yield prisma_1.prisma.user.findUnique({
            where: { userID: input.userID },
            select: { email: true, company: true }
        });
        if (!user) {
            throw new ShowError_1.ShowError("User not found", "not-found");
        }
        // Generate new password
        const newPassword = (0, license_key_generator_1.generateSecurePassword)(12);
        const passwordHash = yield argon2.hash(newPassword);
        // Update password
        yield prisma_1.prisma.user.update({
            where: { userID: input.userID },
            data: { passwordHash }
        });
        // Send password reset email
        try {
            yield (0, mailer_1.sendMail)(user.email, "LicenseGate - Password Reset", "reset-password", {
                email: user.email,
                password: newPassword,
                loginUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
            });
        }
        catch (error) {
            console.error('Failed to send password reset email:', error);
        }
        return {
            success: true,
            newPassword // Return for admin to see
        };
    })),
    // Toggle user active status
    toggleUserStatus: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        userID: zod_1.z.string()
    }))
        .mutation(({ ctx, input }) => __awaiter(void 0, void 0, void 0, function* () {
        yield requireAdmin(ctx.userId);
        const user = yield prisma_1.prisma.user.findUnique({
            where: { userID: input.userID }
        });
        if (!user) {
            throw new ShowError_1.ShowError("User not found", "not-found");
        }
        const updatedUser = yield prisma_1.prisma.user.update({
            where: { userID: input.userID },
            data: { isActive: !user.isActive },
            select: {
                userID: true,
                email: true,
                isActive: true
            }
        });
        return updatedUser;
    })),
    // Delete user (admin only)
    deleteUser: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        userID: zod_1.z.string()
    }))
        .mutation(({ ctx, input }) => __awaiter(void 0, void 0, void 0, function* () {
        yield requireAdmin(ctx.userId);
        // Prevent admin from deleting themselves
        const currentUser = yield prisma_1.prisma.user.findUnique({
            where: { id: ctx.userId },
            select: { userID: true }
        });
        if ((currentUser === null || currentUser === void 0 ? void 0 : currentUser.userID) === input.userID) {
            throw new ShowError_1.ShowError("Cannot delete your own account", "unauthorized");
        }
        const user = yield prisma_1.prisma.user.findUnique({
            where: { userID: input.userID }
        });
        if (!user) {
            throw new ShowError_1.ShowError("User not found", "not-found");
        }
        // Delete user and all related data (cascade delete)
        yield prisma_1.prisma.user.delete({
            where: { userID: input.userID }
        });
        return { success: true, message: "User deleted successfully" };
    }))
});
