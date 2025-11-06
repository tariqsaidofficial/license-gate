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
exports.redisManager = void 0;
const redis_1 = require("redis");
class RedisManager {
    constructor() {
        this.isConnected = false;
        this.client = (0, redis_1.createClient)({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        console.log('Redis max retries reached. Falling back to memory storage.');
                        return false;
                    }
                    return Math.min(retries * 100, 3000);
                }
            }
        });
        this.client.on('error', (err) => {
            console.log('Redis Client Error', err);
            this.isConnected = false;
        });
        this.client.on('connect', () => {
            console.log('✅ Redis connected');
            this.isConnected = true;
        });
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.connect();
            }
            catch (error) {
                console.warn('⚠️ Redis connection failed, using memory fallback');
                this.isConnected = false;
            }
        });
    }
    setRefreshToken(userId, token, expiryDays = 30) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isConnected) {
                // Fallback to database if Redis is unavailable
                return this.setRefreshTokenFallback(userId, token);
            }
            try {
                const key = `refresh:${userId}`;
                yield this.client.setEx(key, 60 * 60 * 24 * expiryDays, token);
                return true;
            }
            catch (error) {
                console.error('Redis setRefreshToken error:', error);
                return this.setRefreshTokenFallback(userId, token);
            }
        });
    }
    getRefreshToken(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isConnected) {
                return this.getRefreshTokenFallback(userId);
            }
            try {
                const key = `refresh:${userId}`;
                const token = yield this.client.get(key);
                return token;
            }
            catch (error) {
                console.error('Redis getRefreshToken error:', error);
                return this.getRefreshTokenFallback(userId);
            }
        });
    }
    deleteRefreshToken(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isConnected) {
                return this.deleteRefreshTokenFallback(userId);
            }
            try {
                const key = `refresh:${userId}`;
                yield this.client.del(key);
                return true;
            }
            catch (error) {
                console.error('Redis deleteRefreshToken error:', error);
                return this.deleteRefreshTokenFallback(userId);
            }
        });
    }
    // Fallback methods using Prisma when Redis is unavailable
    setRefreshTokenFallback(userId, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const { prisma } = yield Promise.resolve().then(() => __importStar(require('../prisma')));
            yield prisma.user.update({
                where: { id: userId },
                data: { refreshSession: token }
            });
            return true;
        });
    }
    getRefreshTokenFallback(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { prisma } = yield Promise.resolve().then(() => __importStar(require('../prisma')));
            const user = yield prisma.user.findUnique({
                where: { id: userId },
                select: { refreshSession: true }
            });
            return (user === null || user === void 0 ? void 0 : user.refreshSession) || null;
        });
    }
    deleteRefreshTokenFallback(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { prisma } = yield Promise.resolve().then(() => __importStar(require('../prisma')));
            yield prisma.user.update({
                where: { id: userId },
                data: { refreshSession: null }
            });
            return true;
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isConnected) {
                yield this.client.disconnect();
            }
        });
    }
}
exports.redisManager = new RedisManager();
