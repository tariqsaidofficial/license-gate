import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { router } from "../trpc";
import { adminRouter } from "./admin";
import { apiKeyRouter } from "./apiKey";
import { authRouter } from "./auth";
import { licenseRouter } from "./license";
import { logsRouter } from "./logs";
import { verificationRouter } from "./verification";

export const appRouter = router({
  auth: authRouter,
  license: licenseRouter,
  logs: logsRouter,
  apiKey: apiKeyRouter,
  verification: verificationRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
export type RouterOutput = inferRouterOutputs<AppRouter>;
export type RouterInput = inferRouterInputs<AppRouter>;
