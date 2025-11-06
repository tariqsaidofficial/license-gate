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
exports.listUsers = exports.updateUserPhone = exports.updateUserEmail = exports.verifyPassword = exports.updateUserProfile = exports.deleteUser = exports.searchUsers = exports.getUserStats = exports.getUserById = exports.getUserByEmail = exports.updateUserPassword = exports.verifyUserEmail = exports.createOrFindUser = void 0;
const client_1 = require("@prisma/client");
const argon2_1 = __importDefault(require("argon2"));
const node_rsa_1 = __importDefault(require("node-rsa"));
const license_key_generator_1 = require("../../utils/license-key-generator");
const nanoid_1 = require("../../utils/nanoid");
const prisma = new client_1.PrismaClient();
/**
 * 🔍 إيجاد أو إنشاء مستخدم
 *
 * هذه الوظيفة تتعامل مع حالتين:
 * 1. المستخدم موجود → إرجاع المستخدم الحالي
 * 2. المستخدم غير موجود → إنشاء حساب جديد بكلمة مرور عشوائية
 *
 * @param email - البريد الإلكتروني للمستخدم
 * @param phone - رقم الهاتف (اختياري)
 * @returns نتيجة تحتوي على المستخدم وحالة الإنشاء
 */
function createOrFindUser(email, phone) {
    return __awaiter(this, void 0, void 0, function* () {
        const normalizedEmail = email.toLowerCase().trim();
        // 1️⃣ محاولة إيجاد المستخدم الموجود
        const existingUser = yield prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (existingUser) {
            console.log(`[UserService] Found existing user: ${existingUser.email}`);
            return {
                user: existingUser,
                isNewUser: false,
            };
        }
        // 2️⃣ إنشاء مستخدم جديد
        console.log(`[UserService] Creating new user: ${normalizedEmail}`);
        // توليد كلمة مرور عشوائية آمنة
        const temporaryPassword = (0, license_key_generator_1.generateSecurePassword)(16);
        const passwordHash = yield argon2_1.default.hash(temporaryPassword);
        // توليد مفاتيح RSA للمستخدم
        const rsaKey = new node_rsa_1.default({ b: 2048 });
        const publicKey = rsaKey.exportKey('public');
        const privateKey = rsaKey.exportKey('private');
        // توليد معرف مستخدم أنيق وآمن بـ NanoID
        const userID = (0, nanoid_1.generateUserID)();
        // إنشاء المستخدم
        const newUser = yield prisma.user.create({
            data: {
                userID,
                email: normalizedEmail,
                phone: phone !== null && phone !== void 0 ? phone : null,
                isEmailVerified: false,
                passwordHash,
                rsaPublicKey: publicKey,
                rsaPrivateKey: privateKey,
                marketingEmails: false,
                isAdmin: false,
            },
        });
        console.log(`[UserService] User created successfully: ${newUser.id}`);
        return {
            user: newUser,
            isNewUser: true,
            temporaryPassword,
        };
    });
}
exports.createOrFindUser = createOrFindUser;
/**
 * 📧 تفعيل البريد الإلكتروني
 */
function verifyUserEmail(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield prisma.user.update({
            where: { id: userId },
            data: {
                isEmailVerified: true,
                updatedAt: new Date(),
            },
        });
        console.log(`[UserService] Email verified for user: ${user.email}`);
        return user;
    });
}
exports.verifyUserEmail = verifyUserEmail;
/**
 * 🔐 تحديث كلمة المرور
 */
function updateUserPassword(userId, newPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        const passwordHash = yield argon2_1.default.hash(newPassword);
        yield prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash,
                updatedAt: new Date(),
            },
        });
        console.log(`[UserService] Password updated for user ID: ${userId}`);
        return true;
    });
}
exports.updateUserPassword = updateUserPassword;
/**
 * 👤 الحصول على معلومات المستخدم بالبريد
 */
function getUserByEmail(email) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });
    });
}
exports.getUserByEmail = getUserByEmail;
/**
 * 👤 الحصول على معلومات المستخدم بالـ ID
 */
