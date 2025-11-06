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
exports.LicenseController = void 0;
const tsoa_1 = require("tsoa");
const typedi_1 = __importDefault(require("typedi"));
const license_controller_1 = require("../../controller/license.controller");
const license_schema_1 = require("../license-schema");
let LicenseController = class LicenseController extends tsoa_1.Controller {
    constructor() {
        super();
        this.licenseService = typedi_1.default.get(license_controller_1.LicenseService);
    }
    /**
     * Create a new license.
     * @returns The newly created license.
     * @summary Create license
     */
    create(request, requestBody) {
        return __awaiter(this, void 0, void 0, function* () {
            requestBody = license_schema_1.licenseCreateSchema.parse(requestBody);
            return this.licenseService.create({
                license: requestBody,
                userId: request.user.id,
            });
        });
    }
    /**
     * Read a license by ID.
     * @param licenseId License ID.
     * @param includeLogs Include logs for this license.
     * @returns The license.
     * @summary Read license
     */
    read(request, licenseId, includeLogs) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.licenseService.read({
                licenseId,
                checkUserId: request.user.id,
                includeLogs: includeLogs,
            });
        });
    }
    /**
     * Read a license by its license key.
     * @param licenseKey License key.
     * @param includeLogs Include logs for this license.
     * @returns The license.
     * @summary Read license by license key
     */
    readByLicenseKey(request, licenseKey, includeLogs) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.licenseService.readByLicenseKey({
                licenseKey,
                checkUserId: request.user.id,
                includeLogs: includeLogs,
            });
        });
    }
    /**
     * Update a license by ID.
     * @param licenseId License ID.
     * @returns The updated license.
     * @summary Update license
     */
    update(request, licenseId, requestBody) {
        return __awaiter(this, void 0, void 0, function* () {
            requestBody = license_schema_1.licenseCreateSchema.partial().parse(requestBody);
            return this.licenseService.update({
                checkUserId: request.user.id,
                license: Object.assign({ id: licenseId }, requestBody),
            });
        });
    }
    /**
     * Delete a license by ID.
     * @param licenseId License ID.
     * @returns The deleted license.
     * @summary Delete license
     */
    delete(request, licenseId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.licenseService.delete({
                checkUserId: request.user.id,
                licenseId,
            });
        });
    }
    /**
     * List licenses for the authenticated account.
     * @param take Number of licenses to take.
     * @isInt take
     * @param skip Number of licenses to skip.
     * @isInt skip
     * @param filterStatus Filter licenses by status.
     * @param includeLogs Include logs for each license.
     * @returns List of licenses and total count.
     * @security api_key
     * @summary List licenses
     */
    list(request, take = 10, skip = 0, filterStatus, includeLogs = false) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.licenseService.list({
                take: take !== null && take !== void 0 ? take : 10,
                skip: skip !== null && skip !== void 0 ? skip : 0,
                filterStatus,
                userId: request.user.id,
                includeLogs,
            });
        });
    }
};
__decorate([
    (0, tsoa_1.Security)("api_key"),
    (0, tsoa_1.Post)(),
    (0, tsoa_1.SuccessResponse)(201, "Created"),
    (0, tsoa_1.Response)("400", "License with same key already exists"),
    (0, tsoa_1.Response)(401, "Unauthorized"),
    (0, tsoa_1.Response)(422, "Invalid schema"),
    __param(0, (0, tsoa_1.Request)()),
    __param(1, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LicenseController.prototype, "create", null);
__decorate([
    (0, tsoa_1.Security)("api_key"),
    (0, tsoa_1.Get)("{licenseId}"),
    (0, tsoa_1.Response)(404, "License not found"),
    (0, tsoa_1.Response)(401, "Unauthorized"),
    (0, tsoa_1.Response)(422, "Invalid schema"),
    __param(0, (0, tsoa_1.Request)()),
    __param(1, (0, tsoa_1.Path)()),
    __param(2, (0, tsoa_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Boolean]),
    __metadata("design:returntype", Promise)
], LicenseController.prototype, "read", null);
__decorate([
    (0, tsoa_1.Security)("api_key"),
    (0, tsoa_1.Get)("key/{licenseKey}"),
    (0, tsoa_1.Response)(404, "License not found"),
    (0, tsoa_1.Response)(401, "Unauthorized"),
    (0, tsoa_1.Response)(422, "Invalid schema"),
    __param(0, (0, tsoa_1.Request)()),
    __param(1, (0, tsoa_1.Path)()),
    __param(2, (0, tsoa_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Boolean]),
    __metadata("design:returntype", Promise)
], LicenseController.prototype, "readByLicenseKey", null);
__decorate([
    (0, tsoa_1.Security)("api_key"),
    (0, tsoa_1.Patch)("{licenseId}"),
    (0, tsoa_1.Response)(404, "License not found"),
    (0, tsoa_1.Response)(401, "Unauthorized"),
    (0, tsoa_1.Response)(422, "Invalid schema"),
    __param(0, (0, tsoa_1.Request)()),
    __param(1, (0, tsoa_1.Path)()),
    __param(2, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", Promise)
], LicenseController.prototype, "update", null);
__decorate([
    (0, tsoa_1.Security)("api_key"),
    (0, tsoa_1.Delete)("{licenseId}"),
    (0, tsoa_1.Response)(404, "License not found"),
    (0, tsoa_1.Response)(401, "Unauthorized"),
    (0, tsoa_1.Response)(422, "Invalid schema"),
    __param(0, (0, tsoa_1.Request)()),
    __param(1, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], LicenseController.prototype, "delete", null);
__decorate([
    (0, tsoa_1.Security)("api_key"),
    (0, tsoa_1.Get)(),
    (0, tsoa_1.Response)(401, "Unauthorized"),
    (0, tsoa_1.Response)(422, "Invalid schema"),
    __param(0, (0, tsoa_1.Request)()),
    __param(1, (0, tsoa_1.Query)()),
    __param(2, (0, tsoa_1.Query)()),
    __param(3, (0, tsoa_1.Query)()),
    __param(4, (0, tsoa_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String, Boolean]),
    __metadata("design:returntype", Promise)
], LicenseController.prototype, "list", null);
LicenseController = __decorate([
    (0, tsoa_1.Route)("admin/licenses"),
    (0, tsoa_1.Tags)("Admin"),
    __metadata("design:paramtypes", [])
], LicenseController);
exports.LicenseController = LicenseController;
