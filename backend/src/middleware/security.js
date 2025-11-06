"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = exports.enforceHTTPS = exports.validateEnvVars = exports.compressionConfig = exports.helmetConfig = exports.speedLimiter = exports.apiLimiter = exports.authLimiter = exports.generalLimiter = void 0;
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_slow_down_1 = __importDefault(require("express-slow-down"));
const helmet_1 = __importDefault(require("helmet"));
// General rate limiting
exports.generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Strict rate limiting for auth endpoints
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// API rate limiting
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 60,
    message: {
        error: 'API rate limit exceeded, please slow down.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Slow down repeated requests
exports.speedLimiter = (0, express_slow_down_1.default)({
    windowMs: 15 * 60 * 1000,
    delayAfter: 2,
    delayMs: () => 500,
    maxDelayMs: 20000,
    validate: { delayMs: false } // Disable warning
});
// Helmet configuration for security headers
exports.helmetConfig = (0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "https://accounts.google.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            frameSrc: ["https://accounts.google.com"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});
// Compression middleware
exports.compressionConfig = (0, compression_1.default)({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression_1.default.filter(req, res);
    }
});
// Environment variables validation
const validateEnvVars = () => {
    const required = [
        'DATABASE_URL',
        'JWT_SECRET'
    ];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:', missing);
        process.exit(1);
    }
    // Validate JWT secret strength
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        console.error('❌ JWT_SECRET must be at least 32 characters long');
        process.exit(1);
    }
    console.log('✅ Environment variables validated');
};
exports.validateEnvVars = validateEnvVars;
// HTTPS enforcement middleware
const enforceHTTPS = (req, res, next) => {
    if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
        return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
};
exports.enforceHTTPS = enforceHTTPS;
// Request logging middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        };
        if (res.statusCode >= 400) {
            console.error('🔴 Request error:', logData);
        }
        else if (duration > 1000) {
            console.warn('⚠️ Slow request:', logData);
        }
        else {
            console.log('📝 Request:', logData);
        }
    });
    next();
};
exports.requestLogger = requestLogger;
