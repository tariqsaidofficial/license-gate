import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface WebhookLogParams {
  provider: 'stripe' | 'paypal' | 'ziina';
  eventType: string;
  eventId: string;
  payload: any;
}

/**
 * Log webhook event to database
 * This helps track all payment events and debugging
 */
export async function logWebhookEvent(params: WebhookLogParams): Promise<void> {
  try {
    await prisma.webhookEvent.create({
      data: {
        provider: params.provider,
        eventType: params.eventType,
        eventId: params.eventId,
        payload: params.payload,
        status: 'pending',
      },
    });

    console.log(`[Webhook] Logged ${params.provider} event:`, params.eventType);
  } catch (error) {
    console.error('[Webhook] Failed to log event:', error);
    // Don't throw - logging failure shouldn't stop processing
  }
}

/**
 * Update webhook event status after processing
 */
export async function updateWebhookEventStatus(
  eventId: string,
  status: 'processed' | 'failed',
  errorMessage?: string
): Promise<void> {
  try {
    await prisma.webhookEvent.update({
      where: { eventId },
      data: {
        status,
        errorMessage: errorMessage ?? null,
        processedAt: new Date(),
      },
    });

    console.log(`[Webhook] Updated event ${eventId} to ${status}`);
  } catch (error) {
    console.error('[Webhook] Failed to update status:', error);
  }
}

/**
 * Check if event has already been processed (idempotency)
 * Prevents duplicate processing of the same webhook
 */
export async function isEventProcessed(eventId: string): Promise<boolean> {
  const event = await prisma.webhookEvent.findUnique({
    where: { eventId },
  });

  return event?.status === 'processed';
}

export { WebhookLogParams };
