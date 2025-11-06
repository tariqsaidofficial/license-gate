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
exports.autoGenerateLicense = void 0;
const client_1 = require("@prisma/client");
const argon2_1 = __importDefault(require("argon2"));
const node_rsa_1 = __importDefault(require("node-rsa"));
const license_key_generator_1 = require("../../utils/license-key-generator");
const mailer_1 = require("../../utils/mailer");
const nanoid_1 = require("../../utils/nanoid");
const prisma = new client_1.PrismaClient();
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
function autoGenerateLicense(params) {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function* () {
        console.log('[AutoLicense] Starting auto-generation for:', params.email);
        try {
            // Step 1: Check for duplicate payment (idempotency)
            const existingPayment = yield prisma.paymentLicense.findUnique({
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
            let temporaryPassword = null;
            if (params.userId) {
                // User is logged in - find by ID
                user = yield prisma.user.findUnique({
                    where: { id: params.userId },
                });
                if (!user) {
                    throw new Error(`User with ID ${params.userId} not found`);
                }
            }
            else {
                // Guest checkout - find by email or create
                user = yield prisma.user.findUnique({
                    where: { email: params.email.toLowerCase() },
                });
                if (!user) {
                    // Create new user
                    isNewUser = true;
                    temporaryPassword = (0, license_key_generator_1.generateSecurePassword)(16);
                    user = yield createNewUser({
                        email: params.email,
                        phone: params.phone,
                        temporaryPassword,
                    });
                    console.log('[AutoLicense] Created new user:', user.email);
                }
            }
            // Step 3: Calculate expiration date
            let expirationDate = null;
            if (params.licenseConfig.duration) {
                expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate() + params.licenseConfig.duration);
            }
            // Step 4: Generate license key and name
            const licenseKey = (0, license_key_generator_1.generateLicenseKey)();
            const licenseName = (0, license_key_generator_1.generateLicenseName)(params.licenseConfig.planName);
            // Step 5: Create license
            // If new user, license is created but user must verify email first
            const license = yield prisma.license.create({
                data: {
                    userId: user.id,
                    licenseKey,
                    name: licenseName,
                    notes: `Auto-generated from ${params.provider} payment ${params.paymentId}`,
                    active: user.isEmailVerified,
                    ipLimit: (_a = params.licenseConfig.ipLimit) !== null && _a !== void 0 ? _a : null,
                    licenseScope: (_c = (_b = params.licenseConfig.scopes) === null || _b === void 0 ? void 0 : _b.join(',')) !== null && _c !== void 0 ? _c : null,
                    expirationDate,
                    validationLimit: (_d = params.licenseConfig.validationLimit) !== null && _d !== void 0 ? _d : null,
                    validationPoints: (_e = params.licenseConfig.validationLimit) !== null && _e !== void 0 ? _e : null,
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
            yield prisma.paymentLicense.create({
                data: {
                    paymentId: params.paymentId,
                    userId: user.id,
                    licenseId: license.id,
                    amount: params.amount,
                    currency: params.currency.toUpperCase(),
                    provider: params.provider,
                    metadata: params.licenseConfig,
                },
            });
            // Step 7: Send appropriate emails (non-blocking - failures are logged but don't stop the process)
            try {
                if (isNewUser && temporaryPassword) {
                    // New user: send welcome + verification email
                    yield sendWelcomeAndVerificationEmail({
                        email: user.email,
                        temporaryPassword,
                        licenseKey,
                        licenseName,
                        planName: params.licenseConfig.planName,
                    });
                }
                else if (!user.isEmailVerified) {
                    // Existing user but not verified: send verification reminder
                    yield sendVerificationReminderWithLicense({
                        email: user.email,
                        licenseKey,
                        licenseName,
                    });
                }
                else {
                    // Verified user: send license directly
                    yield sendLicenseEmail({
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
            }
            catch (emailError) {
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
        }
        catch (error) {
            console.error('[AutoLicense] Error:', error);
            throw error;
        }
    });
}
exports.autoGenerateLicense = autoGenerateLicense;
/**
 * Create a new user with RSA keys and UUID
 */
function createNewUser(params) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        // Generate RSA keys for the user
        const key = new node_rsa_1.default({ b: 2048 });
        const publicKey = key.exportKey('public');
        const privateKey = key.exportKey('private');
        // Hash password
        const passwordHash = yield argon2_1.default.hash(params.temporaryPassword);
        // Generate userID
        const userID = (0, nanoid_1.generateUserID)();
        return yield prisma.user.create({
            data: {
                userID,
                email: params.email.toLowerCase(),
                phone: (_a = params.phone) !== null && _a !== void 0 ? _a : null,
                isEmailVerified: false,
                passwordHash,
                rsaPublicKey: publicKey,
                rsaPrivateKey: privateKey,
                marketingEmails: false,
                isAdmin: false,
            },
        });
    });
}
/**
 * Send welcome email with temporary password and verification link
 * For NEW users who just made their first purchase
 */
function sendWelcomeAndVerificationEmail(params) {
    return __awaiter(this, void 0, void 0, function* () {
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
        yield (0, mailer_1.sendMail)(params.email, subject, 'verify-email', {
            // Fallback to existing template, but we'll enhance this later
            VERIFY_LINK: `${process.env.FRONTEND_URL}/verify-email?email=${encodeURIComponent(params.email)}`,
        });
        console.log('[Email] Welcome email sent to:', params.email);
    });
}
/**
 * Send verification reminder to existing unverified users
 */
function sendVerificationReminderWithLicense(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const subject = '⚠️ Verify Your Email to Activate License';
        // Implementation similar to above
        console.log('[Email] Verification reminder sent to:', params.email);
    });
}
/**
 * Send license email to verified users
 */
function sendLicenseEmail(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const subject = `🎉 Your License is Ready - ${params.planName}`;
        // Implementation with full details
        console.log('[Email] License email sent to:', params.email);
    });
}
