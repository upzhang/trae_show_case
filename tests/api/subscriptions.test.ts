import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../apps/api/src/app";

describe("Subscriptions API", () => {
  it("should list subscriptions", async () => {
    const response = await request(app)
      .get("/api/subscriptions")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should list subscriptions with pagination", async () => {
    const response = await request(app)
      .get("/api/subscriptions?page=1&pageSize=10")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body).toHaveProperty("total");
  });

  it("should list subscriptions by status", async () => {
    const response = await request(app)
      .get("/api/subscriptions?status=active")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should list subscriptions by plan", async () => {
    const response = await request(app)
      .get("/api/subscriptions?plan=pro")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should create a subscription", async () => {
    const response = await request(app)
      .post("/api/subscriptions")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        tenantId: "tenant-acme",
        plan: "pro",
        seats: 10,
        monthlyRate: 999
      });
    
    expect(response.status).toBe(201);
    expect(response.body.plan).toBe("pro");
    expect(response.body.seats).toBe(10);
    expect(response.body.status).toBe("active");
  });

  it("should create an enterprise subscription", async () => {
    const response = await request(app)
      .post("/api/subscriptions")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        tenantId: "tenant-acme",
        plan: "enterprise",
        seats: 100,
        monthlyRate: 9999
      });
    
    expect(response.status).toBe(201);
    expect(response.body.plan).toBe("enterprise");
    expect(response.body.seats).toBe(100);
  });

  it("should create a free subscription", async () => {
    const response = await request(app)
      .post("/api/subscriptions")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        tenantId: "tenant-acme",
        plan: "free",
        seats: 3,
        monthlyRate: 0
      });
    
    expect(response.status).toBe(201);
    expect(response.body.plan).toBe("free");
    expect(response.body.monthlyRate).toBe(0);
  });

  it("should reject creating subscription without tenantId", async () => {
    const response = await request(app)
      .post("/api/subscriptions")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        plan: "pro",
        seats: 10
      });
    
    expect(response.status).toBe(400);
  });

  it("should reject creating subscription without plan", async () => {
    const response = await request(app)
      .post("/api/subscriptions")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        tenantId: "tenant-acme",
        seats: 10
      });
    
    expect(response.status).toBe(400);
  });

  it("should reject creating subscription with invalid plan", async () => {
    const response = await request(app)
      .post("/api/subscriptions")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        tenantId: "tenant-acme",
        plan: "invalid",
        seats: 10
      });
    
    expect(response.status).toBe(400);
  });

  it("should get a subscription by ID", async () => {
    const createResponse = await request(app)
      .post("/api/subscriptions")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        tenantId: "tenant-acme",
        plan: "pro",
        seats: 5,
        monthlyRate: 499
      });
    
    const response = await request(app)
      .get(`/api/subscriptions/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createResponse.body.id);
    expect(response.body.plan).toBe("pro");
  });

  it("should return 404 for non-existent subscription", async () => {
    const response = await request(app)
      .get("/api/subscriptions/non-existent-id")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(404);
  });

  it("should update a subscription", async () => {
    const createResponse = await request(app)
      .post("/api/subscriptions")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        tenantId: "tenant-acme",
        plan: "pro",
        seats: 10,
        monthlyRate: 999
      });
    
    const response = await request(app)
      .put(`/api/subscriptions/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        seats: 20,
        monthlyRate: 1999
      });
    
    expect(response.status).toBe(200);
    expect(response.body.seats).toBe(20);
    expect(response.body.monthlyRate).toBe(1999);
  });

  it("should partially update a subscription", async () => {
    const createResponse = await request(app)
      .post("/api/subscriptions")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        tenantId: "tenant-acme",
        plan: "pro",
        seats: 10,
        monthlyRate: 999
      });
    
    const response = await request(app)
      .patch(`/api/subscriptions/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        seats: 15
      });
    
    expect(response.status).toBe(200);
    expect(response.body.seats).toBe(15);
    expect(response.body.monthlyRate).toBe(999);
  });

  it("should cancel a subscription", async () => {
    const createResponse = await request(app)
      .post("/api/subscriptions")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        tenantId: "tenant-acme",
        plan: "pro",
        seats: 10,
        monthlyRate: 999
      });
    
    const response = await request(app)
      .post(`/api/subscriptions/${createResponse.body.id}/cancel`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("cancelled");
  });

  it("should renew a subscription", async () => {
    const createResponse = await request(app)
      .post("/api/subscriptions")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        tenantId: "tenant-acme",
        plan: "pro",
        seats: 10,
        monthlyRate: 999,
        status: "expired"
      });
    
    const response = await request(app)
      .post(`/api/subscriptions/${createResponse.body.id}/renew`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("active");
  });

  it("should upgrade a subscription", async () => {
    const createResponse = await request(app)
      .post("/api/subscriptions")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        tenantId: "tenant-acme",
        plan: "pro",
        seats: 10,
        monthlyRate: 999
      });
    
    const response = await request(app)
      .post(`/api/subscriptions/${createResponse.body.id}/upgrade`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        plan: "enterprise",
        seats: 50,
        monthlyRate: 4999
      });
    
    expect(response.status).toBe(200);
    expect(response.body.plan).toBe("enterprise");
    expect(response.body.seats).toBe(50);
  });

  it("should downgrade a subscription", async () => {
    const createResponse = await request(app)
      .post("/api/subscriptions")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        tenantId: "tenant-acme",
        plan: "enterprise",
        seats: 100,
        monthlyRate: 9999
      });
    
    const response = await request(app)
      .post(`/api/subscriptions/${createResponse.body.id}/downgrade`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        plan: "pro",
        seats: 20,
        monthlyRate: 1999
      });
    
    expect(response.status).toBe(200);
    expect(response.body.plan).toBe("pro");
    expect(response.body.seats).toBe(20);
  });

  it("should delete a subscription", async () => {
    const createResponse = await request(app)
      .post("/api/subscriptions")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        tenantId: "tenant-acme",
        plan: "free",
        seats: 3,
        monthlyRate: 0
      });
    
    const deleteResponse = await request(app)
      .delete(`/api/subscriptions/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(deleteResponse.status).toBe(204);
    
    const getResponse = await request(app)
      .get(`/api/subscriptions/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(getResponse.status).toBe(404);
  });

  it("should get subscription history", async () => {
    const createResponse = await request(app)
      .post("/api/subscriptions")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        tenantId: "tenant-acme",
        plan: "pro",
        seats: 10,
        monthlyRate: 999
      });
    
    const response = await request(app)
      .get(`/api/subscriptions/${createResponse.body.id}/history`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
  });

  it("should get subscription statistics", async () => {
    const response = await request(app)
      .get("/api/subscriptions/statistics")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("total");
    expect(response.body).toHaveProperty("active");
    expect(response.body).toHaveProperty("revenue");
  });

  it("should get subscription statistics by plan", async () => {
    const response = await request(app)
      .get("/api/subscriptions/statistics/plan")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("free");
    expect(response.body).toHaveProperty("pro");
    expect(response.body).toHaveProperty("enterprise");
  });
});

describe("Subscriptions API - 边界与异常路径", () => {
  const HEADERS = { "x-user-id": "u-platform", "x-tenant-id": "tenant-acme" };

  describe("POST /api/subscriptions/:id/renew - 续费不存在的订阅", () => {
    it("should return 404 when renewing non-existent subscription", async () => {
      const response = await request(app)
        .post("/api/subscriptions/non-existent-id/renew")
        .set(HEADERS);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/subscriptions/:id/upgrade - 升级不存在的订阅", () => {
    it("should return 404 when upgrading non-existent subscription", async () => {
      const response = await request(app)
        .post("/api/subscriptions/non-existent-id/upgrade")
        .set(HEADERS)
        .send({ plan: "enterprise", seats: 50, monthlyRate: 4999 });

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/subscriptions/:id/downgrade - 降级不存在的订阅", () => {
    it("should return 404 when downgrading non-existent subscription", async () => {
      const response = await request(app)
        .post("/api/subscriptions/non-existent-id/downgrade")
        .set(HEADERS)
        .send({ plan: "free", seats: 3, monthlyRate: 0 });

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/subscriptions/:id/cancel - 取消不存在的订阅", () => {
    it("should return 404 when cancelling non-existent subscription", async () => {
      const response = await request(app)
        .post("/api/subscriptions/non-existent-id/cancel")
        .set(HEADERS);

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/subscriptions/:id/history - 获取历史不存在的订阅", () => {
    it("should return 404 when getting history of non-existent subscription", async () => {
      const response = await request(app)
        .get("/api/subscriptions/non-existent-id/history")
        .set(HEADERS);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/subscriptions - 无效计划名称", () => {
    it("should return 400 when plan is not in allowed list", async () => {
      const response = await request(app)
        .post("/api/subscriptions")
        .set(HEADERS)
        .send({ tenantId: "tenant-acme", plan: "platinum", seats: 10, monthlyRate: 999 });

      expect(response.status).toBe(400);
    });

    it("should return 400 when plan is empty string", async () => {
      const response = await request(app)
        .post("/api/subscriptions")
        .set(HEADERS)
        .send({ tenantId: "tenant-acme", plan: "", seats: 10, monthlyRate: 999 });

      expect(response.status).toBe(400);
    });

    it("should return 400 when plan is null", async () => {
      const response = await request(app)
        .post("/api/subscriptions")
        .set(HEADERS)
        .send({ tenantId: "tenant-acme", plan: null, seats: 10, monthlyRate: 999 });

      expect(response.status).toBe(400);
    });

    it("should return 400 when plan is numeric string", async () => {
      const response = await request(app)
        .post("/api/subscriptions")
        .set(HEADERS)
        .send({ tenantId: "tenant-acme", plan: "12345", seats: 10, monthlyRate: 999 });

      expect(response.status).toBe(400);
    });
  });
});