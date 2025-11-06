import * as argon2 from 'argon2';
import NodeRSA from 'node-rsa';
import { z } from "zod";
import { prisma } from "../prisma";
import { protectedProcedure, router } from "../trpc";
import { ShowError } from "../utils/ShowError";
import { generateSecurePassword } from "../utils/license-key-generator";
import { sendMail } from "../utils/mailer";
import { generateUserID } from "../utils/nanoid";

// Helper function to check admin access
const requireAdmin = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true }
  });
  
  if (!user?.isAdmin) {
    throw new ShowError("Admin access required", "unauthorized");
  }
};

export const adminRouter = router({
  // Get all users with statistics
  users: protectedProcedure.query(async ({ ctx }) => {
    await requireAdmin(ctx.userId);
    
    const users = await prisma.user.findMany({
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
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const [licenseCount, apiKeyCount] = await Promise.all([
          prisma.license.count({
            where: { userId: user.id, active: true }
          }),
          prisma.apiKey.count({
            where: { userId: user.id }
          })
        ]);

        return {
          ...user,
          currentLicenses: licenseCount,
          currentApiKeys: apiKeyCount
        };
      })
    );

    return usersWithCounts;
  }),

  // Get dashboard KPIs
  dashboardStats: protectedProcedure.query(async ({ ctx }) => {
    await requireAdmin(ctx.userId);
    
    const [totalUsers, activeUsers, totalLicenses, activeLicenses, totalApiKeys] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.license.count(),
      prisma.license.count({ where: { active: true } }),
      prisma.apiKey.count()
    ]);

    return {
      totalUsers,
      activeUsers,
      totalLicenses,
      activeLicenses,
      totalApiKeys
    };
  }),

  // Create new user
  createUser: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      fullName: z.string().min(1, "Full name is required"),
      company: z.string().optional(),
      isAdmin: z.boolean().default(false),
      maxLicenses: z.number().min(0).default(10),
      maxApiKeys: z.number().min(0).default(5),
      isActive: z.boolean().default(true)
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.userId);

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email }
      });

      if (existingUser) {
        throw new ShowError("User with this email already exists", "email-already-in-use");
      }

      // Generate secure password and user ID
      const temporaryPassword = generateSecurePassword(12);
      const passwordHash = await argon2.hash(temporaryPassword);
      const userID = generateUserID();

      // Generate RSA keys
      const rsaKey = new NodeRSA({ b: 2048 });
      const publicKey = rsaKey.exportKey('public');
      const privateKey = rsaKey.exportKey('private');

      // Create user
      const newUser = await prisma.user.create({
        data: {
          userID,
          email: input.email,
          fullName: input.fullName,
          company: input.company,
          passwordHash,
          isEmailVerified: true, // Auto-verify for admin-created users
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
        await sendMail(
          input.email,
          "Welcome to LicenseGate - Your Account Details",
          "verify-email", // Using verify-email template as placeholder
          {
            email: input.email,
            password: temporaryPassword,
            userId: userID,
            company: input.company || '',
            maxLicenses: input.maxLicenses.toString(),
            maxApiKeys: input.maxApiKeys.toString(),
            loginUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
          }
        );
      } catch (error) {
        console.error('Failed to send welcome email:', error);
        // Don't fail the user creation if email fails
      }

      return {
        ...newUser,
        temporaryPassword // Return for admin to see
      };
    }),

  // Update user
  updateUser: protectedProcedure
    .input(z.object({
      userID: z.string(),
      fullName: z.string().optional(),
      company: z.string().optional(),
      isAdmin: z.boolean().optional(),
      maxLicenses: z.number().min(0).optional(),
      maxApiKeys: z.number().min(0).optional(),
      isActive: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.userId);

      const { userID, ...updateData } = input;

      const updatedUser = await prisma.user.update({
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
    }),

  // Reset user password
  resetUserPassword: protectedProcedure
    .input(z.object({
      userID: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        await requireAdmin(ctx.userId);

        const user = await prisma.user.findUnique({
          where: { userID: input.userID },
          select: { email: true, company: true }
        });

        if (!user) {
          throw new ShowError("User not found", "not-found");
        }

        // Generate new password
        const newPassword = generateSecurePassword(12);
        const passwordHash = await argon2.hash(newPassword);

        // Update password
        await prisma.user.update({
          where: { userID: input.userID },
          data: { passwordHash }
        });

        // Send password reset email
        try {
          await sendMail(
            user.email,
            "LicenseGate - Password Reset",
            "reset-password",
            {
              email: user.email,
              password: newPassword,
              loginUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
            }
          );
        } catch (emailError) {
          console.error('Failed to send password reset email:', emailError);
          // Don't fail the password reset if email fails
        }

        return {
          success: true,
          message: "Password reset successfully",
          newPassword // Return for admin to see
        };
      } catch (error) {
        console.error('Error in resetUserPassword:', error);
        if (error instanceof ShowError) {
          throw error;
        }
        throw new ShowError("Failed to reset password", "internal-error");
      }
    }),

  // Toggle user active status
  toggleUserStatus: protectedProcedure
    .input(z.object({
      userID: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.userId);

      const user = await prisma.user.findUnique({
        where: { userID: input.userID }
      });

      if (!user) {
        throw new ShowError("User not found", "not-found");
      }

      const updatedUser = await prisma.user.update({
        where: { userID: input.userID },
        data: { isActive: !user.isActive },
        select: {
          userID: true,
          email: true,
          isActive: true
        }
      });

      return updatedUser;
    }),

  // Delete user (admin only)
  deleteUser: protectedProcedure
    .input(z.object({
      userID: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.userId);

      // Prevent admin from deleting themselves
      const currentUser = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { userID: true }
      });

      if (currentUser?.userID === input.userID) {
        throw new ShowError("Cannot delete your own account", "unauthorized");
      }

      const user = await prisma.user.findUnique({
        where: { userID: input.userID }
      });

      if (!user) {
        throw new ShowError("User not found", "not-found");
      }

      // Delete user and all related data (cascade delete)
      await prisma.user.delete({
        where: { userID: input.userID }
      });

      return { success: true, message: "User deleted successfully" };
    }),

  // Set custom user password
  setUserPassword: protectedProcedure
    .input(z.object({
      userID: z.string(),
      newPassword: z.string().min(6, "Password must be at least 6 characters"),
      confirmPassword: z.string().optional()
    }).refine((data) => !data.confirmPassword || data.newPassword === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"]
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        await requireAdmin(ctx.userId);

        // Validate password strength
        if (input.newPassword.length < 8) {
          throw new ShowError("Password must be at least 8 characters long", "validation-error");
        }

        const user = await prisma.user.findUnique({
          where: { userID: input.userID },
          select: { email: true, fullName: true, company: true }
        });

        if (!user) {
          throw new ShowError("User not found", "not-found");
        }

        // Hash the custom password
        const passwordHash = await argon2.hash(input.newPassword);

        // Update password
        await prisma.user.update({
          where: { userID: input.userID },
          data: { passwordHash }
        });

        // Send password notification email
        try {
          await sendMail(
            user.email,
            "LicenseGate - Password Updated",
            "reset-password",
            {
              email: user.email,
              password: input.newPassword,
              loginUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
            }
          );
        } catch (emailError) {
          console.error('Failed to send password notification email:', emailError);
          // Don't fail the password update if email fails
        }

        return {
          success: true,
          message: "Password updated successfully",
          newPassword: input.newPassword
        };
      } catch (error) {
        console.error('Error in setUserPassword:', error);
        if (error instanceof ShowError) {
          throw error;
        }
        throw new ShowError("Failed to update password", "internal-error");
      }
    })
});
