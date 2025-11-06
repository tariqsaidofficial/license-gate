"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectedProcedure = exports.publicProcedure = exports.mergeRouters = exports.router = exports.middleware = void 0;
const server_1 = require("@trpc/server");
const superjson_1 = __importDefault(require("superjson"));
const t = server_1.initTRPC.context().create({
    transformer: superjson_1.default,
});
const isAuthenticated = t.middleware(({ next, ctx }) => {
    if (ctx.userId == undefined) {
        throw "error.notAuthenticated";
    }
    return next({
        ctx: {
            userId: ctx.userId,
            res: ctx.res,
        },
    });
});
exports.middleware = t.middleware;
exports.router = t.router;
exports.mergeRouters = t.mergeRouters;
exports.publicProcedure = t.procedure;
exports.protectedProcedure = t.procedure.use(isAuthenticated);
