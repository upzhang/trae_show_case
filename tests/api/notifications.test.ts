import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../apps/api/src/app";

describe("Notifications API", () => {
  it("should list notifications", async () => {
    const response = await request(app)
      .get("/api/notifications")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should list notifications with pagination", async () => {
    const response = await request(app)
      .get("/api/notifications?page=1&pageSize=10")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body).toHaveProperty("total");
  });

  it("should list notifications by type", async () => {
    const response = await request(app)
      .get("/api/notifications?type=system")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });


  it("should list notifications for current user", async () => {
    const response = await request(app)
      .get("/api/notifications/me")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "user-1");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should create a notification", async () => {
    const response = await request(app)
      .post("/api/notifications")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        userId: "user-1",
        title: "Test Notification",
        message: "This is a test notification",
        type: "info"
      });
    
    expect(response.status).toBe(201);
    expect(response.body.title).toBe("Test Notification");
    expect(response.body.read).toBe(false);
  });

  it("should create a system notification", async () => {
    const response = await request(app)
      .post("/api/notifications")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        userId: "user-1",
        title: "System Update",
        message: "System maintenance scheduled",
        type: "system"
      });
    
    expect(response.status).toBe(201);
    expect(response.body.type).toBe("system");
  });

  it("should create a warning notification", async () => {
    const response = await request(app)
      .post("/api/notifications")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        userId: "user-1",
        title: "Quota Warning",
        message: "Your storage quota is almost full",
        type: "warning"
      });
    
    expect(response.status).toBe(201);
    expect(response.body.type).toBe("warning");
  });

  it("should reject creating notification without title", async () => {
    const response = await request(app)
      .post("/api/notifications")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        userId: "user-1",
        message: "This is a test notification"
      });
    
    expect(response.status).toBe(400);
  });

  it("should reject creating notification without message", async () => {
    const response = await request(app)
      .post("/api/notifications")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        userId: "user-1",
        title: "Test Notification"
      });
    
    expect(response.status).toBe(400);
  });

  it("should get a notification by ID", async () => {
    const createResponse = await request(app)
      .post("/api/notifications")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        userId: "user-1",
        title: "Test Notification",
        message: "This is a test notification",
        type: "info"
      });
    
    const response = await request(app)
      .get(`/api/notifications/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createResponse.body.id);
    expect(response.body.title).toBe("Test Notification");
  });

  it("should return 404 for non-existent notification", async () => {
    const response = await request(app)
      .get("/api/notifications/non-existent-id")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(404);
  });

  it("should mark a notification as read", async () => {
    const createResponse = await request(app)
      .post("/api/notifications")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        userId: "user-1",
        title: "Test Notification",
        message: "This is a test notification",
        type: "info"
      });
    
    const response = await request(app)
      .patch(`/api/notifications/${createResponse.body.id}/read`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body.read).toBe(true);
  });

  it("should mark all notifications as read", async () => {
    const response = await request(app)
      .post("/api/notifications/read-all")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "user-1");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("count");
  });

  it("should update a notification", async () => {
    const createResponse = await request(app)
      .post("/api/notifications")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        userId: "user-1",
        title: "Test Notification",
        message: "This is a test notification",
        type: "info"
      });
    
    const response = await request(app)
      .put(`/api/notifications/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        title: "Updated Notification",
        message: "This is an updated notification",
        type: "warning"
      });
    
    expect(response.status).toBe(200);
    expect(response.body.title).toBe("Updated Notification");
    expect(response.body.type).toBe("warning");
  });

  it("should delete a notification", async () => {
    const createResponse = await request(app)
      .post("/api/notifications")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        userId: "user-1",
        title: "Test Notification",
        message: "This is a test notification",
        type: "info"
      });
    
    const deleteResponse = await request(app)
      .delete(`/api/notifications/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(deleteResponse.status).toBe(204);
    
    const getResponse = await request(app)
      .get(`/api/notifications/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(getResponse.status).toBe(404);
  });

  it("should delete all notifications for a user", async () => {
    await request(app)
      .post("/api/notifications")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        userId: "user-delete-test",
        title: "Test Notification 1",
        message: "Notification 1",
        type: "info"
      });
    
    await request(app)
      .post("/api/notifications")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        userId: "user-delete-test",
        title: "Test Notification 2",
        message: "Notification 2",
        type: "info"
      });
    
    const response = await request(app)
      .delete("/api/notifications/user/user-delete-test")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("deletedCount");
  });

  it("should get notification statistics", async () => {
    const response = await request(app)
      .get("/api/notifications/statistics")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "user-1");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("total");
    expect(response.body).toHaveProperty("unread");
    expect(response.body).toHaveProperty("read");
  });

  it("should get notification statistics by type", async () => {
    const response = await request(app)
      .get("/api/notifications/statistics/type")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "user-1");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("info");
    expect(response.body).toHaveProperty("warning");
    expect(response.body).toHaveProperty("error");
    expect(response.body).toHaveProperty("success");
    expect(response.body).toHaveProperty("system");
  });

  it("should send a broadcast notification", async () => {
    const response = await request(app)
      .post("/api/notifications/broadcast")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        title: "Broadcast Message",
        message: "This is a broadcast to all users",
        type: "info"
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("sentCount");
  });

  it("should send a notification to multiple users", async () => {
    const response = await request(app)
      .post("/api/notifications/batch")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        userIds: ["user-1", "user-2"],
        title: "Batch Notification",
        message: "This is a batch notification",
        type: "info"
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("count");
    expect(response.body.count).toBe(2);
  });

  it("should get unread notification count", async () => {
    await request(app)
      .post("/api/notifications")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        userId: "user-count-test",
        title: "Unread Test",
        message: "Test unread count",
        type: "info"
      });
    
    const response = await request(app)
      .get("/api/notifications/count/unread")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "user-count-test");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("count");
    expect(response.body.count).toBeGreaterThanOrEqual(1);
  });

  it("should schedule a notification", async () => {
    const scheduleTime = new Date(Date.now() + 1000 * 60 * 60).toISOString();
    
    const response = await request(app)
      .post("/api/notifications/schedule")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        userId: "user-1",
        title: "Scheduled Notification",
        message: "This notification is scheduled",
        type: "info",
        scheduledAt: scheduleTime
      });
    
    expect(response.status).toBe(201);
    expect(response.body.scheduledAt).toBe(scheduleTime);
    expect(response.body.status).toBe("scheduled");
  });

  it("should get scheduled notifications", async () => {
    const response = await request(app)
      .get("/api/notifications/scheduled")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should cancel a scheduled notification", async () => {
    const scheduleTime = new Date(Date.now() + 1000 * 60 * 60).toISOString();
    
    const createResponse = await request(app)
      .post("/api/notifications/schedule")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        userId: "user-1",
        title: "Scheduled Notification",
        message: "This notification is scheduled",
        type: "info",
        scheduledAt: scheduleTime
      });
    
    const response = await request(app)
      .delete(`/api/notifications/scheduled/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("cancelled");
  });

  it("should filter notifications by date range", async () => {
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date().toISOString();
    
    const response = await request(app)
      .get(`/api/notifications?startDate=${startDate}&endDate=${endDate}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should search notifications by title", async () => {
    await request(app)
      .post("/api/notifications")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        userId: "user-search",
        title: "Searchable Notification",
        message: "This is searchable",
        type: "info"
      });
    
    const response = await request(app)
      .get("/api/notifications/search?q=Searchable")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "user-search");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe("Notifications API - Edge Cases", () => {
  const HEADERS = { "x-user-id": "u-platform", "x-tenant-id": "tenant-acme" };

  it("should return 404 when marking non-existent notification as read via PUT", async () => {
    const response = await request(app)
      .put("/api/notifications/non-existent-notif-id/read")
      .set(HEADERS);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 404 when marking non-existent notification as read via PATCH", async () => {
    const response = await request(app)
      .patch("/api/notifications/non-existent-notif-id/read")
      .set(HEADERS);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 404 when deleting non-existent notification", async () => {
    const response = await request(app)
      .delete("/api/notifications/non-existent-notif-id")
      .set(HEADERS);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 404 when updating non-existent notification", async () => {
    const response = await request(app)
      .put("/api/notifications/non-existent-notif-id")
      .set(HEADERS)
      .send({ title: "Updated", message: "Updated message", type: "info" });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 400 when creating notification with empty title string", async () => {
    const response = await request(app)
      .post("/api/notifications")
      .set(HEADERS)
      .send({ userId: "user-1", title: "", message: "Valid message", type: "info" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 400 when creating notification with empty message string", async () => {
    const response = await request(app)
      .post("/api/notifications")
      .set(HEADERS)
      .send({ userId: "user-1", title: "Valid Title", message: "", type: "info" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 400 when creating notification with completely empty body", async () => {
    const response = await request(app)
      .post("/api/notifications")
      .set(HEADERS)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("should mark all notifications as read for current user via POST", async () => {
    await request(app)
      .post("/api/notifications")
      .set(HEADERS)
      .send({ userId: "u-platform", title: "Batch Read Test 1", message: "Test message 1", type: "info" });

    await request(app)
      .post("/api/notifications")
      .set(HEADERS)
      .send({ userId: "u-platform", title: "Batch Read Test 2", message: "Test message 2", type: "warning" });

    const response = await request(app)
      .post("/api/notifications/read-all")
      .set(HEADERS);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("count");
    expect(response.body.count).toBeGreaterThanOrEqual(0);
  });

  it("should delete all notifications for a specific user", async () => {
    const testUserId = "user-bulk-delete-test";

    await request(app)
      .post("/api/notifications")
      .set(HEADERS)
      .send({ userId: testUserId, title: "Bulk Delete 1", message: "Message 1", type: "info" });

    await request(app)
      .post("/api/notifications")
      .set(HEADERS)
      .send({ userId: testUserId, title: "Bulk Delete 2", message: "Message 2", type: "warning" });

    await request(app)
      .post("/api/notifications")
      .set(HEADERS)
      .send({ userId: testUserId, title: "Bulk Delete 3", message: "Message 3", type: "error" });

    const response = await request(app)
      .delete(`/api/notifications/user/${testUserId}`)
      .set(HEADERS);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("deletedCount");
    expect(response.body.deletedCount).toBeGreaterThanOrEqual(3);
  });

  it("should return empty list when filtering by non-existent type", async () => {
    const response = await request(app)
      .get("/api/notifications?type=nonexistent_type_xyz")
      .set(HEADERS);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0);
  });


});