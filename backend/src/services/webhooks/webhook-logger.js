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
exports.isEventProcessed = exports.updateWebhookEventStatus = exports.logWebhookEvent = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Log webhook event to database
 * This helps track all payment events and debugging
 */
function logWebhookEvent(params) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield prisma.webhookEvent.create({
                data: {
                    provider: params.provider,
                    eventType: params.eventType,
                    eventId: params.eventId,
                    payload: params.payload,
                    status: 'pending',
                },
            });
            console.log(`[Webhook] Logged ${params.provider} event:`, params.eventType);
        }
        catch (error) {
            console.error('[Webhook] Failed to log event:', error);
            // Don't throw - logging failure shouldn't stop processing
        }
    });
}
exports.logWebhookEvent = logWebhookEvent;
/**
 * Update webhook event status after processing
 */
function updateWebhookEventStatus(eventId, status, errorMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield prisma.webhookEvent.update({
                where: { eventId },
                data: {
                    status,
                    errorMessage: errorMessage !== null && errorMessage !== void 0 ? errorMessage : null,
                    processedAt: new Date(),
                },
            });
            console.log(`[Webhook] Updated event ${eventId} to ${status}`);
        }
        catch (error) {
            console.error('[Webhook] Failed to update status:', error);
        }
    });
}
exports.updateWebhookEventStatus = updateWebhookEventStatus;
/**
 * Check if event has already been processed (idempotency)
 * Prevents duplicate processing of the same webhook
 */
function isEventProcessed(eventId) {
    return __awaiter(this, void 0, void 0, function* () {
        const event = yield prisma.webhookEvent.findUnique({
            where: { eventId },
        });
        return (event === null || event === void 0 ? void 0 : event.status) === 'processed';
    });
}
exports.isEventProcessed = isEventProcessed;
