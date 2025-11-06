"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseVerifyController = void 0;
const express_1 = __importDefault(require("express"));
const tsoa_1 = require("tsoa");
const zod_1 = require("zod");
const verify_license_1 = require("../../controller/verify-license");
const ShowError_1 = require("../../utils/ShowError");
const user_id_1 = require("../../utils/user-id");
const verifyLicenseSchema = zod_1.z
    .object({
    licenseKey: zod_1.z.string(),
    userId: zod_1.z.number().int(),
    options: zod_1.z
        .object({
        scope: zod_1.z.string().optional(),
        challenge: zod_1.z.string().optional(),
        metadata: zod_1.z.string().optional(),
    })
        .strict()
        .optional(),
})
    .strict();
let LicenseVerifyController = class LicenseVerifyController extends tsoa_1.Controller {
    /**
     * Verify a license
     * @param userId The user ID (from web panel) that owns the license
     * @param licenseKey The license key
     * @param scope The scope of the license. Required if the license has a <a href="restriction-options/scope">scope restriction</a>
     * @param challenge A challenge that will be signed by the server. We recommend to use the current time in milliseconds as the challenge. See <a href="security-considerations">Security considerations</a> for more information.
     * @param metadata A string that will be logged with the license verification. This can be used to log additional information about the verification request.
     * @summary Verify license
     */
    verifyLicenseGet(req, userId, licenseKey, scope, challenge, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = {
                scope,
                challenge,
                metadata,
            };
            return processLicenseVerification(req, licenseKey, userId, options);
        });
    }
    /**
     * Verify a license
     * @param userId The user ID (from web panel) that owns the license
     * @param licenseKey The license key
     * @summary Verify license
     */
    verifyLicensePost(req, userId, licenseKey, requestBody) {
        return __awaiter(this, void 0, void 0, function* () {
            return processLicenseVerification(req, licenseKey, userId, requestBody);
        });
    }
};
__decorate([
    (0, tsoa_1.Get)("{userId}/{licenseKey}/verify"),
    (0, tsoa_1.Response)(422, "Invalid request schema"),
    (0, tsoa_1.Example)({
        valid: true,
        result: "VALID",
    }, "License is valid"),
    (0, tsoa_1.Example)({
        valid: true,
        result: "VALID",
        signedChallenge: "23fa25/7dd...",
    }, "License is valid (signed challenge)"),
    (0, tsoa_1.Example)({
        valid: false,
        result: "EXPIRED",
    }, "License has expired"),
    (0, tsoa_1.Example)({
        valid: false,
        result: "NOT_FOUND",
    }, "License not found"),
    (0, tsoa_1.Example)({
        valid: false,
        result: "LICENSE_SCOPE_FAILED",
    }, "License scope does not match"),
    __param(0, (0, tsoa_1.Request)()),
    __param(1, (0, tsoa_1.Path)()),
    __param(2, (0, tsoa_1.Path)()),
    __param(3, (0, tsoa_1.Query)()),
    __param(4, (0, tsoa_1.Query)()),
    __param(5, (0, tsoa_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object, String, String]),
    __metadata("design:returntype", Promise)
], LicenseVerifyController.prototype, "verifyLicenseGet", null);
__decorate([
    (0, tsoa_1.Response)(422, "Invalid request schema"),
    (0, tsoa_1.Example)({
        valid: true,
        result: "VALID",
    }, "License is valid"),
    (0, tsoa_1.Example)({
        valid: true,
        result: "VALID",
        signedChallenge: "23fa25/7dd...",
    }, "License is valid (signed challenge)"),
    (0, tsoa_1.Example)({
        valid: false,
        result: "EXPIRED",
    }, "License has expired"),
    (0, tsoa_1.Example)({
        valid: false,
        result: "NOT_FOUND",
    }, "License not found"),
    (0, tsoa_1.Example)({
        valid: false,
        result: "LICENSE_SCOPE_FAILED",
    }, "License scope does not match"),
    (0, tsoa_1.Post)("{userId}/{licenseKey}/verify"),
    __param(0, (0, tsoa_1.Request)()),
    __param(1, (0, tsoa_1.Path)()),
    __param(2, (0, tsoa_1.Path)()),
    __param(3, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], LicenseVerifyController.prototype, "verifyLicensePost", null);
LicenseVerifyController = __decorate([
    (0, tsoa_1.Route)("/license"),
    (0, tsoa_1.Tags)("Public")
], LicenseVerifyController);
exports.LicenseVerifyController = LicenseVerifyController;
function getIpFromRequest(req) {
    const cfIp = req.headers["cf-connecting-ip"];
    return cfIp || req.ip || 'unknown';
}
function processLicenseVerification(req, licenseKey, userId, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const userIdNumber = (0, user_id_1.hexToUserId)(userId);
        try {
            verifyLicenseSchema.parse({
                licenseKey,
                userId: userIdNumber,
                options,
            });
        }
        catch (e) {
            throw new ShowError_1.ShowError("Invalid request schema", "invalid-schema");
        }
        const verificationResult = yield (0, verify_license_1.verifyLicense)(licenseKey, userIdNumber, getIpFromRequest(req), options);
        return {
            valid: verificationResult.result === "VALID",
            result: verificationResult.result,
            signedChallenge: verificationResult.signedChallenge,
        };
    });
}
