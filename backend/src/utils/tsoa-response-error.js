"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tsoaErrorHandler = void 0;
const tsoa_1 = require("tsoa");
const ShowError_1 = require("./ShowError");
function tsoaErrorHandler(err, req, res, next) {
    var _a;
    if (err instanceof tsoa_1.ValidateError) {
        return res.status(422).json({
            error: "invalid-schema",
            details: err === null || err === void 0 ? void 0 : err.fields,
        });
    }
    if (err instanceof ShowError_1.ShowError) {
        let statusCode = err.type === "not-found"
            ? 404
            : err.type === "invalid-schema"
                ? 422
                : err.type === "unauthorized"
                    ? 401
                    : err.type === "internal-server-error"
                        ? 500
                        : 400;
        return res.status(statusCode).json({
            error: err.type,
            details: (_a = err.message) === null || _a === void 0 ? void 0 : _a.replace("+ ", ""),
        });
    }
    if (err instanceof Error) {
        console.error(err);
        return res.status(500).json({
            error: "internal-server-error",
            details: "Internal Server Error",
        });
    }
    next();
}
exports.tsoaErrorHandler = tsoaErrorHandler;