function getUserById(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma.user.findUnique({
            where: { id: userId },
        });
    });
}
exports.getUserById = getUserById;
/**
 * 📊 إحصائيات المستخدمين
 */
function getUserStats() {
    return __awaiter(this, void 0, void 0, function* () {
        const totalUsers = yield prisma.user.count();
        const verifiedUsers = yield prisma.user.count({
            where: { isEmailVerified: true },
        });
        const unverifiedUsers = totalUsers - verifiedUsers;
        return {
            totalUsers,
            verifiedUsers,
            unverifiedUsers,
            verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0,
        };
    });
}
exports.getUserStats = getUserStats;
/**
 * 🔍 البحث عن المستخدمين
 */
function searchUsers(query, limit = 10) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma.user.findMany({
            where: {
                OR: [
                    { email: { contains: query } },
                    { phone: { contains: query } },
                ],
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
    });
}
exports.searchUsers = searchUsers;
/**
 * 🗑️ حذف مستخدم (Admin only)
 */
function deleteUser(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield prisma.user.delete({
                where: { id: userId },
            });
            console.log(`[UserService] User deleted: ${userId}`);
            return true;
        }
        catch (error) {
            console.error(`[UserService] Error deleting user ${userId}:`, error);
            return false;
        }
    });
}
exports.deleteUser = deleteUser;
/**
 * ✏️ تحديث معلومات المستخدم
 */
function updateUserProfile(userId, data) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma.user.update({
            where: { id: userId },
            data: Object.assign(Object.assign({}, data), { updatedAt: new Date() }),
        });
    });
}
exports.updateUserProfile = updateUserProfile;
/**
 * 🔒 التحقق من كلمة المرور
 */
function verifyPassword(userId, password) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield prisma.user.findUnique({
            where: { id: userId },
            select: { passwordHash: true },
        });
        if (!user || !user.passwordHash) {
            return false;
        }
        try {
            return yield argon2_1.default.verify(user.passwordHash, password);
        }
        catch (error) {
            console.error('[UserService] Password verification error:', error);
            return false;
        }
    });
}
exports.verifyPassword = verifyPassword;
/**
 * 📧 تحديث البريد الإلكتروني
 * (يتطلب التحقق مرة أخرى)
 */
function updateUserEmail(userId, newEmail) {
    return __awaiter(this, void 0, void 0, function* () {
        const normalizedEmail = newEmail.toLowerCase().trim();
        // التحقق من أن البريد غير مستخدم
        const existingUser = yield prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (existingUser && existingUser.id !== userId) {
            throw new Error('Email already in use');
        }
        return yield prisma.user.update({
            where: { id: userId },
            data: {
                email: normalizedEmail,
                isEmailVerified: false,
                updatedAt: new Date(),
            },
        });
    });
}
exports.updateUserEmail = updateUserEmail;
/**
 * 📱 تحديث رقم الهاتف
 */
function updateUserPhone(userId, phone) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma.user.update({
            where: { id: userId },
            data: {
                phone,
                updatedAt: new Date(),
            },
        });
    });
}
exports.updateUserPhone = updateUserPhone;
/**
 * 👥 الحصول على قائمة المستخدمين (Admin)
 */
function listUsers(page = 1, limit = 50, filters) {
    return __awaiter(this, void 0, void 0, function* () {
        const skip = (page - 1) * limit;
        const where = {};
        if ((filters === null || filters === void 0 ? void 0 : filters.verified) !== undefined) {
            where.isEmailVerified = filters.verified;
        }
        if ((filters === null || filters === void 0 ? void 0 : filters.admin) !== undefined) {
            where.isAdmin = filters.admin;
        }
        const [users, total] = yield Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: {
                            licenses: true,
                            paymentLicenses: true,
                        },
                    },
                },
            }),
            prisma.user.count({ where }),
        ]);
        return {
            users,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    });
}
exports.listUsers = listUsers;
