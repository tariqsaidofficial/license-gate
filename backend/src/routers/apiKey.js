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
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyRouter = void 0;
const crypto_1 = require("crypto");
const zod_1 = require("zod");
const prisma_1 = require("../prisma");
const trpc_1 = require("../trpc");
function censorApiKey(apiKey) {
    return Object.assign(Object.assign({}, apiKey), { key: apiKey.key.slice(0, 4) + "..." + apiKey.key.slice(-2) });
}
exports.apiKeyRouter = (0, trpc_1.router)({
    create: trpc_1.protectedProcedure
        .input(zod_1.z.object({ name: zod_1.z.string() }))
        .mutation(({ ctx: { userId }, input: { name } }) => __awaiter(void 0, void 0, void 0, function* () {
        const apiKeyKey = (0, crypto_1.randomUUID)();
        const apiKey = yield prisma_1.prisma.apiKey.create({
            data: { name, userId, key: apiKeyKey },
        });
        return {
            apiKey: censorApiKey(apiKey),
            uncensoredApiKey: apiKey,
        };
    })),
    delete: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(({ ctx: { userId }, input: { id } }) => __awaiter(void 0, void 0, void 0, function* () { return yield prisma_1.prisma.apiKey.deleteMany({ where: { id, userId } }); })),
    list: trpc_1.protectedProcedure.query(({ ctx: { userId } }) => __awaiter(void 0, void 0, void 0, function* () {
        const apiKeys = yield prisma_1.prisma.apiKey.findMany({
            where: { userId },
            take: 100,
        });
        return apiKeys.map(censorApiKey);
    })),
});
