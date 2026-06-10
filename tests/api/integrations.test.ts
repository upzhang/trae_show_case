import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../apps/api/src/app";

describe("Integrations API", () => {
  it("should list integrations", async () => {
    const response = await request(app)
      .get("/api/integrations")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should list integrations with pagination", async () => {
    const response = await request(app)
      .get("/api/integrations?page=1&pageSize=10")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body).toHaveProperty("total");
  });

  it("should list integrations by type", async () => {
    const response = await request(app)
      .get("/api/integrations?type=slack")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should create an integration", async () => {
    const response = await request(app)
      .post("/api/integrations")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        type: "slack",
        name: "Slack Integration",
        config: {
          webhookUrl: "https://hooks.slack.com/services/test"
        }
      });
    
    expect(response.status).toBe(201);
    expect(response.body.type).toBe("slack");
    expect(response.body.name).toBe("Slack Integration");
    expect(response.body.status).toBe("not_configured");
  });

  it("should create a github integration", async () => {
    const response = await request(app)
      .post("/api/integrations")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        type: "github",
        name: "GitHub Integration",
        config: {
          repo: "org/repo",
          token: "ghp_test"
        }
      });
    
    expect(response.status).toBe(201);
    expect(response.body.type).toBe("github");
  });

  it("should create a jira integration", async () => {
    const response = await request(app)
      .post("/api/integrations")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        type: "jira",
        name: "Jira Integration",
        config: {
          url: "https://jira.example.com",
          projectKey: "PROJ"
        }
      });
    
    expect(response.status).toBe(201);
    expect(response.body.type).toBe("jira");
  });

  it("should reject creating integration without name", async () => {
    const response = await request(app)
      .post("/api/integrations")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        type: "slack",
        config: {}
      });
    
    expect(response.status).toBe(400);
  });

  it("should reject creating integration without type", async () => {
    const response = await request(app)
      .post("/api/integrations")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Test Integration",
        config: {}
      });
    
    expect(response.status).toBe(400);
  });

  it("should reject creating integration with invalid type", async () => {
    const response = await request(app)
      .post("/api/integrations")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        type: "invalid_type",
        name: "Invalid Integration",
        config: {}
      });
    
    expect(response.status).toBe(400);
  });

  it("should get an integration by ID", async () => {
    const createResponse = await request(app)
      .post("/api/integrations")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        type: "webhook",
        name: "Get Test",
        config: { url: "https://example.com" }
      });
    
    const response = await request(app)
      .get(`/api/integrations/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createResponse.body.id);
    expect(response.body.name).toBe("Get Test");
  });

  it("should return 404 for non-existent integration", async () => {
    const response = await request(app)
      .get("/api/integrations/non-existent-id")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(404);
  });

  it("should update an integration", async () => {
    const createResponse = await request(app)
      .post("/api/integrations")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        type: "slack",
        name: "Update Test",
        config: { webhookUrl: "https://hooks.slack.com/services/original" }
      });
    
    const response = await request(app)
      .put(`/api/integrations/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Updated Integration",
        config: { webhookUrl: "https://hooks.slack.com/services/updated" }
      });
    
    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Updated Integration");
    expect(response.body.config.webhookUrl).toBe("https://hooks.slack.com/services/updated");
  });

  it("should partially update an integration", async () => {
    const createResponse = await request(app)
      .post("/api/integrations")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        type: "github",
        name: "Patch Test",
        config: { repo: "org/repo" }
      });
    
    const response = await request(app)
      .patch(`/api/integrations/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Patched Integration"
      });
    
    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Patched Integration");
    expect(response.body.config.repo).toBe("org/repo");
  });

  it("should connect an integration", async () => {
    const createResponse = await request(app)
      .post("/api/integrations")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        type: "slack",
        name: "Connect Test",
        config: { webhookUrl: "https://hooks.slack.com/services/test" }
      });
    
    const response = await request(app)
      .post(`/api/integrations/${createResponse.body.id}/connect`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("connected");
  });

  it("should disconnect an integration", async () => {
    const createResponse = await request(app)
      .post("/api/integrations")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        type: "slack",
        name: "Disconnect Test",
        config: { webhookUrl: "https://hooks.slack.com/services/test" }
      });
    
    await request(app)
      .post(`/api/integrations/${createResponse.body.id}/connect`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    const response = await request(app)
      .post(`/api/integrations/${createResponse.body.id}/disconnect`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("not_configured");
  });

  it("should sync an integration", async () => {
    const createResponse = await request(app)
      .post("/api/integrations")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        type: "github",
        name: "Sync Test",
        config: { repo: "org/repo" }
      });
    
    await request(app)
      .post(`/api/integrations/${createResponse.body.id}/connect`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    const response = await request(app)
      .post(`/api/integrations/${createResponse.body.id}/sync`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("syncedAt");
  });

  it("should delete an integration", async () => {
    const createResponse = await request(app)
      .post("/api/integrations")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        type: "webhook",
        name: "Delete Test",
        config: { url: "https://example.com" }
      });
    
    const deleteResponse = await request(app)
      .delete(`/api/integrations/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(deleteResponse.status).toBe(204);
    
    const getResponse = await request(app)
      .get(`/api/integrations/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(getResponse.status).toBe(404);
  });

  it("should get integration sync history", async () => {
    const createResponse = await request(app)
      .post("/api/integrations")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        type: "jira",
        name: "History Test",
        config: { url: "https://jira.example.com" }
      });
    
    await request(app)
      .post(`/api/integrations/${createResponse.body.id}/connect`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    await request(app)
      .post(`/api/integrations/${createResponse.body.id}/sync`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    const response = await request(app)
      .get(`/api/integrations/${createResponse.body.id}/sync-history`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
  });

  it("should get available integration types", async () => {
    const response = await request(app)
      .get("/api/integrations/types")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });
});

describe("Integrations API - 边界与异常路径", () => {
  const HEADERS = { "x-user-id": "u-platform", "x-tenant-id": "tenant-acme" };

  describe("POST /api/integrations - 缺少必填字段", () => {
    it("should return 400 when body is empty", async () => {
      const response = await request(app)
        .post("/api/integrations")
        .set(HEADERS)
        .send({});

      expect(response.status).toBe(400);
    });

    it("should return 400 when name is empty string", async () => {
      const response = await request(app)
        .post("/api/integrations")
        .set(HEADERS)
        .send({ type: "slack", name: "", config: {} });

      expect(response.status).toBe(400);
    });

    it("should return 400 when name exceeds 100 characters", async () => {
      const response = await request(app)
        .post("/api/integrations")
        .set(HEADERS)
        .send({
          type: "slack",
          name: "a".repeat(101),
          config: {}
        });

      expect(response.status).toBe(400);
    });

    it("should return 400 when type is empty string", async () => {
      const response = await request(app)
        .post("/api/integrations")
        .set(HEADERS)
        .send({ type: "", name: "Test", config: {} });

      expect(response.status).toBe(400);
    });
  });

  describe("PUT /api/integrations/:id - 更新不存在的集成", () => {
    it("should return 404 when updating non-existent integration", async () => {
      const response = await request(app)
        .put("/api/integrations/non-existent-id")
        .set(HEADERS)
        .send({ name: "Updated", config: {} });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/integrations/:id - 删除不存在的集成", () => {
    it("should return 404 when deleting non-existent integration", async () => {
      const response = await request(app)
        .delete("/api/integrations/non-existent-id")
        .set(HEADERS);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/integrations/:id/connect - 测试连接不存在的集成", () => {
    it("should return 404 when connecting non-existent integration", async () => {
      const response = await request(app)
        .post("/api/integrations/non-existent-id/connect")
        .set(HEADERS);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/integrations/:id/sync - 同步不存在的集成", () => {
    it("should return 404 when syncing non-existent integration", async () => {
      const response = await request(app)
        .post("/api/integrations/non-existent-id/sync")
        .set(HEADERS);

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/integrations/:id/sync-history - 获取同步历史不存在的集成", () => {
    it("should return 404 when getting sync history of non-existent integration", async () => {
      const response = await request(app)
        .get("/api/integrations/non-existent-id/sync-history")
        .set(HEADERS);

      expect(response.status).toBe(404);
    });
  });
});