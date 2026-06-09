import cors from "cors";
import express from "express";

import { resolveCurrentUser } from "./middleware/auth";
import approvalsRouter from "./routes/approvals";
import auditLogsRouter from "./routes/audit";
import healthRouter from "./routes/health";
import releasesRouter from "./routes/releases";
import sessionRouter from "./routes/session";
import tenantsRouter from "./routes/tenants";
import usersRouter from "./routes/users";

const app = express();

app.use(cors());
app.use(express.json());
app.use(resolveCurrentUser);

app.use(healthRouter);
app.use(sessionRouter);
app.use(tenantsRouter);
app.use(usersRouter);
app.use(approvalsRouter);
app.use(releasesRouter);
app.use(auditLogsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "route not found", path: req.path });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[api] unhandled error", err);
  res.status(500).json({ error: "internal server error", message: err.message });
});

export default app;
