import request from "supertest";
import app from "../../apps/api/src/app";

describe("Webhooks API", () => {
  it("should list webhooks", async () => {
    const response = await request(app)
      .get("/api/webhooks")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should list webhooks with pagination", async () => {
    const response = await request(app)
      .get("/api/webhooks?page=1&pageSize=10")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body).toHaveProperty("total");
    expect(response.body).toHaveProperty("page");
    expect(response.body).toHaveProperty("pageSize");
  });

  it("should list webhooks with filtering by event", async () => {
    const response = await request(app)
      .get("/api/webhooks?event=approvals.created")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should list webhooks with filtering by status", async () => {
    const response = await request(app)
      .get("/api/webhooks?status=active")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should create a webhook", async () => {
    const response = await request(app)
      .post("/api/webhooks")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Test Webhook",
        url: "https://example.com/webhook",
        events: ["approvals.created", "approvals.approved"]
      });
    
    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Test Webhook");
    expect(response.body.url).toBe("https://example.com/webhook");
    expect(response.body.events).toEqual(["approvals.created", "approvals.approved"]);
    expect(response.body.isActive).toBe(true);
  });

  it("should create a webhook with secret", async () => {
    const response = await request(app)
      .post("/api/webhooks")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Webhook with Secret",
        url: "https://example.com/secret",
        events: ["test.event"],
        secret: "my-secret-key"
      });
    
    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Webhook with Secret");
  });

  it("should reject creating webhook with invalid URL", async () => {
    const response = await request(app)
      .post("/api/webhooks")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Invalid URL",
        url: "not-a-url",
        events: ["test.event"]
      });
    
    expect(response.status).toBe(400);
  });

  it("should reject creating webhook without required fields", async () => {
    const response = await request(app)
      .post("/api/webhooks")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        url: "https://example.com/webhook"
      });
    
    expect(response.status).toBe(400);
  });

  it("should get a webhook by ID", async () => {
    const createResponse = await request(app)
      .post("/api/webhooks")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Get Test",
        url: "https://example.com/get",
        events: ["test.event"]
      });
    
    const response = await request(app)
      .get(`/api/webhooks/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createResponse.body.id);
    expect(response.body.name).toBe("Get Test");
  });

  it("should return 404 for non-existent webhook", async () => {
    const response = await request(app)
      .get("/api/webhooks/non-existent-id")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(404);
  });

  it("should update a webhook", async () => {
    const createResponse = await request(app)
      .post("/api/webhooks")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Update Test",
        url: "https://example.com/update",
        events: ["test.event"]
      });
    
    const response = await request(app)
      .put(`/api/webhooks/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Updated Webhook",
        url: "https://example.com/updated",
        events: ["updated.event"]
      });
    
    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Updated Webhook");
    expect(response.body.url).toBe("https://example.com/updated");
  });

  it("should partially update a webhook", async () => {
    const createResponse = await request(app)
      .post("/api/webhooks")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Patch Test",
        url: "https://example.com/patch",
        events: ["test.event"]
      });
    
    const response = await request(app)
      .patch(`/api/webhooks/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Patched Webhook"
      });
    
    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Patched Webhook");
    expect(response.body.url).toBe("https://example.com/patch");
  });

  it("should disable a webhook", async () => {
    const createResponse = await request(app)
      .post("/api/webhooks")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Disable Test",
        url: "https://example.com/disable",
        events: ["test.event"]
      });
    
    const response = await request(app)
      .patch(`/api/webhooks/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        isActive: false
      });
    
    expect(response.status).toBe(200);
    expect(response.body.isActive).toBe(false);
  });

  it("should delete a webhook", async () => {
    const createResponse = await request(app)
      .post("/api/webhooks")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Delete Test",
        url: "https://example.com/delete",
        events: ["test.event"]
      });
    
    const deleteResponse = await request(app)
      .delete(`/api/webhooks/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(deleteResponse.status).toBe(204);
    
    const getResponse = await request(app)
      .get(`/api/webhooks/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(getResponse.status).toBe(404);
  });

  it("should return 404 when deleting non-existent webhook", async () => {
    const response = await request(app)
      .delete("/api/webhooks/non-existent-id")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(404);
  });

  it("should test a webhook", async () => {
    const createResponse = await request(app)
      .post("/api/webhooks")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Test Webhook",
        url: "https://example.com/test",
        events: ["test.event"]
      });
    
    const response = await request(app)
      .post(`/api/webhooks/${createResponse.body.id}/test`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success");
  });

  it("should get webhook delivery history", async () => {
    const createResponse = await request(app)
      .post("/api/webhooks")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "History Test",
        url: "https://example.com/history",
        events: ["test.event"]
      });
    
    const response = await request(app)
      .get(`/api/webhooks/${createResponse.body.id}/deliveries`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
  });

  it("should retry webhook delivery", async () => {
    const createResponse = await request(app)
      .post("/api/webhooks")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Retry Test",
        url: "https://example.com/retry",
        events: ["test.event"]
      });
    
    const response = await request(app)
      .post(`/api/webhooks/${createResponse.body.id}/deliveries/test-delivery-id/retry`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
  });
});