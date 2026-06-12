import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../apps/api/src/app";

describe("Invoices API", () => {
  it("should list invoices", async () => {
    const response = await request(app)
      .get("/api/invoices")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should list invoices with pagination", async () => {
    const response = await request(app)
      .get("/api/invoices?page=1&pageSize=10")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body).toHaveProperty("total");
  });

  it("should list invoices by status", async () => {
    const response = await request(app)
      .get("/api/invoices?status=paid")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });


  it("should create an invoice", async () => {
    const response = await request(app)
      .post("/api/invoices")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        tenantId: "tenant-acme",
        amount: 999.99,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    
    expect(response.status).toBe(201);
    expect(response.body.amount).toBe(999.99);
    expect(response.body.status).toBe("pending");
  });

  it("should create an invoice with subscription", async () => {
    const response = await request(app)
      .post("/api/invoices")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        tenantId: "tenant-acme",
        subscriptionId: "sub-test",
        amount: 1999.00,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    
    expect(response.status).toBe(201);
    expect(response.body.subscriptionId).toBe("sub-test");
  });

  it("should reject creating invoice without tenantId", async () => {
    const response = await request(app)
      .post("/api/invoices")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        amount: 999.99
      });
    
    expect(response.status).toBe(400);
  });

  it("should reject creating invoice without amount", async () => {
    const response = await request(app)
      .post("/api/invoices")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        tenantId: "tenant-acme"
      });
    
    expect(response.status).toBe(400);
  });

  it("should reject creating invoice with negative amount", async () => {
    const response = await request(app)
      .post("/api/invoices")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        tenantId: "tenant-acme",
        amount: -100
      });
    
    expect(response.status).toBe(400);
  });

  it("should get an invoice by ID", async () => {
    const createResponse = await request(app)
      .post("/api/invoices")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        tenantId: "tenant-acme",
        amount: 499.99,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    
    const response = await request(app)
      .get(`/api/invoices/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createResponse.body.id);
    expect(response.body.amount).toBe(499.99);
  });

  it("should return 404 for non-existent invoice", async () => {
    const response = await request(app)
      .get("/api/invoices/non-existent-id")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(404);
  });

  it("should mark an invoice as paid", async () => {
    const createResponse = await request(app)
      .post("/api/invoices")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        tenantId: "tenant-acme",
        amount: 999.99,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    
    const response = await request(app)
      .post(`/api/invoices/${createResponse.body.id}/pay`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("paid");
    expect(response.body.paidAt).toBeDefined();
  });

  it("should refund an invoice", async () => {
    const createResponse = await request(app)
      .post("/api/invoices")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        tenantId: "tenant-acme",
        amount: 999.99,
        status: "paid",
        paidAt: new Date().toISOString()
      });
    
    const response = await request(app)
      .post(`/api/invoices/${createResponse.body.id}/refund`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("refunded");
  });

  it("should update an invoice", async () => {
    const createResponse = await request(app)
      .post("/api/invoices")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        tenantId: "tenant-acme",
        amount: 999.99,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    
    const response = await request(app)
      .put(`/api/invoices/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        amount: 1499.99,
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
      });
    
    expect(response.status).toBe(200);
    expect(response.body.amount).toBe(1499.99);
  });

  it("should partially update an invoice", async () => {
    const createResponse = await request(app)
      .post("/api/invoices")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        tenantId: "tenant-acme",
        amount: 999.99,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    
    const response = await request(app)
      .patch(`/api/invoices/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        amount: 1299.99
      });
    
    expect(response.status).toBe(200);
    expect(response.body.amount).toBe(1299.99);
  });

  it("should delete an invoice", async () => {
    const createResponse = await request(app)
      .post("/api/invoices")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        tenantId: "tenant-acme",
        amount: 999.99,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    
    const deleteResponse = await request(app)
      .delete(`/api/invoices/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(deleteResponse.status).toBe(204);
    
    const getResponse = await request(app)
      .get(`/api/invoices/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(getResponse.status).toBe(404);
  });

  it("should get invoice statistics", async () => {
    const response = await request(app)
      .get("/api/invoices/statistics")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("total");
    expect(response.body).toHaveProperty("paid");
    expect(response.body).toHaveProperty("pending");
    expect(response.body).toHaveProperty("overdue");
  });

  it("should get invoice statistics by status", async () => {
    const response = await request(app)
      .get("/api/invoices/statistics/status")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("paid");
    expect(response.body).toHaveProperty("pending");
    expect(response.body).toHaveProperty("overdue");
    expect(response.body).toHaveProperty("refunded");
  });

  it("should get invoice statistics by period", async () => {
    const response = await request(app)
      .get("/api/invoices/statistics/period")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("this_month");
    expect(response.body).toHaveProperty("last_month");
    expect(response.body).toHaveProperty("this_year");
  });

  it("should get invoice by subscription", async () => {
    const response = await request(app)
      .get("/api/invoices/subscription/sub-test")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should get invoices for a tenant", async () => {
    const response = await request(app)
      .get("/api/invoices/tenant/tenant-acme")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should generate invoice PDF", async () => {
    const createResponse = await request(app)
      .post("/api/invoices")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        tenantId: "tenant-acme",
        amount: 999.99,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    
    const response = await request(app)
      .get(`/api/invoices/${createResponse.body.id}/pdf`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
  });

  it("should send invoice notification", async () => {
    const createResponse = await request(app)
      .post("/api/invoices")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        tenantId: "tenant-acme",
        amount: 999.99,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    
    const response = await request(app)
      .post(`/api/invoices/${createResponse.body.id}/send`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body.sent).toBe(true);
  });
});

describe("Invoices API - 边界与异常路径", () => {
  const HEADERS = { "x-user-id": "u-platform", "x-tenant-id": "tenant-acme" };

  describe("POST /api/invoices - 缺少必填字段", () => {
    it("should return 400 when body is empty", async () => {
      const response = await request(app)
        .post("/api/invoices")
        .set(HEADERS)
        .send({});

      expect(response.status).toBe(400);
    });

    it("should return 400 when tenantId is empty string", async () => {
      const response = await request(app)
        .post("/api/invoices")
        .set(HEADERS)
        .send({ tenantId: "", amount: 100 });

      expect(response.status).toBe(400);
    });

    it("should return 400 when amount is -1", async () => {
      const response = await request(app)
        .post("/api/invoices")
        .set(HEADERS)
        .send({ tenantId: "tenant-acme", amount: -1 });

      expect(response.status).toBe(400);
    });

    it("should return 400 when amount is -999.99", async () => {
      const response = await request(app)
        .post("/api/invoices")
        .set(HEADERS)
        .send({ tenantId: "tenant-acme", amount: -999.99 });

      expect(response.status).toBe(400);
    });
  });

  describe("PUT /api/invoices/:id - 更新不存在的发票", () => {
    it("should return 404 when updating non-existent invoice", async () => {
      const response = await request(app)
        .put("/api/invoices/non-existent-id")
        .set(HEADERS)
        .send({ amount: 100 });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/invoices/:id - 删除不存在的发票", () => {
    it("should return 404 when deleting non-existent invoice", async () => {
      const response = await request(app)
        .delete("/api/invoices/non-existent-id")
        .set(HEADERS);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/invoices/:id/pay - 支付不存在的发票", () => {
    it("should return 404 when paying non-existent invoice", async () => {
      const response = await request(app)
        .post("/api/invoices/non-existent-id/pay")
        .set(HEADERS);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/invoices/:id/refund - 退款不存在的发票", () => {
    it("should return 404 when refunding non-existent invoice", async () => {
      const response = await request(app)
        .post("/api/invoices/non-existent-id/refund")
        .set(HEADERS);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/invoices - 无效金额格式", () => {
    it("should return 400 when amount is negative float", async () => {
      const response = await request(app)
        .post("/api/invoices")
        .set(HEADERS)
        .send({ tenantId: "tenant-acme", amount: -0.01 });

      expect(response.status).toBe(400);
    });

    it("should return 400 when amount is -100", async () => {
      const response = await request(app)
        .post("/api/invoices")
        .set(HEADERS)
        .send({ tenantId: "tenant-acme", amount: -100 });

      expect(response.status).toBe(400);
    });


  });
});