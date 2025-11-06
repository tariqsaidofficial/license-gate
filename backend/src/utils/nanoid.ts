import { customAlphabet, nanoid } from 'nanoid';

/**
 * Generate a secure and elegant user ID using NanoID
 * 
 * Features:
 * - URL-safe characters only
 * - No confusion characters (0, O, I, l)
 * - 16 characters for good security and readability
 * - Safe for display in UI and emails
 */
export function generateUserID(): string {
  // Custom alphabet excluding confusing characters
  const alphabet = '123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const generateID = customAlphabet(alphabet, 16);
  return generateID();
}

/**
 * Generate a shorter ID for display purposes (8 characters)
 */
export function generateShortID(): string {
  const alphabet = '123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const generateID = customAlphabet(alphabet, 8);
  return generateID();
}

/**
 * Generate standard NanoID (21 characters, default)
 */
export function generateStandardID(): string {
  return nanoid();
}

/**
 * Validate if a string looks like our custom user ID format
 */
export function isValidUserID(id: string): boolean {
  // Should be 16 characters, alphanumeric without confusing chars
  const pattern = /^[123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{16}$/;
  return pattern.test(id);
}
