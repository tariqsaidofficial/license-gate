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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.licenseRouter = void 0;
const typedi_1 = __importDefault(require("typedi"));
const zod_1 = require("zod");
const license_controller_1 = require("../controller/license.controller");
const trpc_1 = require("../trpc");
const license_schema_1 = require("./license-schema");
const licenseService = typedi_1.default.get(license_controller_1.LicenseService);
exports.licenseRouter = (0, trpc_1.router)({
    create: trpc_1.protectedProcedure
        .input(license_schema_1.licenseCreateSchema)
        .mutation(({ ctx, input }) => __awaiter(void 0, void 0, void 0, function* () {
        return licenseService.create({
            license: input,
            userId: ctx.userId,
        });
    })),
    read: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number().int() }))
        .query(({ ctx, input }) => __awaiter(void 0, void 0, void 0, function* () {
        return yield licenseService.read({
            licenseId: input.id,
            checkUserId: ctx.userId,
            includeLogs: true,
        });
    })),
    update: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number().int() }).merge(license_schema_1.licenseCreateSchema.partial()))
        .mutation(({ ctx, input }) => __awaiter(void 0, void 0, void 0, function* () {
        return yield licenseService.update({
            license: input,
            checkUserId: ctx.userId,
            includeLogs: true,
        });
    })),
    delete: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number().int() }))
        .mutation(({ ctx, input }) => __awaiter(void 0, void 0, void 0, function* () {
        return yield licenseService.delete({
            licenseId: input.id,
            checkUserId: ctx.userId,
            includeLogs: true,
        });
    })),
    countActive: trpc_1.protectedProcedure.query(({ ctx }) => __awaiter(void 0, void 0, void 0, function* () {
        return licenseService.countActive({ userId: ctx.userId });
    })),
    list: trpc_1.protectedProcedure
        .input(license_schema_1.licenseListSchema)
        .query(({ ctx, input }) => __awaiter(void 0, void 0, void 0, function* () {
        return yield licenseService.list({
            userId: ctx.userId,
            take: input.take,
            skip: input.skip,
            filterStatus: input.filterStatus,
            includeLogs: true,
        });
    })),
});
