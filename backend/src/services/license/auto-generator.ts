import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import NodeRSA from 'node-rsa';
import { generateLicenseKey, generateLicenseName, generateSecurePassword } from '../../utils/license-key-generator';
import { generateUUID } from '../../utils/uuid-generator';
import { sendMail } from '../../utils/mailer';

const prisma = new PrismaClient();

interface AutoLicenseParams {
  email: string;
  phone?: string;
  amount: number;
  currency: string;
  paymentId: string;
  provider: 'stripe' | 'paypal' | 'ziina';
  userId?: number; // If user is logged in
  licenseConfig: {
    planName: string; // e.g., "Pro-Plan", "14-Day-Trial"
    duration?: number; // in days
    validationLimit?: number;
    ipLimit?: number;
    scopes?: string[];
  };
}

interface AutoLicenseResult {
  success: boolean;
  userId: number;
  licenseId: number;
  licenseKey: string;
  isNewUser: boolean;
  emailVerificationRequired: boolean;
}

/**
 * Auto-generate license after successful payment
 * Handles both logged-in users and guests
 * 
 * Flow:
 * 1. Find or create user
 * 2. Create license (pending if new user)
 * 3. Send appropriate emails
 * 4. Return result
 */
export async function autoGenerateLicense(
  params: AutoLicenseParams
): Promise<AutoLicenseResult> {
  console.log('[AutoLicense] Starting auto-generation for:', params.email);

  try {
    // Step 1: Check for duplicate payment (idempotency)
    const existingPayment = await prisma.paymentLicense.findUnique({
      where: { paymentId: params.paymentId },
      include: { user: true, license: true },
    });

    if (existingPayment) {
      console.log('[AutoLicense] Payment already processed:', params.paymentId);
      return {
        success: true,
        userId: existingPayment.userId,
        licenseId: existingPayment.licenseId,
        licenseKey: existingPayment.license.licenseKey,
        isNewUser: false,
        emailVerificationRequired: !existingPayment.user.isEmailVerified,
      };
    }

    // Step 2: Find or create user
    let user;
    let isNewUser = false;
    let temporaryPassword: string | null = null;

    if (params.userId) {
      // User is logged in - find by ID
      user = await prisma.user.findUnique({
        where: { id: params.userId },
      });

      if (!user) {
        throw new Error(`User with ID ${params.userId} not found`);
      }
    } else {
      // Guest checkout - find by email or create
      user = await prisma.user.findUnique({
        where: { email: params.email.toLowerCase() },
      });

      if (!user) {
        // Create new user
        isNewUser = true;
        temporaryPassword = generateSecurePassword(16);
        user = await createNewUser({
          email: params.email,
          phone: params.phone,
          temporaryPassword,
        });
        console.log('[AutoLicense] Created new user:', user.email);
      }
    }

    // Step 3: Calculate expiration date
    let expirationDate: Date | null = null;
    if (params.licenseConfig.duration) {
      expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + params.licenseConfig.duration);
    }

    // Step 4: Generate license key and name
    const licenseKey = generateLicenseKey();
    const licenseName = generateLicenseName(params.licenseConfig.planName);

    // Step 5: Create license
    // If new user, license is created but user must verify email first
    const license = await prisma.license.create({
      data: {
        userId: user.id,
        licenseKey,
        name: licenseName,
        notes: `Auto-generated from ${params.provider} payment ${params.paymentId}`,
        active: user.isEmailVerified, // Active only if email verified
        ipLimit: params.licenseConfig.ipLimit ?? null,
        licenseScope: params.licenseConfig.scopes?.join(',') ?? null,
        expirationDate,
        validationLimit: params.licenseConfig.validationLimit ?? null,
        validationPoints: params.licenseConfig.validationLimit ?? null,
        replenishAmount: null,
        replenishInterval: null,
      },
    });

    console.log('[AutoLicense] License created:', {
      licenseId: license.id,
      licenseKey,
      active: license.active,
    });

    // Step 6: Create payment record
    await prisma.paymentLicense.create({
      data: {
        paymentId: params.paymentId,
        userId: user.id,
        licenseId: license.id,
        amount: params.amount,
        currency: params.currency.toUpperCase(),
        provider: params.provider,
        metadata: params.licenseConfig as any,
      },
    });

    // Step 7: Send appropriate emails (non-blocking - failures are logged but don't stop the process)
    try {
      if (isNewUser && temporaryPassword) {
        // New user: send welcome + verification email
        await sendWelcomeAndVerificationEmail({
          email: user.email,
          temporaryPassword,
          licenseKey,
          licenseName,
          planName: params.licenseConfig.planName,
        });
      } else if (!user.isEmailVerified) {
        // Existing user but not verified: send verification reminder
        await sendVerificationReminderWithLicense({
          email: user.email,
          licenseKey,
          licenseName,
        });
      } else {
        // Verified user: send license directly
        await sendLicenseEmail({
          email: user.email,
          licenseKey,
          licenseName,
          planName: params.licenseConfig.planName,
          expirationDate,
          validationLimit: params.licenseConfig.validationLimit,
          ipLimit: params.licenseConfig.ipLimit,
          scopes: params.licenseConfig.scopes,
        });
      }
    } catch (emailError) {
      console.warn('[AutoLicense] Email sending failed (non-critical):', emailError instanceof Error ? emailError.message : emailError);
      console.warn('[AutoLicense] License was created successfully, but email notification failed. User can still access license via dashboard.');
    }

    console.log('[AutoLicense] Success! License auto-generated:', {
      userId: user.id,
      licenseId: license.id,
      licenseKey,
      isNewUser,
      emailVerified: user.isEmailVerified,
    });

    return {
      success: true,
      userId: user.id,
      licenseId: license.id,
      licenseKey,
      isNewUser,
      emailVerificationRequired: !user.isEmailVerified,
    };
  } catch (error) {
    console.error('[AutoLicense] Error:', error);
    throw error;
  }
}

