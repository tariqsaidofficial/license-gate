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
exports.getHistogramData = exports.logsRouter = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../prisma");
const trpc_1 = require("../trpc");
const validationResultSchema = zod_1.z.enum([
    "VALID",
    "NOT_FOUND",
    "NOT_ACTIVE",
    "EXPIRED",
    "LICENSE_SCOPE_FAILED",
    "IP_LIMIT_EXCEEDED",
    "RATE_LIMIT_EXCEEDED",
]);
exports.logsRouter = (0, trpc_1.router)({
    quickStats: trpc_1.protectedProcedure.query(({ ctx }) => __awaiter(void 0, void 0, void 0, function* () {
        // Active licenses
        // Successful checks in the last 7 days (and 7 days before that)
        // Failed checks in the last 7 days (and 7 days before that)
        // Time of last successful check
        const [activeLicenses, successfulChecksLast7Days, failedChecksLast7Days, successfulCheckPrevious7Days, failedCheckPrevious7Days, lastSuccessfulCheck,] = yield Promise.all([
            prisma_1.prisma.license.count({
                where: {
                    userId: ctx.userId,
                    active: true,
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
                },
            }),
            prisma_1.prisma.log.count({
                where: {
                    userId: ctx.userId,
                    result: "VALID",
                    timestamp: {
                        gt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
                    },
                },
            }),
            prisma_1.prisma.log.count({
                where: {
                    userId: ctx.userId,
                    result: {
                        not: "VALID",
                    },
                    timestamp: {
                        gt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
                    },
                },
            }),
            prisma_1.prisma.log.count({
                where: {
                    userId: ctx.userId,
                    result: "VALID",
                    timestamp: {
                        gt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
                        lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
                    },
                },
            }),
            prisma_1.prisma.log.count({
                where: {
                    userId: ctx.userId,
                    result: {
                        not: "VALID",
                    },
                    timestamp: {
                        gt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
                        lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
                    },
                },
            }),
            prisma_1.prisma.log.findFirst({
                where: {
                    userId: ctx.userId,
                    result: "VALID",
                },
                orderBy: {
                    timestamp: "desc",
                },
            }),
        ]);
        return {
            activeLicenses,
            successfulChecksLast7Days,
            failedChecksLast7Days,
            successfulCheckPrevious7Days,
            failedCheckPrevious7Days,
            lastSuccessfulCheck: lastSuccessfulCheck === null || lastSuccessfulCheck === void 0 ? void 0 : lastSuccessfulCheck.timestamp,
        };
    })),
    histogram: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        interval: zod_1.z.enum(["minute", "hour", "day", "month"]),
        intervalCount: zod_1.z.number().int().positive().max(31),
        licenseId: zod_1.z.number().int().optional(),
    }))
        .query(({ ctx: { userId }, input: { interval, intervalCount, licenseId }, }) => __awaiter(void 0, void 0, void 0, function* () {
        return getHistogramData({
            interval,
            intervalCount,
            licenseId,
            userId,
        });
    })),
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        filter: zod_1.z.object({
            licenseId: zod_1.z.number().int().optional(),
            result: zod_1.z.array(validationResultSchema).optional(),
        }),
        size: zod_1.z.number().int().positive().max(100).default(25),
        after: zod_1.z.number().int().optional(),
        before: zod_1.z.number().int().optional(),
    }))
        .query(({ ctx: { userId }, input: { filter, size, after, before } }) => __awaiter(void 0, void 0, void 0, function* () {
        const where = {
            userId,
        };
        if (filter === null || filter === void 0 ? void 0 : filter.licenseId) {
            where.licenseId = filter.licenseId;
        }
        if (filter === null || filter === void 0 ? void 0 : filter.result) {
            where.result = { in: filter.result };
        }
        if (after) {
            where.id = { gt: after };
        }
        if (before) {
            where.id = { lt: before };
        }
        const logs = yield prisma_1.prisma.log.findMany({
            where,
            orderBy: {
                id: "desc",
            },
            take: size,
            include: {
                license: {
                    select: {
                        name: true,
                        licenseKey: true,
                    },
                },
            },
        });
        return logs;
    })),
});
function getHistogramData(request) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = buildHistogramQuery(request);
        const params = [request.userId];
        if (request.licenseId) {
            params.push(request.licenseId);
        }
        let result = yield prisma_1.prisma.$queryRawUnsafe(query, ...params);
        result = result.map((row) => (Object.assign(Object.assign({}, row), { time_interval: new Date(row.time_interval) })));
        const dates = getIntervalDates(request.interval, request.intervalCount);
        const histogram = dates.map((date) => {
            const matchValid = result.find((row) => row.time_interval.getTime() === date.getTime() && row.is_valid === 1);
            const matchInvalid = result.find((row) => row.time_interval.getTime() === date.getTime() && row.is_valid === 0);
            return {
                date,
                valid: Number((matchValid === null || matchValid === void 0 ? void 0 : matchValid.log_count) || 0),
                invalid: Number((matchInvalid === null || matchInvalid === void 0 ? void 0 : matchInvalid.log_count) || 0),
            };
        });
        return {
            histogram,
        };
    });
}
exports.getHistogramData = getHistogramData;
function getIntervalDates(interval, count) {
    const now = new Date();
    let lastDate = now;
    if (interval === "minute") {
        lastDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
    }
    else if (interval === "hour") {
        lastDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    }
    else if (interval === "day") {
        lastDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    }
    else if (interval === "month") {
        lastDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth()));
    }
    const dates = [lastDate];
    for (let i = 0; i < count - 1; i++) {
        if (interval === "minute") {
            dates.push(new Date(lastDate.getTime() - 1000 * 60));
        }
        else if (interval === "hour") {
            dates.push(new Date(lastDate.getTime() - 1000 * 60 * 60));
        }
        else if (interval === "day") {
            dates.push(new Date(lastDate.getTime() - 1000 * 60 * 60 * 24));
        }
        else if (interval === "month") {
            const newMonth = lastDate.getUTCMonth() - 1;
            if (newMonth < 0) {
                dates.push(new Date(Date.UTC(lastDate.getUTCFullYear() - 1, 11)));
            }
            else {
                dates.push(new Date(Date.UTC(lastDate.getUTCFullYear(), newMonth)));
            }
        }
        lastDate = dates[dates.length - 1];
    }
    return dates.reverse();
}
function buildHistogramQuery({ interval, intervalCount, licenseId, }) {
    let timeFormat;
    let dateTrunc;
    switch (interval) {
        case "minute":
            timeFormat = "%Y-%m-%d %H:%i:00.000Z";
            dateTrunc = "minute";
            break;
        case "hour":
            timeFormat = "%Y-%m-%d %H:00:00.000Z";
            dateTrunc = "hour";
            break;
        case "day":
            timeFormat = "%Y-%m-%d";
            dateTrunc = "day";
            break;
        case "month":
            timeFormat = "%Y-%m-01";
            dateTrunc = "month";
            break;
        default:
            throw new Error("Invalid interval type");
    }
    return `
    SELECT 
      DATE_FORMAT(timestamp, '${timeFormat}') as time_interval,
      result = 'VALID' as is_valid,
      COUNT(*) as log_count
    FROM 
      Log
    WHERE 
      timestamp >= UTC_TIMESTAMP() - INTERVAL ${intervalCount} ${dateTrunc.toUpperCase()}
      AND userId = ?
      ${licenseId ? `AND licenseId = ?` : ""}
    GROUP BY 
      time_interval, is_valid
    ORDER BY 
      time_interval
  `;
}
