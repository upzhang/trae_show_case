import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", now: new Date().toISOString() });
});

export default router;
