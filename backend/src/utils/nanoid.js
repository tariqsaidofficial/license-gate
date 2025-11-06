"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidUserID = exports.generateStandardID = exports.generateShortID = exports.generateUserID = void 0;
const nanoid_1 = require("nanoid");
/**
 * Generate a secure and elegant user ID using NanoID
 *
 * Features:
 * - URL-safe characters only
 * - No confusion characters (0, O, I, l)
 * - 16 characters for good security and readability
 * - Safe for display in UI and emails
 */
function generateUserID() {
    // Custom alphabet excluding confusing characters
    const alphabet = '123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const generateID = (0, nanoid_1.customAlphabet)(alphabet, 16);
    return generateID();
}
exports.generateUserID = generateUserID;
/**
 * Generate a shorter ID for display purposes (8 characters)
 */
function generateShortID() {
    const alphabet = '123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const generateID = (0, nanoid_1.customAlphabet)(alphabet, 8);
    return generateID();
}
exports.generateShortID = generateShortID;
/**
 * Generate standard NanoID (21 characters, default)
 */
function generateStandardID() {
    return (0, nanoid_1.nanoid)();
}
exports.generateStandardID = generateStandardID;
/**
 * Validate if a string looks like our custom user ID format
 */
function isValidUserID(id) {
    // Should be 16 characters, alphanumeric without confusing chars
    const pattern = /^[123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{16}$/;
    return pattern.test(id);
}
exports.isValidUserID = isValidUserID;
