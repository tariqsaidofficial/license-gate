"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShowError = void 0;
class ShowError extends Error {
    constructor(message, type) {
        super(`+ ${message}`);
        this.type = type;
    }
    static internalServerError() {
        return new ShowError("Something went wrong, please try again later.", "internal-server-error");
    }
}
exports.ShowError = ShowError;
