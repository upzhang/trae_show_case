import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../apps/api/src/app";

describe("Tickets API", () => {
  it("should list tickets", async () => {
    const response = await request(app)
      .get("/api/tickets")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should list tickets with pagination", async () => {
    const response = await request(app)
      .get("/api/tickets?page=1&pageSize=10")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body).toHaveProperty("total");
  });

  it("should list tickets by status", async () => {
    const response = await request(app)
      .get("/api/tickets?status=open")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should list tickets by priority", async () => {
    const response = await request(app)
      .get("/api/tickets?priority=high")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should list tickets by assignee", async () => {
    const response = await request(app)
      .get("/api/tickets?assignee=u-platform")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should create a ticket", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        title: "Test Ticket",
        description: "A test support ticket",
        priority: "medium",
        type: "bug"
      });
    
    expect(response.status).toBe(201);
    expect(response.body.title).toBe("Test Ticket");
    expect(response.body.status).toBe("open");
    expect(response.body.priority).toBe("medium");
  });

  it("should create a high priority ticket", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        title: "High Priority Issue",
        description: "Urgent issue",
        priority: "high",
        type: "incident"
      });
    
    expect(response.status).toBe(201);
    expect(response.body.priority).toBe("high");
    expect(response.body.type).toBe("incident");
  });

  it("should create a low priority ticket", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        title: "Low Priority Request",
        description: "Minor feature request",
        priority: "low",
        type: "feature"
      });
    
    expect(response.status).toBe(201);
    expect(response.body.priority).toBe("low");
  });

  it("should reject creating ticket without title", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        description: "No title"
      });
    
    expect(response.status).toBe(400);
  });

  it("should reject creating ticket without description", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        title: "No description"
      });
    
    expect(response.status).toBe(400);
  });

  it("should reject creating ticket with invalid priority", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        title: "Invalid Priority",
        description: "Test",
        priority: "invalid"
      });
    
    expect(response.status).toBe(400);
  });

  it("should get a ticket by ID", async () => {
    const createResponse = await request(app)
      .post("/api/tickets")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        title: "Get Test",
        description: "For testing",
        priority: "medium",
        type: "bug"
      });
    
    const response = await request(app)
      .get(`/api/tickets/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createResponse.body.id);
    expect(response.body.title).toBe("Get Test");
  });

  it("should return 404 for non-existent ticket", async () => {
    const response = await request(app)
      .get("/api/tickets/non-existent-id")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(404);
  });

  it("should update a ticket", async () => {
    const createResponse = await request(app)
      .post("/api/tickets")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        title: "Update Test",
        description: "Original",
        priority: "medium"
      });
    
    const response = await request(app)
      .put(`/api/tickets/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        title: "Updated Ticket",
        description: "Updated description",
        priority: "high",
        status: "in_progress"
      });
    
    expect(response.status).toBe(200);
    expect(response.body.title).toBe("Updated Ticket");
    expect(response.body.priority).toBe("high");
    expect(response.body.status).toBe("in_progress");
  });

  it("should partially update a ticket", async () => {
    const createResponse = await request(app)
      .post("/api/tickets")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        title: "Patch Test",
        description: "Original",
        priority: "medium"
      });
    
    const response = await request(app)
      .patch(`/api/tickets/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        status: "resolved"
      });
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("resolved");
    expect(response.body.title).toBe("Patch Test");
  });

  it("should assign a ticket", async () => {
    const createResponse = await request(app)
      .post("/api/tickets")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        title: "Assign Test",
        description: "Needs assignment",
        priority: "medium"
      });
    
    const response = await request(app)
      .patch(`/api/tickets/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        assigneeId: "u-tenant-admin"
      });
    
    expect(response.status).toBe(200);
    expect(response.body.assigneeId).toBe("u-tenant-admin");
  });

  it("should unassign a ticket", async () => {
    const createResponse = await request(app)
      .post("/api/tickets")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        title: "Unassign Test",
        description: "Test",
        priority: "medium",
        assigneeId: "u-platform"
      });
    
    const response = await request(app)
      .patch(`/api/tickets/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        assigneeId: null
      });
    
    expect(response.status).toBe(200);
    expect(response.body.assigneeId).toBeNull();
  });

  it("should add a comment to a ticket", async () => {
    const createResponse = await request(app)
      .post("/api/tickets")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        title: "Comment Test",
        description: "Test",
        priority: "medium"
      });
    
    const response = await request(app)
      .post(`/api/tickets/${createResponse.body.id}/comments`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        content: "This is a comment"
      });
    
    expect(response.status).toBe(201);
    expect(response.body.content).toBe("This is a comment");
  });

  it("should get ticket comments", async () => {
    const createResponse = await request(app)
      .post("/api/tickets")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        title: "Comments Test",
        description: "Test",
        priority: "medium"
      });
    
    await request(app)
      .post(`/api/tickets/${createResponse.body.id}/comments`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        content: "First comment"
      });
    
    const response = await request(app)
      .get(`/api/tickets/${createResponse.body.id}/comments`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
  });

  it("should close a ticket", async () => {
    const createResponse = await request(app)
      .post("/api/tickets")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        title: "Close Test",
        description: "Test",
        priority: "medium"
      });
    
    const response = await request(app)
      .post(`/api/tickets/${createResponse.body.id}/close`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("closed");
  });

  it("should reopen a ticket", async () => {
    const createResponse = await request(app)
      .post("/api/tickets")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        title: "Reopen Test",
        description: "Test",
        priority: "medium",
        status: "closed"
      });
    
    const response = await request(app)
      .post(`/api/tickets/${createResponse.body.id}/reopen`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("open");
  });

  it("should delete a ticket", async () => {
    const createResponse = await request(app)
      .post("/api/tickets")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        title: "Delete Test",
        description: "Test",
        priority: "medium"
      });
    
    const deleteResponse = await request(app)
      .delete(`/api/tickets/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(deleteResponse.status).toBe(204);
    
    const getResponse = await request(app)
      .get(`/api/tickets/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(getResponse.status).toBe(404);
  });

  it("should get ticket statistics", async () => {
    const response = await request(app)
      .get("/api/tickets/statistics")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("total");
    expect(response.body).toHaveProperty("open");
    expect(response.body).toHaveProperty("closed");
  });

  it("should get ticket statistics by priority", async () => {
    const response = await request(app)
      .get("/api/tickets/statistics/priority")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("high");
    expect(response.body).toHaveProperty("medium");
    expect(response.body).toHaveProperty("low");
  });

  it("should search tickets", async () => {
    const response = await request(app)
      .get("/api/tickets/search?q=test")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe("Tickets API - Edge Cases", () => {
  const HEADERS = { "x-user-id": "u-platform", "x-tenant-id": "tenant-acme" };

  it("should return 404 when updating non-existent ticket", async () => {
    const response = await request(app)
      .put("/api/tickets/non-existent-ticket-id")
      .set(HEADERS)
      .send({ title: "Updated", description: "Updated desc", priority: "medium" });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 404 when deleting non-existent ticket", async () => {
    const response = await request(app)
      .delete("/api/tickets/non-existent-ticket-id")
      .set(HEADERS);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 404 when adding comment to non-existent ticket", async () => {
    const response = await request(app)
      .post("/api/tickets/non-existent-ticket-id/comments")
      .set(HEADERS)
      .send({ content: "This comment should fail" });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 404 when getting conversations of non-existent ticket", async () => {
    const response = await request(app)
      .get("/api/tickets/non-existent-ticket-id/conversations")
      .set(HEADERS);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 400 when creating ticket with empty title string", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .set(HEADERS)
      .send({ title: "", description: "Valid description", priority: "medium" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 400 when creating ticket with empty description string", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .set(HEADERS)
      .send({ title: "Valid Title", description: "", priority: "medium" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 400 when creating ticket with completely empty body", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .set(HEADERS)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 400 when creating ticket with priority 'urgent' (not in enum)", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .set(HEADERS)
      .send({ title: "Test", description: "Test desc", priority: "urgent" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 400 when creating ticket with priority 'none' (not in enum)", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .set(HEADERS)
      .send({ title: "Test", description: "Test desc", priority: "none" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 400 when creating ticket with numeric priority", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .set(HEADERS)
      .send({ title: "Test", description: "Test desc", priority: 123 });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 404 when closing non-existent ticket", async () => {
    const response = await request(app)
      .post("/api/tickets/non-existent-ticket-id/close")
      .set(HEADERS);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 404 when reopening non-existent ticket", async () => {
    const response = await request(app)
      .post("/api/tickets/non-existent-ticket-id/reopen")
      .set(HEADERS);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
  });
});