"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enhancedAuth = exports.EnhancedAuthenticator = void 0;
const jose_1 = require("jose");
const redis_1 = require("./redis");
const argon2 = __importStar(require("argon2"));
class EnhancedAuthenticator {
    constructor(secret) {
        this.accessTokenExpiry = '15m';
        this.refreshTokenExpiry = 30 * 24 * 60 * 60; // 30 days in seconds
        this.secret = new TextEncoder().encode(secret);
    }
    // Generate secure access token using Web Crypto
    generateAccessToken(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new jose_1.SignJWT({ userId: payload.userId })
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime(this.accessTokenExpiry)
                .setIssuer('license-gate')
                .setAudience('license-gate-client')
                .sign(this.secret);
        });
    }
    // Generate secure refresh token
    generateRefreshToken(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const refreshToken = yield new jose_1.SignJWT({ userId: payload.userId })
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime(`${this.refreshTokenExpiry}s`)
                .setIssuer('license-gate')
                .setAudience('license-gate-refresh')
                .sign(this.secret);
            // Store in Redis with automatic expiry
            yield redis_1.redisManager.setRefreshToken(payload.userId, refreshToken, 30);
            return refreshToken;
        });
    }
    // Verify access token
    verifyAccessToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { payload } = yield (0, jose_1.jwtVerify)(token, this.secret, {
                    issuer: 'license-gate',
                    audience: 'license-gate-client'
                });
                return {
                    success: true,
                    payload: {
                        userId: payload.userId,
                        iat: payload.iat,
                        exp: payload.exp
                    }
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Invalid token'
                };
            }
        });
    }
    // Verify and rotate refresh token
    verifyAndRotateRefreshToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Verify the refresh token
                const { payload } = yield (0, jose_1.jwtVerify)(token, this.secret, {
                    issuer: 'license-gate',
                    audience: 'license-gate-refresh'
                });
                const userId = payload.userId;
                // Check if token exists in Redis
                const storedToken = yield redis_1.redisManager.getRefreshToken(userId);
                if (!storedToken || storedToken !== token) {
                    // Token doesn't exist or doesn't match - possible replay attack
                    yield redis_1.redisManager.deleteRefreshToken(userId);
                    return {
                        success: false,
                        error: 'Invalid refresh token - possible replay attack detected'
                    };
                }
                // Generate new tokens
                const newAccessToken = yield this.generateAccessToken({ userId });
                const newRefreshToken = yield this.generateRefreshToken({ userId });
                // Delete old refresh token
                yield redis_1.redisManager.deleteRefreshToken(userId);
                return {
                    success: true,
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                    userId
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Invalid refresh token'
                };
            }
        });
    }
    // Background token rotation (call this for active users)
    rotateTokenIfNeeded(accessToken, refreshToken, rotateAfterMinutes = 10) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const verificationResult = yield this.verifyAccessToken(accessToken);
                if (!verificationResult.success) {
                    return { rotated: false, accessToken };
                }
                const { payload } = verificationResult;
                const now = Math.floor(Date.now() / 1000);
                const tokenAge = now - (payload.iat || 0);
                // If token is older than specified minutes, rotate
                if (tokenAge > rotateAfterMinutes * 60) {
                    const rotateResult = yield this.verifyAndRotateRefreshToken(refreshToken);
                    if (rotateResult.success) {
                        return {
                            rotated: true,
                            accessToken: rotateResult.accessToken,
                            refreshToken: rotateResult.refreshToken
                        };
                    }
                }
                return { rotated: false, accessToken };
            }
            catch (error) {
                return { rotated: false, accessToken };
            }
        });
    }
    // Direct login with password
    authenticateUser(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { prisma } = yield Promise.resolve().then(() => __importStar(require('../prisma')));
                const user = yield prisma.user.findUnique({
                    where: { email: email.toLowerCase() },
                    select: {
                        id: true,
                        passwordHash: true,
                        isEmailVerified: true
                    }
                });
                if (!user || !user.passwordHash) {
                    return { success: false, error: 'Invalid credentials' };
                }
                if (!user.isEmailVerified) {
                    return { success: false, error: 'Email not verified' };
                }
                // Verify password
                const isValidPassword = yield argon2.verify(user.passwordHash, password);
                if (!isValidPassword) {
                    return { success: false, error: 'Invalid credentials' };
                }
                // Generate tokens
                const accessToken = yield this.generateAccessToken({ userId: user.id });
                const refreshToken = yield this.generateRefreshToken({ userId: user.id });
                return {
                    success: true,
                    accessToken,
                    refreshToken,
                    userId: user.id
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: 'Authentication failed'
                };
            }
        });
    }
    // OAuth login (for Google/GitHub)
    oauthLogin(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const accessToken = yield this.generateAccessToken({ userId });
            const refreshToken = yield this.generateRefreshToken({ userId });
            return { accessToken, refreshToken };
        });
    }
    // Logout - invalidate refresh token
    logout(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield redis_1.redisManager.deleteRefreshToken(userId);
        });
    }
    // Hash password
    hashPassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield argon2.hash(password, {
                type: argon2.argon2id,
                memoryCost: 65536,
                timeCost: 3,
                parallelism: 4
            });
        });
    }
}
exports.EnhancedAuthenticator = EnhancedAuthenticator;
// Export singleton instance
exports.enhancedAuth = new EnhancedAuthenticator(process.env.JWT_SECRET);
