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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = void 0;
const nodemailer_1 = require("nodemailer");
const fs_1 = __importDefault(require("fs"));
const mailer = (0, nodemailer_1.createTransport)({
    host: process.env.SMTP_HOST,
    port: Number.parseInt(process.env.SMTP_PORT),
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
    },
});
function sendMail(email, subject, templateName, templateVariables) {
    return __awaiter(this, void 0, void 0, function* () {
        const mailTemplate = fs_1.default.readFileSync(`src/assets/mail/${templateName}.html`, "utf8");
        const mailBody = Object.keys(templateVariables).reduce((acc, key) => {
            return acc.replace(new RegExp(`{{${key.toUpperCase()}}}`, "g"), templateVariables[key]);
        }, mailTemplate);
        return new Promise((resolve, reject) => {
            mailer.sendMail({
                from: process.env.SMTP_SENDER,
                to: email,
                subject: subject,
                html: mailBody,
            }, (err, info) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(info);
                }
            });
        });
    });
}
exports.sendMail = sendMail;
