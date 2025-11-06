"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.licenseListSchema = exports.licenseCreateSchema = void 0;
const zod_1 = require("zod");
exports.licenseCreateSchema = zod_1.z.object({
    name: zod_1.z.string().max(100),
    notes: zod_1.z.string().max(15000),
    active: zod_1.z.boolean(),
    ipLimit: zod_1.z.number().int().nullish(),
    licenseScope: zod_1.z.string().nullish(),
    expirationDate: zod_1.z.date().nullish(),
    validationPoints: zod_1.z.number().int().nullish(),
    validationLimit: zod_1.z.number().int().nullish(),
    replenishAmount: zod_1.z.number().int().nullish(),
    replenishInterval: zod_1.z
        .enum(["TEN_SECONDS", "MINUTE", "HOUR", "DAY"])
        .nullish(),
    licenseKey: zod_1.z.string().min(1).max(100).optional(),
});
exports.licenseListSchema = zod_1.z.object({
    take: zod_1.z.number().int().nonnegative().max(100),
    skip: zod_1.z.number().int().nonnegative(),
    filterStatus: zod_1.z.enum(["active", "disabled/expired"]).optional(),
});
