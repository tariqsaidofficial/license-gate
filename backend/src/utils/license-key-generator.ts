import * as crypto from 'crypto';

/**
 * Generate a unique license key
 * Format: XXXX-XXXX-XXXX-XXXX (4 segments of 4 characters each)
 * 
 * @returns License key string
 * @example "A1B2-C3D4-E5F6-G7H8"
 */
export function generateLicenseKey(): string {
  const segments: string[] = [];
  
  for (let i = 0; i < 4; i++) {
    const segment = crypto
      .randomBytes(2)
      .toString('hex')
      .toUpperCase();
    segments.push(segment);
  }
  
  return segments.join('-');
}

/**
 * Validate license key format
 * 
 * @param key - License key to validate
 * @returns true if valid format, false otherwise
 */
export function validateLicenseKeyFormat(key: string): boolean {
  const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(key);
}

/**
 * Generate a secure random password
 * Contains uppercase, lowercase, numbers, and special characters
 * 
 * @param length - Password length (default 16)
 * @returns Secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + special;
  let password = '';
  
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Generate license name based on plan and date
 * Format: Plan-Name-YYYYMMDD
 * 
 * @param planName - Name of the plan (e.g., "Pro-Plan", "14-Day-Trial")
 * @param date - Date object (defaults to now)
 * @returns Formatted license name
 * @example "Pro-Plan-20251105"
 */
export function generateLicenseName(planName: string, date: Date = new Date()): string {
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  // Format: YYYYMMDD
  
  const cleanPlanName = planName.replace(/[^a-zA-Z0-9-]/g, '-');
  return `${cleanPlanName}-${dateStr}`;
}
