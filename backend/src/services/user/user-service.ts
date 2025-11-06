import { PrismaClient, User } from '@prisma/client';
import argon2 from 'argon2';
import NodeRSA from 'node-rsa';
import { generateSecurePassword } from '../../utils/license-key-generator';
import { generateUserID } from '../../utils/nanoid';

const prisma = new PrismaClient();

export interface CreateUserResult {
  user: User;
  isNewUser: boolean;
  temporaryPassword?: string;
}

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
export async function createOrFindUser(
  email: string,
  phone?: string
): Promise<CreateUserResult> {
  const normalizedEmail = email.toLowerCase().trim();

  // 1️⃣ محاولة إيجاد المستخدم الموجود
  const existingUser = await prisma.user.findUnique({
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
  const temporaryPassword = generateSecurePassword(16);
  const passwordHash = await argon2.hash(temporaryPassword);

  // توليد مفاتيح RSA للمستخدم
  const rsaKey = new NodeRSA({ b: 2048 });
  const publicKey = rsaKey.exportKey('public');
  const privateKey = rsaKey.exportKey('private');

  // توليد معرف مستخدم أنيق وآمن بـ NanoID
  const userID = generateUserID();

  // إنشاء المستخدم
  const newUser = await prisma.user.create({
    data: {
      userID,
      email: normalizedEmail,
      phone: phone ?? null,
      isEmailVerified: false, // يحتاج للتحقق
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
}

/**
 * 📧 تفعيل البريد الإلكتروني
 */
export async function verifyUserEmail(userId: number): Promise<User> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      isEmailVerified: true,
      updatedAt: new Date(),
    },
  });

  console.log(`[UserService] Email verified for user: ${user.email}`);
  return user;
}

/**
 * 🔐 تحديث كلمة المرور
 */
export async function updateUserPassword(
  userId: number,
  newPassword: string
): Promise<boolean> {
  const passwordHash = await argon2.hash(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      updatedAt: new Date(),
    },
  });

  console.log(`[UserService] Password updated for user ID: ${userId}`);
  return true;
}

/**
 * 👤 الحصول على معلومات المستخدم بالبريد
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
}

/**
 * 👤 الحصول على معلومات المستخدم بالـ ID
 */
export async function getUserById(userId: number): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { id: userId },
  });
}

/**
 * 📊 إحصائيات المستخدمين
 */
export async function getUserStats() {
  const totalUsers = await prisma.user.count();
  const verifiedUsers = await prisma.user.count({
    where: { isEmailVerified: true },
  });
  const unverifiedUsers = totalUsers - verifiedUsers;

  return {
    totalUsers,
    verifiedUsers,
    unverifiedUsers,
    verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0,
  };
}

/**
 * 🔍 البحث عن المستخدمين
 */
export async function searchUsers(query: string, limit = 10) {
  return await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: query } },
        { phone: { contains: query } },
      ],
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * 🗑️ حذف مستخدم (Admin only)
 */
export async function deleteUser(userId: number): Promise<boolean> {
  try {
    await prisma.user.delete({
      where: { id: userId },
    });
    console.log(`[UserService] User deleted: ${userId}`);
    return true;
  } catch (error) {
    console.error(`[UserService] Error deleting user ${userId}:`, error);
    return false;
  }
}

/**
 * ✏️ تحديث معلومات المستخدم
 */
export async function updateUserProfile(
  userId: number,
  data: {
    phone?: string;
    marketingEmails?: boolean;
  }
): Promise<User> {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

/**
 * 🔒 التحقق من كلمة المرور
 */
export async function verifyPassword(
  userId: number,
  password: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user || !user.passwordHash) {
    return false;
  }

  try {
    return await argon2.verify(user.passwordHash, password);
  } catch (error) {
    console.error('[UserService] Password verification error:', error);
    return false;
  }
}

/**
 * 📧 تحديث البريد الإلكتروني
 * (يتطلب التحقق مرة أخرى)
 */
export async function updateUserEmail(
  userId: number,
  newEmail: string
): Promise<User> {
  const normalizedEmail = newEmail.toLowerCase().trim();

  // التحقق من أن البريد غير مستخدم
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser && existingUser.id !== userId) {
    throw new Error('Email already in use');
  }

  return await prisma.user.update({
    where: { id: userId },
    data: {
      email: normalizedEmail,
      isEmailVerified: false, // يحتاج التحقق مرة أخرى
      updatedAt: new Date(),
    },
  });
}

/**
 * 📱 تحديث رقم الهاتف
 */
export async function updateUserPhone(
  userId: number,
  phone: string
): Promise<User> {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      phone,
      updatedAt: new Date(),
    },
  });
}

/**
 * 👥 الحصول على قائمة المستخدمين (Admin)
 */
export async function listUsers(
  page = 1,
  limit = 50,
  filters?: {
    verified?: boolean;
    admin?: boolean;
  }
) {
  const skip = (page - 1) * limit;
  const where: any = {};

  if (filters?.verified !== undefined) {
    where.isEmailVerified = filters.verified;
  }

  if (filters?.admin !== undefined) {
    where.isAdmin = filters.admin;
  }

  const [users, total] = await Promise.all([
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
}
