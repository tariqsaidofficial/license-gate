"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidUUID = exports.generateUUID = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generate a unique UUID v4
 * This is used for user identification across the system
 */
function generateUUID() {
    return crypto_1.default.randomUUID();
}
exports.generateUUID = generateUUID;
/**
 * Validate UUID format
 */
function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}
exports.isValidUUID = isValidUUID;
