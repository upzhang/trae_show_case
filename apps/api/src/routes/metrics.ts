import { Router } from "express";
import { requirePermission } from "../middleware/rbac";
import * as metricService from "../services/metric-service";

const router = Router();

/** GET /api/metrics/overview — 平台总览指标 */
router.get("/api/metrics/overview", requirePermission("metric:read"), (_req, res) => {
  const overview = metricService.getOverview();
  res.json(overview);
});

/** GET /api/metrics/trends — 趋势数据 */
router.get("/api/metrics/trends", requirePermission("metric:read"), (req, res) => {
  const range = (req.query.range as string) || "30d";
  const trends = metricService.getTrends(range);
  res.json(trends);
});

/** GET /api/metrics/health — 健康分布 */
router.get("/api/metrics/health", requirePermission("metric:read"), (_req, res) => {
  const health = metricService.getHealthDistribution();
  res.json(health);
});

/** GET /api/metrics/releases — 发布统计 */
router.get("/api/metrics/releases", requirePermission("metric:read"), (_req, res) => {
  const stats = metricService.getReleaseStats();
  res.json(stats);
});

/** GET /api/metrics/approvals — 审批统计 */
router.get("/api/metrics/approvals", requirePermission("metric:read"), (_req, res) => {
  const stats = metricService.getApprovalStats();
  res.json(stats);
});

export default router;
