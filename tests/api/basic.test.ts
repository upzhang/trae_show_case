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

describe("approvals: status consistency", () => {
  it("can approve a pending approval", async () => {
    const request = (await import("supertest")).default(app);
    const res = await request
      .put("/api/approvals/ap-1001/approve")
      .set("x-user-id", "u-release");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("approved");
  });

  // 预置缺陷 3 验证：重复审批不被拦截
  // 正确行为：4xx 或状态保持不变
  it("allows repeated approve (known issue — should be rejected by status machine)", async () => {
    const request = (await import("supertest")).default(app);
    const first = await request
      .put("/api/approvals/ap-1002/approve")
      .set("x-user-id", "u-release");
    const second = await request
      .put("/api/approvals/ap-1002/approve")
      .set("x-user-id", "u-release");
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    // 以上为当前实际行为，正确修复后应让第二个请求失败
  });
});

describe("releases: contract drift", () => {
  it("releases list contains description field not defined in shared types (known issue)", async () => {
    const request = (await import("supertest")).default(app);
    const res = await request.get("/api/releases").set("x-user-id", "u-platform");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const first = res.body[0];
    // 预置缺陷 2 验证：shared 类型中无 description 字段
    expect(first).toHaveProperty("description");
  });
});

describe("enterprise realism: tenants, risks, and activities", () => {
  it("returns enriched tenant business profiles", async () => {
    const request = (await import("supertest")).default(app);
    const res = await request.get("/api/tenants").set("x-user-id", "u-platform");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
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
    expect(res.body).toHaveLength(5);
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
    expect(res.body).toHaveLength(8);
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

describe("users: roles permission", () => {
  // 预置缺陷 1 验证：tenant_admin 调用 PUT /api/users/:id/roles 能成功，
  // 但按 RBAC 矩阵该操作需要 role:edit（只有 platform_admin 拥有）
  it("currently allows tenant_admin to update another user roles (known issue)", async () => {
    const request = (await import("supertest")).default(app);
    const res = await request
      .put("/api/users/u-auditor/roles")
      .set("x-user-id", "u-tenant-admin")
      .send({ roles: ["member"] });
    expect(res.status).toBe(200);
    // 以上为当前实际行为，正确修复后应为 403
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
