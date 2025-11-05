/// <reference path="./types/env.d.ts" />
import "dotenv-safe/config";
import "reflect-metadata";

import * as trpcExpress from "@trpc/server/adapters/express";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import Stripe from "stripe";
import { authExpressMiddleware } from "./controller/auth-flows";
import { setupRateLimitReplenishCron } from "./controller/license-rate-limit";
import { appRouter } from "./routers/_app";
import { RegisterRoutes } from "./tsoa-generated/routes";
import { ShowError } from "./utils/ShowError";
import { tsoaErrorHandler } from "./utils/tsoa-response-error";
import { handleStripeWebhook } from "./webhooks/stripe-handler";
import { handlePayPalWebhook } from "./webhooks/paypal-handler";

const app = express();

// 🔔 Stripe Webhook Endpoint (MUST be before express.json())
// This endpoint needs raw body for signature verification
app.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      console.error("[Webhook] Missing stripe-signature header");
      return res.status(400).send("Missing signature");
    }

    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2023-10-16",
      });

      // Verify webhook signature
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      console.log(`[Webhook] ✅ Verified event: ${event.type}`);

      // Handle the webhook event
      const result = await handleStripeWebhook(event);

      if (result.success) {
        console.log(`[Webhook] ✅ Processed successfully: ${result.message}`);
        return res.json({ received: true, message: result.message });
      } else {
        console.error(`[Webhook] ❌ Processing failed: ${result.message}`);
        return res.status(400).json({ error: result.message });
      }
    } catch (err: any) {
      console.error(`[Webhook] ❌ Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

// 🔔 PayPal Webhook Endpoint
// PayPal sends JSON, but we need to verify signature
app.post(
  "/webhooks/paypal",
  express.json({
    verify: (req: any, res, buf) => {
      // Store raw body for signature verification
      req.rawBody = buf.toString("utf8");
    },
  }),
  async (req, res) => {
    console.log("[PayPal Webhook] Received webhook event");

    try {
      // Handle the webhook event
      const result = await handlePayPalWebhook(req.body);

      if (result.success) {
        console.log(`[PayPal Webhook] ✅ Processed: ${result.message}`);
        return res.json({ received: true, message: result.message });
      } else {
        console.error(`[PayPal Webhook] ❌ Failed: ${result.message}`);
        return res.status(400).json({ error: result.message });
      }
    } catch (err: any) {
      console.error(`[PayPal Webhook] ❌ Error: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
  }
);

app.use(
  "/trpc",
  cors({ origin: process.env.CORS_ORIGIN.split(","), credentials: true })
);

const allCors = cors({ origin: "*" });
const urlencoded = express.urlencoded({
  extended: true,
});
const json = express.json();

app.use((req, res, next) => {
  if (req.url.startsWith("/trpc")) return next();
  // Skip auth for webhook endpoints
  if (req.url.startsWith("/webhooks/")) return next();
  allCors(req, res, () => {
    urlencoded(req, res, () => {
      json(req, res, next);
    });
  });
});

app.use(cookieParser());

// Skip auth middleware for webhooks
app.use((req, res, next) => {
  if (req.url.startsWith("/webhooks/")) return next();
  authExpressMiddleware(req, res, next);
});

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: ({ req, res }) => {
      return { userId: req.userId, res };
    },
    onError(data) {
      if (
        data.error.message?.startsWith("error.") ||
        data.error.message?.startsWith("+ ")
      )
        return;

      console.error(data.error);
      data.error.message = ShowError.internalServerError().message;
    },
  })
);

setupRateLimitReplenishCron();

RegisterRoutes(app);

app.use(tsoaErrorHandler);

app.listen(process.env.PORT, () => {
  console.log(`\n📄 Server ready on port ${process.env.PORT}\n`);
});
