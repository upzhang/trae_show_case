import { beforeEach, describe, expect, it } from "vitest";

import app from "../../apps/api/src/app";
import { resetStore } from "../../apps/api/src/store";

beforeEach(() => {
  resetStore();
});

describe("health check", () => {
  it("returns OK", async () => {
    const res = await (await import("supertest")).default(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("now");
  });
});

describe("session", () => {
  it("returns 401 without x-user-id header", async () => {
    const request = (await import("supertest")).default(app);
    const res = await request.get("/api/session/me");
    expect(res.status).toBe(401);
  });

  it("returns session for platform admin", async () => {
    const request = (await import("supertest")).default(app);
    const res = await request.get("/api/session/me").set("x-user-id", "u-platform");
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("platform@example.com");
    expect(Array.isArray(res.body.roles)).toBe(true);
  });
});

describe("RBAC: permissions", () => {
  it("rejects tenant_admin access to audit-logs", async () => {
    const request = (await import("supertest")).default(app);
    const res = await request.get("/api/audit-logs").set("x-user-id", "u-tenant-admin");
    expect(res.status).toBe(403);
  });

  it("allows auditor access to audit-logs", async () => {
    const request = (await import("supertest")).default(app);
    const res = await request.get("/api/audit-logs").set("x-user-id", "u-auditor");
    expect(res.status).toBe(200);
  });
});

describe("enterprise realism: tenants, risks, and activities", () => {
  it("returns enriched tenant business profiles", async () => {
    const request = (await import("supertest")).default(app);
    const res = await request.get("/api/tenants").set("x-user-id", "u-platform");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(20);
    expect(res.body[0]).toMatchObject({
      industry: expect.any(String),
      healthScore: expect.any(Number),
      contractEndsAt: expect.any(String),
      customerSuccessManager: expect.any(String),
      seatsUsed: expect.any(Number),
      seatsLimit: expect.any(Number),
      monthlyActiveUsers: expect.any(Number),
      arr: expect.any(Number)
    });
  });

  it("requires tenant:view before returning support risk queue", async () => {
    const request = (await import("supertest")).default(app);
    const res = await request.get("/api/support-risks").set("x-user-id", "unknown-user");
    expect(res.status).toBe(401);
  });

  it("returns support risk queue for authorized users", async () => {
    const request = (await import("supertest")).default(app);
    const res = await request.get("/api/support-risks").set("x-user-id", "u-platform");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(40);
    expect(res.body[0]).toMatchObject({
      id: expect.any(String),
      tenantId: expect.any(String),
      title: expect.any(String),
      severity: expect.stringMatching(/critical|high|medium|low/),
      status: expect.stringMatching(/open|in_progress|waiting_customer|resolved/),
      slaDueAt: expect.any(String),
      ownerId: expect.any(String)
    });
  });

  it("returns recent activity feed for authorized users", async () => {
    const request = (await import("supertest")).default(app);
    const res = await request.get("/api/activity-events").set("x-user-id", "u-platform");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(180);
    expect(res.body[0]).toMatchObject({
      id: expect.any(String),
      tenantId: expect.any(String),
      type: expect.stringMatching(/user|approval|release|audit|risk/),
      title: expect.any(String),
      actorId: expect.any(String),
      createdAt: expect.any(String)
    });
  });
});

describe("audit logs: empty summary", () => {
  // 预置缺陷 5 验证：写操作生成的审计摘要为空
  it("produces audit log entries (some may have empty summary)", async () => {
    const request = (await import("supertest")).default(app);
    await request.put("/api/releases/rel-20260601/deploy").set("x-user-id", "u-release");
    const res = await request.get("/api/audit-logs").set("x-user-id", "u-auditor");
    expect(res.status).toBe(200);
    const logs = res.body as Array<{ action: string; summary: string }>;
    const hasDeploy = logs.some((item) => item.action === "release.deployed");
    expect(hasDeploy).toBe(true);
  });
});

describe("authentication: missing headers", () => {
  it("returns 401 when no x-user-id header on protected endpoint", async () => {
    const request = (await import("supertest")).default(app);
    const res = await request.get("/api/users");
    expect(res.status).toBe(401);
  });

  it("returns 401 when no x-user-id header on tenant endpoint", async () => {
    const request = (await import("supertest")).default(app);
    const res = await request.get("/api/tenants");
    expect(res.status).toBe(401);
  });

  it("returns 401 when no x-user-id header on approvals endpoint", async () => {
    const request = (await import("supertest")).default(app);
    const res = await request.get("/api/approvals");
    expect(res.status).toBe(401);
  });
});

describe("tenant: invalid tenant-id", () => {
  it("returns 404 for non-existent tenant detail", async () => {
    const request = (await import("supertest")).default(app);
    const res = await request
      .get("/api/tenants/non-existent-tenant-id")
      .set("x-user-id", "u-platform");
    expect(res.status).toBe(404);
  });

  it("returns 404 for non-existent tenant plan update", async () => {
    const request = (await import("supertest")).default(app);
    const res = await request
      .put("/api/tenants/non-existent-tenant-id/plan")
      .set("x-user-id", "u-platform")
      .send({ plan: "enterprise" });
    expect(res.status).toBe(404);
  });
});

describe("concurrent requests", () => {
  it("handles multiple concurrent health checks", async () => {
    const request = (await import("supertest")).default(app);
    const results = await Promise.all(
      Array.from({ length: 10 }, () => request.get("/health"))
    );
    results.forEach((res) => {
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("now");
    });
  });

  it("handles concurrent session requests with same user", async () => {
    const request = (await import("supertest")).default(app);
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        request.get("/api/session/me").set("x-user-id", "u-platform")
      )
    );
    results.forEach((res) => {
      expect(res.status).toBe(200);
      expect(res.body.email).toBe("platform@example.com");
    });
  });
});

describe("validation: empty request body", () => {
  it("returns 400 when creating user with empty body", async () => {
    const request = (await import("supertest")).default(app);
    const res = await request
      .post("/api/users")
      .set("x-user-id", "u-platform")
      .send({});
    expect(res.status).toBe(400);
  });

  it("returns 400 when creating approval with empty body", async () => {
    const request = (await import("supertest")).default(app);
    const res = await request
      .post("/api/approvals")
      .set("x-user-id", "u-platform")
      .send({});
    expect(res.status).toBe(400);
  });
});
