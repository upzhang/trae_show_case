import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../apps/api/src/app";
import { tenants, users, approvals, releases, supportRisks, tickets, subscriptions } from "../../apps/api/src/store";

const HEADERS = {
  "x-user-id": "u-platform",
  "x-tenant-id": "tenant-acme",
};

describe("Metrics API", () => {
  beforeAll(() => {
    tenants.reset();
    users.reset();
    approvals.reset();
    releases.reset();
    supportRisks.reset();
    tickets.reset();
    subscriptions.reset();
  });

  afterAll(() => {
    tenants.reset();
    users.reset();
    approvals.reset();
    releases.reset();
    supportRisks.reset();
    tickets.reset();
    subscriptions.reset();
  });

  describe("GET /api/metrics/overview", () => {
    it("should return overview with at least 8 metrics", async () => {
      const res = await request(app)
        .get("/api/metrics/overview")
        .set(HEADERS);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("totalTenants");
      expect(res.body).toHaveProperty("activeTenants");
      expect(res.body).toHaveProperty("totalUsers");
      expect(res.body).toHaveProperty("totalApprovals");
      expect(res.body).toHaveProperty("approvalRate");
      expect(res.body).toHaveProperty("totalReleases");
      expect(res.body).toHaveProperty("releaseSuccessRate");
      expect(res.body).toHaveProperty("totalTickets");
      expect(res.body).toHaveProperty("openTickets");
      expect(res.body).toHaveProperty("totalRisks");
      expect(res.body).toHaveProperty("criticalRisks");
      expect(res.body).toHaveProperty("mrr");
      expect(res.body).toHaveProperty("mrrGrowth");
      expect(res.body).toHaveProperty("activeSubscriptions");
      expect(res.body).toHaveProperty("trialSubscriptions");

      expect(typeof res.body.totalTenants).toBe("number");
      expect(typeof res.body.approvalRate).toBe("number");
      expect(typeof res.body.mrr).toBe("number");
    });
  });

  describe("GET /api/metrics/trends", () => {
    it("should return trend data points", async () => {
      const res = await request(app)
        .get("/api/metrics/trends?range=30d")
        .set(HEADERS);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty("date");
      expect(res.body[0]).toHaveProperty("value");
    });

    it("should support 7d range", async () => {
      const res = await request(app)
        .get("/api/metrics/trends?range=7d")
        .set(HEADERS);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(8);
    });

    it("should support 90d range", async () => {
      const res = await request(app)
        .get("/api/metrics/trends?range=90d")
        .set(HEADERS);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(91);
    });
  });

  describe("GET /api/metrics/health", () => {
    it("should return health distribution", async () => {
      const res = await request(app)
        .get("/api/metrics/health")
        .set(HEADERS);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("good");
      expect(res.body).toHaveProperty("watch");
      expect(res.body).toHaveProperty("risk");
      expect(typeof res.body.good).toBe("number");
    });
  });

  describe("GET /api/metrics/releases", () => {
    it("should return release statistics", async () => {
      const res = await request(app)
        .get("/api/metrics/releases")
        .set(HEADERS);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("total");
      expect(res.body).toHaveProperty("deployed");
      expect(res.body).toHaveProperty("rolledBack");
      expect(res.body).toHaveProperty("pending");
      expect(res.body).toHaveProperty("byEnvironment");
    });
  });

  describe("GET /api/metrics/approvals", () => {
    it("should return approval statistics", async () => {
      const res = await request(app)
        .get("/api/metrics/approvals")
        .set(HEADERS);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("total");
      expect(res.body).toHaveProperty("approved");
      expect(res.body).toHaveProperty("rejected");
      expect(res.body).toHaveProperty("pending");
      expect(res.body).toHaveProperty("avgResponseHours");
    });
  });

  describe("GET /api/metrics/trends — range variations", () => {
    it("should return 8 data points for 7d range", async () => {
      const res = await request(app)
        .get("/api/metrics/trends?range=7d")
        .set(HEADERS);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(8);
      expect(res.body[0]).toHaveProperty("date");
      expect(res.body[0]).toHaveProperty("value");
    });

    it("should return 31 data points for 30d range", async () => {
      const res = await request(app)
        .get("/api/metrics/trends?range=30d")
        .set(HEADERS);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(31);
    });

    it("should return 91 data points for 90d range", async () => {
      const res = await request(app)
        .get("/api/metrics/trends?range=90d")
        .set(HEADERS);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(91);
    });

    it("should default to 30d when no range parameter is provided", async () => {
      const res = await request(app)
        .get("/api/metrics/trends")
        .set(HEADERS);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(31);
    });
  });

  describe("GET /api/metrics/health — data structure", () => {
    it("should return correct health distribution structure", async () => {
      const res = await request(app)
        .get("/api/metrics/health")
        .set(HEADERS);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("good");
      expect(res.body).toHaveProperty("watch");
      expect(res.body).toHaveProperty("risk");
      expect(typeof res.body.good).toBe("number");
      expect(typeof res.body.watch).toBe("number");
      expect(typeof res.body.risk).toBe("number");
      expect(res.body.good + res.body.watch + res.body.risk).toBeGreaterThan(0);
    });
  });

  describe("authentication: overview without auth", () => {
    it("should return 401 when no x-user-id header on overview", async () => {
      const res = await request(app)
        .get("/api/metrics/overview");

      expect(res.status).toBe(401);
    });

    it("should return 401 when no x-user-id header on trends", async () => {
      const res = await request(app)
        .get("/api/metrics/trends");

      expect(res.status).toBe(401);
    });

    it("should return 401 when no x-user-id header on health", async () => {
      const res = await request(app)
        .get("/api/metrics/health");

      expect(res.status).toBe(401);
    });

    it("should return 401 when no x-user-id header on releases", async () => {
      const res = await request(app)
        .get("/api/metrics/releases");

      expect(res.status).toBe(401);
    });


  });
});
