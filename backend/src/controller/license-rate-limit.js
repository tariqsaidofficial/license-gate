"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRateLimitReplenishCron = void 0;
const prisma_1 = require("../prisma");
function getReplenishIntervalSeconds(interval) {
    switch (interval) {
        case "TEN_SECONDS":
            return 10;
        case "MINUTE":
            return 60;
        case "HOUR":
            return 60 * 60;
        case "DAY":
            return 60 * 60 * 24;
    }
}
function setupRateLimitReplenishCron() {
    replenishRateLimitLoop("TEN_SECONDS");
    replenishRateLimitLoop("MINUTE");
    replenishRateLimitLoop("HOUR");
    replenishRateLimitLoop("DAY");
}
exports.setupRateLimitReplenishCron = setupRateLimitReplenishCron;
function replenishRateLimitLoop(interval) {
    const seconds = getReplenishIntervalSeconds(interval);
    setInterval(() => {
        prisma_1.prisma.$transaction([
            prisma_1.prisma.$queryRaw `UPDATE \`License\` SET \`validationPoints\` = \`validationLimit\` WHERE \`replenishInterval\` = ${interval} AND \`validationPoints\` >= \`validationLimit\` - \`replenishAmount\` AND \`validationPoints\` < \`validationLimit\``,
            prisma_1.prisma.$queryRaw `UPDATE \`License\` SET \`validationPoints\` = \`validationPoints\` + \`replenishAmount\` WHERE \`replenishInterval\` = ${interval} AND \`validationPoints\` < \`validationLimit\` - \`replenishAmount\``,
        ]);
    }, seconds * 1000);
}
