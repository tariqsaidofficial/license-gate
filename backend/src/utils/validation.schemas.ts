import { z } from 'zod';

/**
 * Validation Schemas for Settings Management
 * Centralized validation rules using Zod for all setting categories
 */

// ========================================
// SMTP Settings Validation Schema
// ========================================
export const smtpSettingsSchema = z.object({
  host: z.string()
    .min(1, "SMTP host is required")
    .max(255, "SMTP host is too long"),
  
  port: z.number()
    .int("Port must be an integer")
    .min(1, "Port must be at least 1")
    .max(65535, "Port must be at most 65535"),
  
  username: z.string()
    .min(1, "Username is required")
    .email("Username must be a valid email address"),
  
  password: z.string()
    .min(1, "Password is required"),
  
  sender: z.string()
    .min(1, "Sender is required")
    .email("Sender must be a valid email address"),
  
  secure: z.boolean()
    .default(true)
    .describe("Use TLS/SSL for SMTP connection")
});

export type SmtpSettingsInput = z.infer<typeof smtpSettingsSchema>;

// ========================================
// OAuth Settings Validation Schema
// ========================================
export const oauthSettingsSchema = z.object({
  googleClientId: z.string()
    .min(1, "Google Client ID cannot be empty")
    .optional()
    .or(z.literal('')),
  
  googleClientSecret: z.string()
    .min(1, "Google Client Secret cannot be empty")
    .optional()
    .or(z.literal('')),
  
  githubClientId: z.string()
    .min(1, "GitHub Client ID cannot be empty")
    .optional()
    .or(z.literal('')),
  
  githubClientSecret: z.string()
    .min(1, "GitHub Client Secret cannot be empty")
    .optional()
    .or(z.literal(''))
}).refine(
  (data) => {
    // If Google Client ID is provided, Client Secret must also be provided
    if (data.googleClientId && data.googleClientId !== '') {
      return data.googleClientSecret && data.googleClientSecret !== '';
    }
    return true;
  },
  {
    message: "Google Client Secret is required when Client ID is provided",
    path: ["googleClientSecret"]
  }
).refine(
  (data) => {
    // If Google Client Secret is provided, Client ID must also be provided
    if (data.googleClientSecret && data.googleClientSecret !== '') {
      return data.googleClientId && data.googleClientId !== '';
    }
    return true;
  },
  {
    message: "Google Client ID is required when Client Secret is provided",
    path: ["googleClientId"]
  }
).refine(
  (data) => {
    // If GitHub Client ID is provided, Client Secret must also be provided
    if (data.githubClientId && data.githubClientId !== '') {
      return data.githubClientSecret && data.githubClientSecret !== '';
    }
    return true;
  },
  {
    message: "GitHub Client Secret is required when Client ID is provided",
    path: ["githubClientSecret"]
  }
).refine(
  (data) => {
    // If GitHub Client Secret is provided, Client ID must also be provided
    if (data.githubClientSecret && data.githubClientSecret !== '') {
      return data.githubClientId && data.githubClientId !== '';
    }
    return true;
  },
  {
    message: "GitHub Client ID is required when Client Secret is provided",
    path: ["githubClientId"]
  }
);

export type OAuthSettingsInput = z.infer<typeof oauthSettingsSchema>;

// ========================================
// General Settings Validation Schema
// ========================================
export const generalSettingsSchema = z.object({
  siteName: z.string()
    .min(1, "Site name cannot be empty")
    .max(255, "Site name is too long")
    .optional(),
  
  supportEmail: z.string()
    .email("Support email must be a valid email address")
    .optional()
    .or(z.literal('')),
  
  maintenanceMode: z.boolean()
    .default(false)
    .optional(),
  
  registrationEnabled: z.boolean()
    .default(true)
    .optional()
});

export type GeneralSettingsInput = z.infer<typeof generalSettingsSchema>;

// ========================================
// Security Settings Validation Schema
// ========================================
export const securitySettingsSchema = z.object({
  sessionTimeout: z.number()
    .int("Session timeout must be an integer")
    .min(300, "Session timeout must be at least 5 minutes (300 seconds)")
    .max(86400, "Session timeout must be at most 24 hours (86400 seconds)")
    .optional(),
  
  maxLoginAttempts: z.number()
    .int("Max login attempts must be an integer")
    .min(1, "Max login attempts must be at least 1")
    .max(20, "Max login attempts must be at most 20")
    .optional(),
  
  passwordMinLength: z.number()
    .int("Password minimum length must be an integer")
    .min(6, "Password minimum length must be at least 6")
    .max(128, "Password minimum length must be at most 128")
    .optional(),
  
  requireTwoFactor: z.boolean()
    .default(false)
    .optional()
});

export type SecuritySettingsInput = z.infer<typeof securitySettingsSchema>;

// ========================================
// Test Email Input Schema
// ========================================
export const testEmailSchema = z.object({
  smtpSettings: smtpSettingsSchema,
  recipientEmail: z.string()
    .email("Invalid recipient email address"),
  templateData: z.object({
    siteName: z.string().optional(),
    userName: z.string().optional()
  }).optional()
});

export type TestEmailInput = z.infer<typeof testEmailSchema>;

// ========================================
// Settings Category Enum Schema
// ========================================
export const settingsCategorySchema = z.enum(['smtp', 'oauth', 'general', 'security']);

export type SettingsCategoryInput = z.infer<typeof settingsCategorySchema>;

// ========================================
// Validation Helper Functions
// ========================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate port number
 */
export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize sensitive data for logging
 */
export function sanitizeForLog(data: Record<string, any>): Record<string, any> {
  const sensitiveKeys = ['password', 'secret', 'key', 'token', 'clientSecret', 'privateKey'];
  const sanitized = { ...data };
  
  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive.toLowerCase()))) {
      sanitized[key] = '***REDACTED***';
    }
  }
  
  return sanitized;
}

/**
 * Convert settings object to string record (for database storage)
 */
export function convertToStringRecord(settings: Record<string, any>): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(settings)) {
    if (value !== undefined && value !== null) {
      result[key] = typeof value === 'string' ? value : String(value);
    }
  }
  
  return result;
}

/**
 * Parse settings from string record (from database)
 */
export function parseFromStringRecord<T extends Record<string, any>>(
  stringRecord: Record<string, string>,
  schema: z.ZodSchema<T>
): T {
  const parsed: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(stringRecord)) {
    // Try to parse booleans
    if (value === 'true') {
      parsed[key] = true;
    } else if (value === 'false') {
      parsed[key] = false;
    }
    // Try to parse numbers
    else if (!isNaN(Number(value)) && value !== '') {
      parsed[key] = Number(value);
    }
    // Keep as string
    else {
      parsed[key] = value;
    }
  }
  
  return schema.parse(parsed);
}

