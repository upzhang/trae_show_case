import cors from "cors";
import express from "express";

import { resolveCurrentUser } from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler";
import { apiRateLimiter as rateLimit } from "./middleware/rate-limit";
import { requestLogger } from "./middleware/request-logger";
import activityEventsRouter from "./routes/activity-events";
import approvalsRouter from "./routes/approvals";
import auditLogsRouter from "./routes/audit";
import featuresRouter from "./routes/features";
import healthRouter from "./routes/health";
import integrationsRouter from "./routes/integrations";
import invoicesRouter from "./routes/invoices";
import metricsRouter from "./routes/metrics";
import notificationsRouter from "./routes/notifications";
import releasesRouter from "./routes/releases";
import rolesRouter from "./routes/roles";
import sessionRouter from "./routes/session";
import subscriptionsRouter from "./routes/subscriptions";
import supportRisksRouter from "./routes/support-risks";
import teamsRouter from "./routes/teams";
import tenantsRouter from "./routes/tenants";
import ticketsRouter from "./routes/tickets";
import tokensRouter from "./routes/tokens";
import usersRouter from "./routes/users";
import webhooksRouter from "./routes/webhooks";

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger());
app.use(resolveCurrentUser);
app.use(rateLimit);

app.use(healthRouter);
app.use(sessionRouter);
app.use(tenantsRouter);
app.use(usersRouter);
app.use(approvalsRouter);
app.use(releasesRouter);
app.use(auditLogsRouter);
app.use(supportRisksRouter);
app.use(activityEventsRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/tokens", tokensRouter);
app.use("/api/teams", teamsRouter);
app.use("/api/integrations", integrationsRouter);
app.use("/api/features", featuresRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/subscriptions", subscriptionsRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/notifications", notificationsRouter);
app.use(metricsRouter);
app.use(rolesRouter);

app.use(errorHandler);

export default app;
