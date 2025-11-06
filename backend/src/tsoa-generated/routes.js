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
exports.RegisterRoutes = void 0;
const runtime_1 = require("@tsoa/runtime");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const license_controller_1 = require("./../routers/public/license.controller");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const license_verify_controller_1 = require("./../routers/public/license-verify.controller");
const authentication_1 = require("./../routers/public/authentication");
const expressAuthenticationRecasted = authentication_1.expressAuthentication;
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const models = {
    "ReplenishInterval": {
        "dataType": "refAlias",
        "type": { "dataType": "union", "subSchemas": [{ "dataType": "enum", "enums": ["TEN_SECONDS"] }, { "dataType": "enum", "enums": ["MINUTE"] }, { "dataType": "enum", "enums": ["HOUR"] }, { "dataType": "enum", "enums": ["DAY"] }], "validators": {} },
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "License": {
        "dataType": "refObject",
        "properties": {
            "id": { "dataType": "integer", "required": true },
            "active": { "dataType": "boolean", "required": true },
            "userId": { "dataType": "integer", "required": true },
            "licenseKey": { "dataType": "string", "required": true },
            "name": { "dataType": "string", "required": true },
            "notes": { "dataType": "string", "required": true },
            "ipLimit": { "dataType": "union", "subSchemas": [{ "dataType": "integer" }, { "dataType": "enum", "enums": [null] }], "required": true },
            "licenseScope": { "dataType": "union", "subSchemas": [{ "dataType": "string" }, { "dataType": "enum", "enums": [null] }], "required": true },
            "expirationDate": { "dataType": "union", "subSchemas": [{ "dataType": "datetime" }, { "dataType": "enum", "enums": [null] }], "required": true },
            "validationPoints": { "dataType": "union", "subSchemas": [{ "dataType": "double" }, { "dataType": "enum", "enums": [null] }], "required": true },
            "validationLimit": { "dataType": "union", "subSchemas": [{ "dataType": "integer" }, { "dataType": "enum", "enums": [null] }], "required": true },
            "replenishAmount": { "dataType": "union", "subSchemas": [{ "dataType": "integer" }, { "dataType": "enum", "enums": [null] }], "required": true },
            "replenishInterval": { "dataType": "union", "subSchemas": [{ "ref": "ReplenishInterval" }, { "dataType": "enum", "enums": [null] }], "required": true },
            "createdAt": { "dataType": "datetime", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResponseError_license-with-same-key-already-exists_": {
        "dataType": "refObject",
        "properties": {
            "error": { "dataType": "enum", "enums": ["license-with-same-key-already-exists"], "required": true },
            "details": { "dataType": "any", "default": {}, "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResponseError_unauthorized_": {
        "dataType": "refObject",
        "properties": {
            "error": { "dataType": "enum", "enums": ["unauthorized"], "required": true },
            "details": { "dataType": "any", "default": {}, "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResponseError_invalid-schema_": {
        "dataType": "refObject",
        "properties": {
            "error": { "dataType": "enum", "enums": ["invalid-schema"], "required": true },
            "details": { "dataType": "any", "default": {}, "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LicenseCreateInput": {
        "dataType": "refObject",
        "properties": {
            "active": { "dataType": "boolean", "required": true },
            "licenseKey": { "dataType": "string" },
            "name": { "dataType": "string", "required": true },
            "notes": { "dataType": "string", "required": true },
            "ipLimit": { "dataType": "union", "subSchemas": [{ "dataType": "integer" }, { "dataType": "enum", "enums": [null] }], "default": null },
            "licenseScope": { "dataType": "union", "subSchemas": [{ "dataType": "string" }, { "dataType": "enum", "enums": [null] }], "default": null },
            "expirationDate": { "dataType": "union", "subSchemas": [{ "dataType": "datetime" }, { "dataType": "enum", "enums": [null] }], "default": null },
            "validationPoints": { "dataType": "union", "subSchemas": [{ "dataType": "double" }, { "dataType": "enum", "enums": [null] }], "default": null },
            "validationLimit": { "dataType": "union", "subSchemas": [{ "dataType": "integer" }, { "dataType": "enum", "enums": [null] }], "default": null },
            "replenishAmount": { "dataType": "union", "subSchemas": [{ "dataType": "integer" }, { "dataType": "enum", "enums": [null] }], "default": null },
            "replenishInterval": { "dataType": "union", "subSchemas": [{ "ref": "ReplenishInterval" }, { "dataType": "enum", "enums": [null] }], "default": null },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResponseError_not-found_": {
        "dataType": "refObject",
        "properties": {
            "error": { "dataType": "enum", "enums": ["not-found"], "required": true },
            "details": { "dataType": "any", "default": {}, "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LicenseUpdateInput": {
        "dataType": "refObject",
        "properties": {
            "active": { "dataType": "boolean" },
            "licenseKey": { "dataType": "string" },
            "name": { "dataType": "string" },
            "notes": { "dataType": "string" },
            "ipLimit": { "dataType": "integer" },
            "licenseScope": { "dataType": "string" },
            "expirationDate": { "dataType": "datetime" },
            "validationPoints": { "dataType": "double" },
            "validationLimit": { "dataType": "integer" },
            "replenishAmount": { "dataType": "integer" },
            "replenishInterval": { "ref": "ReplenishInterval" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ValidationResult": {
        "dataType": "refAlias",
        "type": { "dataType": "union", "subSchemas": [{ "dataType": "enum", "enums": ["VALID"] }, { "dataType": "enum", "enums": ["NOT_FOUND"] }, { "dataType": "enum", "enums": ["NOT_ACTIVE"] }, { "dataType": "enum", "enums": ["EXPIRED"] }, { "dataType": "enum", "enums": ["LICENSE_SCOPE_FAILED"] }, { "dataType": "enum", "enums": ["IP_LIMIT_EXCEEDED"] }, { "dataType": "enum", "enums": ["RATE_LIMIT_EXCEEDED"] }], "validators": {} },
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ValidationResponse": {
        "dataType": "refObject",
        "properties": {
            "valid": { "dataType": "boolean", "required": true },
            "result": { "ref": "ValidationResult", "required": true },
            "signedChallenge": { "dataType": "string" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "VerificationOptions": {
        "dataType": "refObject",
        "properties": {
            "scope": { "dataType": "string" },
            "challenge": { "dataType": "string" },
            "metadata": { "dataType": "string" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new runtime_1.ExpressTemplateService(models, { "noImplicitAdditionalProperties": "throw-on-extras", "bodyCoercion": true });
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
function RegisterRoutes(app) {
    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################
    const argsLicenseController_create = {
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "LicenseCreateInput" },
    };
    app.post('/admin/licenses', authenticateMiddleware([{ "api_key": [] }]), ...((0, runtime_1.fetchMiddlewares)(license_controller_1.LicenseController)), ...((0, runtime_1.fetchMiddlewares)(license_controller_1.LicenseController.prototype.create)), function LicenseController_create(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
            let validatedArgs = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLicenseController_create, request, response });
                const controller = new license_controller_1.LicenseController();
                yield templateService.apiHandler({
                    methodName: 'create',
                    controller,
                    response,
                    next,
                    validatedArgs,
                    successStatus: 201,
                });
            }
            catch (err) {
                return next(err);
            }
        });
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsLicenseController_read = {
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
        licenseId: { "in": "path", "name": "licenseId", "required": true, "dataType": "double" },
        includeLogs: { "in": "query", "name": "includeLogs", "dataType": "boolean" },
    };
    app.get('/admin/licenses/:licenseId', authenticateMiddleware([{ "api_key": [] }]), ...((0, runtime_1.fetchMiddlewares)(license_controller_1.LicenseController)), ...((0, runtime_1.fetchMiddlewares)(license_controller_1.LicenseController.prototype.read)), function LicenseController_read(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
            let validatedArgs = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLicenseController_read, request, response });
                const controller = new license_controller_1.LicenseController();
                yield templateService.apiHandler({
                    methodName: 'read',
                    controller,
                    response,
                    next,
                    validatedArgs,
                    successStatus: undefined,
                });
            }
            catch (err) {
                return next(err);
            }
        });
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsLicenseController_readByLicenseKey = {
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
        licenseKey: { "in": "path", "name": "licenseKey", "required": true, "dataType": "string" },
        includeLogs: { "in": "query", "name": "includeLogs", "dataType": "boolean" },
    };
    app.get('/admin/licenses/key/:licenseKey', authenticateMiddleware([{ "api_key": [] }]), ...((0, runtime_1.fetchMiddlewares)(license_controller_1.LicenseController)), ...((0, runtime_1.fetchMiddlewares)(license_controller_1.LicenseController.prototype.readByLicenseKey)), function LicenseController_readByLicenseKey(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
            let validatedArgs = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLicenseController_readByLicenseKey, request, response });
                const controller = new license_controller_1.LicenseController();
                yield templateService.apiHandler({
                    methodName: 'readByLicenseKey',
                    controller,
                    response,
                    next,
                    validatedArgs,
                    successStatus: undefined,
                });
            }
            catch (err) {
                return next(err);
            }
        });
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsLicenseController_update = {
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
        licenseId: { "in": "path", "name": "licenseId", "required": true, "dataType": "double" },
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "LicenseUpdateInput" },
    };
    app.patch('/admin/licenses/:licenseId', authenticateMiddleware([{ "api_key": [] }]), ...((0, runtime_1.fetchMiddlewares)(license_controller_1.LicenseController)), ...((0, runtime_1.fetchMiddlewares)(license_controller_1.LicenseController.prototype.update)), function LicenseController_update(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
            let validatedArgs = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLicenseController_update, request, response });
                const controller = new license_controller_1.LicenseController();
                yield templateService.apiHandler({
                    methodName: 'update',
                    controller,
                    response,
                    next,
                    validatedArgs,
                    successStatus: undefined,
                });
            }
            catch (err) {
                return next(err);
            }
        });
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsLicenseController_delete = {
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
        licenseId: { "in": "path", "name": "licenseId", "required": true, "dataType": "double" },
    };
    app.delete('/admin/licenses/:licenseId', authenticateMiddleware([{ "api_key": [] }]), ...((0, runtime_1.fetchMiddlewares)(license_controller_1.LicenseController)), ...((0, runtime_1.fetchMiddlewares)(license_controller_1.LicenseController.prototype.delete)), function LicenseController_delete(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
            let validatedArgs = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLicenseController_delete, request, response });
                const controller = new license_controller_1.LicenseController();
                yield templateService.apiHandler({
                    methodName: 'delete',
                    controller,
                    response,
                    next,
                    validatedArgs,
                    successStatus: undefined,
                });
            }
            catch (err) {
                return next(err);
            }
        });
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsLicenseController_list = {
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
        take: { "default": 10, "in": "query", "name": "take", "dataType": "integer", "validators": { "isInt": { "errorMsg": "take" } } },
        skip: { "default": 0, "in": "query", "name": "skip", "dataType": "integer", "validators": { "isInt": { "errorMsg": "skip" } } },
        filterStatus: { "in": "query", "name": "filterStatus", "dataType": "union", "subSchemas": [{ "dataType": "enum", "enums": ["active"] }, { "dataType": "enum", "enums": ["disabled/expired"] }] },
        includeLogs: { "default": false, "in": "query", "name": "includeLogs", "dataType": "boolean" },
    };
    app.get('/admin/licenses', authenticateMiddleware([{ "api_key": [] }]), ...((0, runtime_1.fetchMiddlewares)(license_controller_1.LicenseController)), ...((0, runtime_1.fetchMiddlewares)(license_controller_1.LicenseController.prototype.list)), function LicenseController_list(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
            let validatedArgs = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLicenseController_list, request, response });
                const controller = new license_controller_1.LicenseController();
                yield templateService.apiHandler({
                    methodName: 'list',
                    controller,
                    response,
                    next,
                    validatedArgs,
                    successStatus: undefined,
                });
            }
            catch (err) {
                return next(err);
            }
        });
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsLicenseVerifyController_verifyLicenseGet = {
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
        userId: { "in": "path", "name": "userId", "required": true, "dataType": "string" },
        licenseKey: { "in": "path", "name": "licenseKey", "required": true, "dataType": "string" },
        scope: { "in": "query", "name": "scope", "dataType": "string" },
        challenge: { "in": "query", "name": "challenge", "dataType": "string" },
        metadata: { "in": "query", "name": "metadata", "dataType": "string" },
    };
    app.get('/license/:userId/:licenseKey/verify', ...((0, runtime_1.fetchMiddlewares)(license_verify_controller_1.LicenseVerifyController)), ...((0, runtime_1.fetchMiddlewares)(license_verify_controller_1.LicenseVerifyController.prototype.verifyLicenseGet)), function LicenseVerifyController_verifyLicenseGet(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
            let validatedArgs = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLicenseVerifyController_verifyLicenseGet, request, response });
                const controller = new license_verify_controller_1.LicenseVerifyController();
                yield templateService.apiHandler({
                    methodName: 'verifyLicenseGet',
                    controller,
                    response,
                    next,
                    validatedArgs,
                    successStatus: undefined,
                });
            }
            catch (err) {
                return next(err);
            }
        });
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsLicenseVerifyController_verifyLicensePost = {
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
        userId: { "in": "path", "name": "userId", "required": true, "dataType": "string" },
        licenseKey: { "in": "path", "name": "licenseKey", "required": true, "dataType": "string" },
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "VerificationOptions" },
    };
    app.post('/license/:userId/:licenseKey/verify', ...((0, runtime_1.fetchMiddlewares)(license_verify_controller_1.LicenseVerifyController)), ...((0, runtime_1.fetchMiddlewares)(license_verify_controller_1.LicenseVerifyController.prototype.verifyLicensePost)), function LicenseVerifyController_verifyLicensePost(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
            let validatedArgs = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLicenseVerifyController_verifyLicensePost, request, response });
                const controller = new license_verify_controller_1.LicenseVerifyController();
                yield templateService.apiHandler({
                    methodName: 'verifyLicensePost',
                    controller,
                    response,
                    next,
                    validatedArgs,
                    successStatus: undefined,
                });
            }
            catch (err) {
                return next(err);
            }
        });
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    function authenticateMiddleware(security = []) {
        return function runAuthenticationMiddleware(request, response, next) {
            return __awaiter(this, void 0, void 0, function* () {
                // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
                // keep track of failed auth attempts so we can hand back the most
                // recent one.  This behavior was previously existing so preserving it
                // here
                const failedAttempts = [];
                const pushAndRethrow = (error) => {
                    failedAttempts.push(error);
                    throw error;
                };
                const secMethodOrPromises = [];
                for (const secMethod of security) {
                    if (Object.keys(secMethod).length > 1) {
                        const secMethodAndPromises = [];
                        for (const name in secMethod) {
                            secMethodAndPromises.push(expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow));
                        }
                        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
                        secMethodOrPromises.push(Promise.all(secMethodAndPromises)
                            .then(users => { return users[0]; }));
                    }
                    else {
                        for (const name in secMethod) {
                            secMethodOrPromises.push(expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow));
                        }
                    }
                }
                // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
                try {
                    request['user'] = yield Promise.any(secMethodOrPromises);
                    // Response was sent in middleware, abort
                    if (response.writableEnded) {
                        return;
                    }
                    next();
                }
                catch (err) {
                    // Show most recent error as response
                    const error = failedAttempts.pop();
                    error.status = error.status || 401;
                    // Response was sent in middleware, abort
                    if (response.writableEnded) {
                        return;
                    }
                    next(error);
                }
                // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
            });
        };
    }
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}
exports.RegisterRoutes = RegisterRoutes;
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
