"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hexToUserId = exports.userIdToHex = void 0;
const HEX_OFFSET = parseInt(process.env.HEX_USER_ID_OFFSET, 16);
function userIdToHex(userId) {
    return (userId + HEX_OFFSET).toString(16);
}
exports.userIdToHex = userIdToHex;
function hexToUserId(hex) {
    return parseInt(hex, 16) - HEX_OFFSET;
}
exports.hexToUserId = hexToUserId;
