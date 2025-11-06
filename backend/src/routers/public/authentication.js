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
exports.expressAuthentication = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../../prisma");
function expressAuthentication(request, securityName, scopes, response) {
    return __awaiter(this, void 0, void 0, function* () {
        if (securityName === "api_key") {
            // Get API key from request
            const apiKeyStr = request.headers.authorization || request.query["api_key"];
            //Check if api key is present, otherwise return 401
            if (apiKeyStr != undefined) {
                const apiKeyParsed = zod_1.z.string().parse(apiKeyStr);
                const apiKey = yield prisma_1.prisma.apiKey.findUnique({
                    where: { key: apiKeyParsed },
                    select: { userId: true },
                });
                // Check if the API key is valid
                if (apiKey) {
                    return Promise.resolve({
                        id: apiKey.userId,
                    });
                }
            }
            response
                .status(401)
                .send({
                error: "unauthorized",
                details: "Invalid API key",
            });
            return Promise.reject({});
        }
    });
}
exports.expressAuthentication = expressAuthentication;
