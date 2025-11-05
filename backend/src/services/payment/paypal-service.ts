/**
 * PayPal Service - Payment Processing with PayPal
 * Uses PayPal Sandbox for testing
 */

import paypal from '@paypal/checkout-server-sdk';

/**
 * Configure PayPal Environment (Sandbox/Production)
 */
function getPayPalEnvironment() {
  const clientId = process.env.PAYPAL_CLIENT_ID || '';
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';

  if (process.env.PAYPAL_MODE === 'production') {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  } else {
    // Sandbox mode (default for testing)
    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
  }
}

/**
 * Create PayPal HTTP Client
 */
function getPayPalClient() {
  return new paypal.core.PayPalHttpClient(getPayPalEnvironment());
}

/**
 * Create PayPal Order for License Purchase
 */
export async function createPayPalOrder(params: {
  email: string;
  productName: string;
  amount: number;
  currency: string;
  licenseConfig: {
    planName: string;
    duration?: number;
    validationLimit?: number;
    ipLimit?: number;
    scopes?: string[];
  };
  returnUrl?: string;
  cancelUrl?: string;
}) {
  const client = getPayPalClient();
  const request = new paypal.orders.OrdersCreateRequest();

  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: params.currency.toUpperCase(),
          value: params.amount.toFixed(2),
        },
        description: params.productName,
        custom_id: JSON.stringify({
          email: params.email,
          licenseConfig: params.licenseConfig,
        }),
      },
    ],
    application_context: {
      brand_name: 'LicenseGate',
      landing_page: 'BILLING',
      user_action: 'PAY_NOW',
      return_url: params.returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
      cancel_url: params.cancelUrl || `${process.env.FRONTEND_URL}/payment/cancel`,
    },
  });

  try {
    const order = await client.execute(request);
    console.log('[PayPal] Order created:', order.result.id);

    // Find approval URL
    const approvalUrl = order.result.links?.find(
      (link: any) => link.rel === 'approve'
    )?.href;

    return {
      orderId: order.result.id,
      approvalUrl,
      status: order.result.status,
      links: order.result.links,
    };
  } catch (error: any) {
    console.error('[PayPal] Error creating order:', error);
    throw new Error(`PayPal order creation failed: ${error.message}`);
  }
}

/**
 * Capture PayPal Order (Complete Payment)
 */
export async function capturePayPalOrder(orderId: string) {
  const client = getPayPalClient();
  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  // @ts-ignore - PayPal SDK type issue
  request.requestBody({});

  try {
    const capture = await client.execute(request);
    console.log('[PayPal] Order captured:', orderId);

    return {
      orderId: capture.result.id,
      status: capture.result.status,
      payerId: capture.result.payer?.payer_id,
      email: capture.result.payer?.email_address,
      captureId: capture.result.purchase_units?.[0]?.payments?.captures?.[0]?.id,
      amount: capture.result.purchase_units?.[0]?.payments?.captures?.[0]?.amount,
    };
  } catch (error: any) {
    console.error('[PayPal] Error capturing order:', error);
    throw new Error(`PayPal capture failed: ${error.message}`);
  }
}

/**
 * Get PayPal Order Details
 */
export async function getPayPalOrder(orderId: string) {
  const client = getPayPalClient();
  const request = new paypal.orders.OrdersGetRequest(orderId);

  try {
    const order = await client.execute(request);
    return {
      orderId: order.result.id,
      status: order.result.status,
      customId: order.result.purchase_units?.[0]?.custom_id,
      amount: order.result.purchase_units?.[0]?.amount,
      payer: order.result.payer,
    };
  } catch (error: any) {
    console.error('[PayPal] Error getting order:', error);
    throw new Error(`PayPal get order failed: ${error.message}`);
  }
}

/**
 * Verify PayPal Webhook Signature
 */
export async function verifyPayPalWebhook(params: {
  webhookId: string;
  webhookEvent: any;
  headers: any;
}) {
  const client = getPayPalClient();

  try {
    const request = {
      path: '/v1/notifications/verify-webhook-signature',
      verb: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        transmission_id: params.headers['paypal-transmission-id'],
        transmission_time: params.headers['paypal-transmission-time'],
        cert_url: params.headers['paypal-cert-url'],
        auth_algo: params.headers['paypal-auth-algo'],
        transmission_sig: params.headers['paypal-transmission-sig'],
        webhook_id: params.webhookId,
        webhook_event: params.webhookEvent,
      },
    };

    const response = await client.execute(request as any);
    return response.result.verification_status === 'SUCCESS';
  } catch (error: any) {
    console.error('[PayPal] Webhook verification failed:', error);
    return false;
  }
}
