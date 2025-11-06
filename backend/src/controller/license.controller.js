"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
exports.LicenseService = void 0;
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const typedi_1 = require("typedi");
const prisma_1 = require("../prisma");
const ShowError_1 = require("../utils/ShowError");
const INCLUDE_LAST_7_DAYS_LOGS = {
    logs: {
        where: {
            timestamp: {
                gt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
            },
        },
        orderBy: {
            timestamp: "desc",
        },
        take: 50,
    },
};
let LicenseService = class LicenseService {
    create({ license, userId, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const licenseKey = license.licenseKey || (0, crypto_1.randomUUID)();
            try {
                return yield prisma_1.prisma.license.create({
                    data: Object.assign(Object.assign({}, license), { userId: userId, licenseKey }),
                });
            }
            catch (e) {
                if (e instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    if (e.code === "P2002") {
                        throw new ShowError_1.ShowError("License with same key already exists", "license-with-same-key-already-exists");
                    }
                }
                throw e;
            }
        });
    }
    read({ licenseId, checkUserId, includeLogs, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const license = yield prisma_1.prisma.license.findFirst({
                where: Object.assign({ id: licenseId }, (checkUserId !== undefined && { userId: checkUserId })),
                include: includeLogs ? INCLUDE_LAST_7_DAYS_LOGS : undefined,
            });
            if (!license) {
                throw new ShowError_1.ShowError("License not found", "not-found");
            }
            return license;
        });
    }
    readByLicenseKey({ licenseKey, checkUserId, includeLogs, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const license = yield prisma_1.prisma.license.findFirst({
                where: Object.assign({ licenseKey }, (checkUserId !== undefined && { userId: checkUserId })),
                include: includeLogs ? INCLUDE_LAST_7_DAYS_LOGS : undefined,
            });
            if (!license) {
                throw new ShowError_1.ShowError("License not found", "not-found");
            }
            return license;
        });
    }
    update({ license, checkUserId, includeLogs, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingLicense = yield prisma_1.prisma.license.findFirst({
                where: Object.assign({ id: license.id }, (checkUserId !== undefined && { userId: checkUserId })),
                select: { id: true },
            });
            if (!existingLicense) {
                throw new ShowError_1.ShowError("License not found", "not-found");
            }
            return yield prisma_1.prisma.license.update({
                include: includeLogs ? INCLUDE_LAST_7_DAYS_LOGS : undefined,
                where: {
                    id: license.id,
                },
                data: license,
            });
        });
    }
    delete({ licenseId, checkUserId, includeLogs, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const license = yield prisma_1.prisma.license.findFirst({
                where: Object.assign({ id: licenseId }, (checkUserId !== undefined && { userId: checkUserId })),
            });
            if (!license) {
                throw new ShowError_1.ShowError("License not found", "not-found");
            }
            return yield prisma_1.prisma.license.delete({
                include: includeLogs ? INCLUDE_LAST_7_DAYS_LOGS : undefined,
                where: {
                    id: licenseId,
                },
            });
        });
    }
    countActive({ userId }) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.prisma.license.count({
                where: {
                    userId: userId,
                    OR: [
                        {
                            expirationDate: {
                                gt: new Date(),
                            },
                        },
                        {
                            expirationDate: null,
                        },
                    ],
                    active: true,
                },
            });
        });
    }
    list({ take, skip, filterStatus, userId, includeLogs, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = userId !== undefined ? { userId } : {};
            if (filterStatus == "active") {
                where.OR = [
                    {
                        expirationDate: {
                            gt: new Date(),
                        },
                    },
                    {
                        expirationDate: null,
                    },
                ];
                where.active = true;
            }
            else if (filterStatus == "disabled/expired") {
                where.OR = [
                    {
                        expirationDate: {
                            lt: new Date(),
                        },
                    },
                    {
                        active: false,
                    },
                ];
            }
            const [licenses, count] = yield Promise.all([
                prisma_1.prisma.license.findMany({
                    where,
                    take: take,
                    skip: skip,
                    include: includeLogs ? INCLUDE_LAST_7_DAYS_LOGS : undefined,
                    orderBy: {
                        createdAt: "desc",
                    },
                }),
                prisma_1.prisma.license.count({ where }),
            ]);
            return {
                licenses,
                count,
            };
        });
    }
};
LicenseService = __decorate([
    (0, typedi_1.Service)()
], LicenseService);
exports.LicenseService = LicenseService;
