"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="./types/env.d.ts" />
require("dotenv-safe/config");
require("reflect-metadata");
const trpcExpress = __importStar(require("@trpc/server/adapters/express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const auth_flows_1 = require("./controller/auth-flows");
const license_rate_limit_1 = require("./controller/license-rate-limit");
const _app_1 = require("./routers/_app");
const routes_1 = require("./tsoa-generated/routes");
const ShowError_1 = require("./utils/ShowError");
const tsoa_response_error_1 = require("./utils/tsoa-response-error");
// Security middleware imports
const security_1 = require("./middleware/security");
// Validate environment variables on startup
(0, security_1.validateEnvVars)();
const app = (0, express_1.default)();
// Apply security middleware
app.use(security_1.helmetConfig);
app.use(security_1.compressionConfig);
app.use(security_1.enforceHTTPS);
app.use(security_1.requestLogger);
// Rate limiting
app.use('/trpc/auth', security_1.authLimiter);
app.use('/api', security_1.apiLimiter);
app.use(security_1.generalLimiter);
app.use("/trpc", (0, cors_1.default)({ origin: process.env.CORS_ORIGIN.split(","), credentials: true }));
const allCors = (0, cors_1.default)({ origin: "*" });
const urlencoded = express_1.default.urlencoded({
    extended: true,
});
const json = express_1.default.json();
app.use((req, res, next) => {
    if (req.url.startsWith("/trpc"))
        return next();
    allCors(req, res, () => {
        urlencoded(req, res, () => {
            json(req, res, next);
        });
    });
});
app.use((0, cookie_parser_1.default)());
app.use(auth_flows_1.authExpressMiddleware);
app.use("/trpc", trpcExpress.createExpressMiddleware({
    router: _app_1.appRouter,
    createContext: ({ req, res }) => {
        return { userId: req.userId, res };
    },
    onError(data) {
        var _a, _b;
        if (((_a = data.error.message) === null || _a === void 0 ? void 0 : _a.startsWith("error.")) ||
            ((_b = data.error.message) === null || _b === void 0 ? void 0 : _b.startsWith("+ ")))
            return;
        console.error(data.error);
        data.error.message = ShowError_1.ShowError.internalServerError().message;
    },
}));
(0, license_rate_limit_1.setupRateLimitReplenishCron)();
(0, routes_1.RegisterRoutes)(app);
app.use(tsoa_response_error_1.tsoaErrorHandler);
app.listen(process.env.PORT, () => {
    console.log(`\n📄 Server ready on port ${process.env.PORT}\n`);
});
