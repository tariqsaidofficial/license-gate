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
exports.authRouter = void 0;
const zod_1 = require("zod");
const auth_flows_1 = require("../controller/auth-flows");
const prisma_1 = require("../prisma");
const trpc_1 = require("../trpc");
const ShowError_1 = require("../utils/ShowError");
const recaptcha_1 = require("../utils/recaptcha");
exports.authRouter = (0, trpc_1.router)({
    loginWithPassword: trpc_1.publicProcedure
        .input(zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string(),
    }))
        .mutation(({ input, ctx }) => __awaiter(void 0, void 0, void 0, function* () {
        const { accessToken, refreshToken, userId } = yield (0, auth_flows_1.loginWithPassword)(input.email, input.password);
        ctx.res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
        });
        ctx.res.cookie("accessToken", accessToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
        });
        return { userId: userId };
    })),
    signUpWithPassword: trpc_1.publicProcedure
        .input(zod_1.z.object({
        token: zod_1.z.string(),
        email: zod_1.z.string().email(),
        password: zod_1.z.string(),
        marketingEmails: zod_1.z.boolean(),
    }))
        .mutation(({ input, ctx }) => __awaiter(void 0, void 0, void 0, function* () {
        if (process.env.DISABLE_RECAPTCHA !== "true" &&
            !(yield (0, recaptcha_1.verifyRecaptcha)(input.token)))
            throw new ShowError_1.ShowError("Failed captcha", "failed-captcha");
        if (process.env.DISABLE_SIGN_UP === "true") {
            throw new ShowError_1.ShowError("Sign up is disabled", "sign-up-disabled");
        }
        yield (0, auth_flows_1.signUpWithPassword)(input.email, input.password, input.marketingEmails);
    })),
    loginWithGoogle: trpc_1.publicProcedure
        .input(zod_1.z.object({
        token: zod_1.z.string(),
        createAccountIfNotFound: zod_1.z.boolean(),
        marketingEmails: zod_1.z.boolean().optional(),
    }))
        .mutation(({ input, ctx }) => __awaiter(void 0, void 0, void 0, function* () {
        const { accessToken, refreshToken, userId, email } = yield (0, auth_flows_1.loginWithGoogle)(input.token, input.createAccountIfNotFound, input.marketingEmails);
        ctx.res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
        });
        ctx.res.cookie("accessToken", accessToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
        });
        return { userId: userId, email };
    })),
    loginWithGitHub: trpc_1.publicProcedure
        .input(zod_1.z.object({
        code: zod_1.z.string(),
        createAccountIfNotFound: zod_1.z.boolean(),
        marketingEmails: zod_1.z.boolean().optional(),
    }))
        .mutation(({ input, ctx }) => __awaiter(void 0, void 0, void 0, function* () {
        const { accessToken, refreshToken, userId, email } = yield (0, auth_flows_1.loginWithGitHub)(input.code, input.createAccountIfNotFound, input.marketingEmails);
        ctx.res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
        });
        ctx.res.cookie("accessToken", accessToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
        });
        return { userId: userId, email };
    })),
    verifyEmail: trpc_1.publicProcedure
        .input(zod_1.z.object({
        token: zod_1.z.string(),
        email: zod_1.z.string().email(),
    }))
        .mutation(({ input }) => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, auth_flows_1.verifyMailToken)(input.token, input.email);
    })),
    // TODO: add google recaptcha check for public reset requests
    requestPasswordReset: trpc_1.publicProcedure
        .input(zod_1.z.object({
        email: zod_1.z.string().email(),
        token: zod_1.z.string(),
    }))
        .mutation(({ input }) => __awaiter(void 0, void 0, void 0, function* () {
        if (process.env.DISABLE_RECAPTCHA !== "true" &&
            !(yield (0, recaptcha_1.verifyRecaptcha)(input.token)))
            throw new ShowError_1.ShowError("Failed captcha", "failed-captcha");
        const user = yield prisma_1.prisma.user.findUnique({
            where: { email: input.email },
            select: { email: true },
        });
        if (user) {
            yield (0, auth_flows_1.requestPasswordReset)(input.email);
        } // We don't want to leak if a user exists or not
    })),
    requestPasswordResetNoCaptcha: trpc_1.protectedProcedure
        .input(zod_1.z.object({ signOutAllDevices: zod_1.z.boolean() }))
        .mutation(({ ctx, input }) => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id: ctx.userId },
            select: { email: true, passwordHash: true },
        });
        if (!user || !user.passwordHash) {
            throw ShowError_1.ShowError.internalServerError();
        }
        if (input.signOutAllDevices) {
            yield prisma_1.prisma.user.update({
                where: { id: ctx.userId },
                data: { refreshSession: null },
            });
        }
        yield (0, auth_flows_1.requestPasswordReset)(user.email);
    })),
    resetPassword: trpc_1.publicProcedure
        .input(zod_1.z.object({
        token: zod_1.z.string(),
        email: zod_1.z.string().email(),
        password: zod_1.z.string(),
    }))
        .mutation(({ input }) => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, auth_flows_1.resetPassword)(input);
    })),
    me: trpc_1.protectedProcedure.query(({ ctx }) => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id: ctx.userId },
            select: {
                userID: true,
                email: true,
                passwordHash: true,
                marketingEmails: true,
                rsaPublicKey: true,
                isAdmin: true,
            },
        });
        if (!user) {
            throw ShowError_1.ShowError.internalServerError();
        }
        return {
            userId: user.userID,
            email: user.email,
            isPasswordAccount: !!user.passwordHash,
            marketingEmails: user.marketingEmails,
            rsaPublicKey: user.rsaPublicKey,
            isAdmin: user.isAdmin,
        };
    })),
    update: trpc_1.protectedProcedure
        .input(zod_1.z.object({ marketingEmails: zod_1.z.boolean() }))
        .mutation(({ ctx, input }) => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma_1.prisma.user.update({
            where: { id: ctx.userId },
            data: { marketingEmails: input.marketingEmails },
        });
    })),
    deleteAccount: trpc_1.protectedProcedure.mutation(({ ctx }) => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma_1.prisma.user.delete({ where: { id: ctx.userId } });
    })),
    updateRsaPublicKey: trpc_1.protectedProcedure
        .input(zod_1.z.object({ rsaPublicKey: zod_1.z.string(), rsaPrivateKey: zod_1.z.string() }))
        .mutation(({ ctx, input }) => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma_1.prisma.user.update({
            where: { id: ctx.userId },
            data: {
                rsaPublicKey: input.rsaPublicKey,
                rsaPrivateKey: input.rsaPrivateKey,
            },
        });
    })),
});
