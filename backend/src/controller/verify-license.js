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
exports.verifyLicense = void 0;
const node_rsa_1 = __importDefault(require("node-rsa"));
const prisma_1 = require("../prisma");
const DEBUG_TIME = false;
function signChallenge(challenge, rsaPrivateKey) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!rsaPrivateKey) {
            // TODO: Properly propagate this error to the user
            throw new Error("User has no RSA public key");
        }
        const key = new node_rsa_1.default(rsaPrivateKey, "pkcs8-private");
        return key.sign(challenge, "base64");
    });
}
function getIpCount(userId, licenseId, excludeIp) {
    return __awaiter(this, void 0, void 0, function* () {
        const last12Hours = new Date(Date.now() - 1000 * 60 * 60 * 12);
        // TODO: We might want to add indexes to the database to speed up this query (and some other queries)
        const result = yield prisma_1.prisma.$queryRaw `SELECT COUNT(DISTINCT \`ip\`) AS \`count\` FROM \`Log\` WHERE \`userId\` = ${userId} AND \`licenseId\` = ${licenseId} AND \`result\` = 'VALID' AND \`ip\` != ${excludeIp} AND \`timestamp\` >= ${last12Hours}`;
        return result[0].count;
        // return prisma.log.count({
        //   distinct: ["ip"],
        //   where: {
        //     userId,
        //     licenseId: licenseId,
        //     result: "VALID",
        //     ip: {
        //       not: excludeIp,
        //     },
        //     timestamp: {
        //       gte: last12Hours,
        //     },
        //   },
        // });
    });
}
function decrementValidationPoints(licenseId, amount = 1) {
    return __awaiter(this, void 0, void 0, function* () {
        yield prisma_1.prisma.license.update({
            where: {
                id: licenseId,
            },
            data: {
                validationPoints: {
                    decrement: amount,
                },
            },
        });
    });
}
function fetchLicense(licenseKey, userId, includePrivateKey) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.prisma.license.findUnique({
            where: { userId_licenseKey: { licenseKey, userId } },
            include: includePrivateKey
                ? { user: { select: { rsaPrivateKey: true } } }
                : undefined,
        });
    });
}
function checkLicense(license, userId, ip, scope) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!license.active) {
            return "NOT_ACTIVE";
        }
        if (license.licenseScope && license.licenseScope !== scope) {
            return "LICENSE_SCOPE_FAILED";
        }
        if (license.expirationDate && license.expirationDate < new Date()) {
            return "EXPIRED";
        }
        if (license.validationPoints !== null && license.validationPoints <= 0) {
            return "RATE_LIMIT_EXCEEDED";
        }
        if (license.ipLimit !== null) {
            const ipCount = yield getIpCount(userId, license.id, ip);
            if (ipCount >= license.ipLimit) {
                return "IP_LIMIT_EXCEEDED";
            }
        }
        return "VALID";
    });
}
function verifyLicense(licenseKey, userId, ip, options) {
    return __awaiter(this, void 0, void 0, function* () {
        let time = Date.now();
        const license = yield fetchLicense(licenseKey, userId, options.challenge !== undefined);
        if (DEBUG_TIME) {
            console.log("Time to fetch license: ", Date.now() - time);
            time = Date.now();
        }
        if (!license) {
            return {
                result: "NOT_FOUND",
            };
        }
        const status = yield checkLicense(license, userId, ip, options.scope);
        if (DEBUG_TIME) {
            console.log("Time to check license: ", Date.now() - time);
            time = Date.now();
        }
        const backgroundPromises = [];
        // Create log entry
        backgroundPromises.push(prisma_1.prisma.log.create({
            data: {
                userId,
                licenseId: license.id,
                ip,
                result: status,
                metadata: options.metadata || "",
            },
        }));
        if (status != "VALID") {
            yield Promise.all(backgroundPromises);
            return {
                result: status,
            };
        }
        // Reduce validation points
        // TODO: This is not save against timing attacks / could use a mutex in future (also IP limit)
        if (license.validationPoints !== null) {
            backgroundPromises.push(decrementValidationPoints(license.id));
        }
        // Sign challenge
        let signedChallenge = undefined;
        if (options.challenge) {
            signedChallenge = yield signChallenge(options.challenge, license.user.rsaPrivateKey);
        }
        yield Promise.all(backgroundPromises);
        if (DEBUG_TIME) {
            console.log("Time to log, sign and decrement: ", Date.now() - time);
        }
        return {
            result: "VALID",
            signedChallenge,
        };
    });
}
exports.verifyLicense = verifyLicense;