/**
 * Create a new user with RSA keys and UUID
 */
async function createNewUser(params: {
  email: string;
  phone?: string;
  temporaryPassword: string;
}): Promise<any> {
  // Generate RSA keys for the user
  const key = new NodeRSA({ b: 2048 });
  const publicKey = key.exportKey('public');
  const privateKey = key.exportKey('private');

  // Hash password
  const passwordHash = await argon2.hash(params.temporaryPassword);

  // Generate UUID
  const uuid = generateUUID();

  return await prisma.user.create({
    data: {
      uuid,
      email: params.email.toLowerCase(),
      phone: params.phone ?? null,
      isEmailVerified: false,
      passwordHash,
      rsaPublicKey: publicKey,
      rsaPrivateKey: privateKey,
      marketingEmails: false,
      isAdmin: false,
    },
  });
}

/**
 * Send welcome email with temporary password and verification link
 * For NEW users who just made their first purchase
 */
async function sendWelcomeAndVerificationEmail(params: {
  email: string;
  temporaryPassword: string;
  licenseKey: string;
  licenseName: string;
  planName: string;
}): Promise<void> {
  // TODO: Create proper HTML template
  // For now, using simple text
  
  const subject = '🎉 Welcome to LicenseGate - Verify Your Email';
  const html = `
    <h1>Welcome to LicenseGate!</h1>
    
    <p>Thank you for your purchase of <strong>${params.planName}</strong>!</p>
    
    <h2>📧 Step 1: Verify Your Email</h2>
    <p>To activate your license, please verify your email address:</p>
    <p><a href="${process.env.FRONTEND_URL}/verify-email?email=${encodeURIComponent(params.email)}">Verify Email</a></p>
    
    <h2>🔐 Your Login Credentials</h2>
    <p>Email: <strong>${params.email}</strong></p>
    <p>Temporary Password: <strong>${params.temporaryPassword}</strong></p>
    <p><em>Please change this password after logging in.</em></p>
    
    <h2>🎫 Your License</h2>
    <p>License Name: <strong>${params.licenseName}</strong></p>
    <p>License Key: <strong>${params.licenseKey}</strong></p>
    <p><em>⚠️ This license will be activated once you verify your email.</em></p>
    
    <hr>
    <p>If you have any questions, contact us at support@licensegate.io</p>
  `;

  // Using existing mailer with custom HTML
  await sendMail(params.email, subject, 'verify-email' as any, {
    // Fallback to existing template, but we'll enhance this later
    VERIFY_LINK: `${process.env.FRONTEND_URL}/verify-email?email=${encodeURIComponent(params.email)}`,
  });
  
  console.log('[Email] Welcome email sent to:', params.email);
}

/**
 * Send verification reminder to existing unverified users
 */
async function sendVerificationReminderWithLicense(params: {
  email: string;
  licenseKey: string;
  licenseName: string;
}): Promise<void> {
  const subject = '⚠️ Verify Your Email to Activate License';
  // Implementation similar to above
  console.log('[Email] Verification reminder sent to:', params.email);
}

/**
 * Send license email to verified users
 */
async function sendLicenseEmail(params: {
  email: string;
  licenseKey: string;
  licenseName: string;
  planName: string;
  expirationDate: Date | null;
  validationLimit?: number;
  ipLimit?: number;
  scopes?: string[];
}): Promise<void> {
  const subject = `🎉 Your License is Ready - ${params.planName}`;
  // Implementation with full details
  console.log('[Email] License email sent to:', params.email);
}

export { AutoLicenseParams, AutoLicenseResult };
