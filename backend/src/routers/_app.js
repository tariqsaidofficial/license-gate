"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const trpc_1 = require("../trpc");
const admin_1 = require("./admin");
const apiKey_1 = require("./apiKey");
const auth_1 = require("./auth");
const license_1 = require("./license");
const logs_1 = require("./logs");
const verification_1 = require("./verification");
exports.appRouter = (0, trpc_1.router)({
    auth: auth_1.authRouter,
    license: license_1.licenseRouter,
    logs: logs_1.logsRouter,
    apiKey: apiKey_1.apiKeyRouter,
    verification: verification_1.verificationRouter,
    admin: admin_1.adminRouter,
});
