import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../apps/api/src/app";

describe("Features API", () => {
  it("should list features", async () => {
    const response = await request(app)
      .get("/api/features")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should list features with pagination", async () => {
    const response = await request(app)
      .get("/api/features?page=1&pageSize=10")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body).toHaveProperty("total");
  });

  it("should list features by status", async () => {
    const response = await request(app)
      .get("/api/features?status=enabled")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });


  it("should create a feature flag", async () => {
    const response = await request(app)
      .post("/api/features")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        key: "new_feature",
        name: "New Feature",
        description: "A new feature flag",
        type: "feature",
        enabled: false
      });
    
    expect(response.status).toBe(201);
    expect(response.body.key).toBe("new_feature");
    expect(response.body.name).toBe("New Feature");
    expect(response.body.enabled).toBe(false);
  });

  it("should create a system feature", async () => {
    const response = await request(app)
      .post("/api/features")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        key: "system_feature",
        name: "System Feature",
        type: "system",
        enabled: true
      });
    
    expect(response.status).toBe(201);
    expect(response.body.type).toBe("system");
    expect(response.body.enabled).toBe(true);
  });

  it("should create a beta feature", async () => {
    const response = await request(app)
      .post("/api/features")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        key: "beta_feature",
        name: "Beta Feature",
        type: "beta",
        enabled: false,
        rolloutPercentage: 10
      });
    
    expect(response.status).toBe(201);
    expect(response.body.type).toBe("beta");
    expect(response.body.rolloutPercentage).toBe(10);
  });

  it("should reject creating feature without key", async () => {
    const response = await request(app)
      .post("/api/features")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "No Key Feature",
        type: "feature"
      });
    
    expect(response.status).toBe(400);
  });

  it("should reject creating feature without name", async () => {
    const response = await request(app)
      .post("/api/features")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        key: "no_name",
        type: "feature"
      });
    
    expect(response.status).toBe(400);
  });

  it("should reject creating feature with duplicate key", async () => {
    await request(app)
      .post("/api/features")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        key: "duplicate_key",
        name: "Original",
        type: "feature"
      });
    
    const response = await request(app)
      .post("/api/features")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        key: "duplicate_key",
        name: "Duplicate",
        type: "feature"
      });
    
    expect(response.status).toBe(400);
  });

  it("should get a feature by key", async () => {
    const createResponse = await request(app)
      .post("/api/features")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        key: "get_test",
        name: "Get Test",
        type: "feature"
      });
    
    const response = await request(app)
      .get(`/api/features/${createResponse.body.key}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body.key).toBe("get_test");
    expect(response.body.name).toBe("Get Test");
  });

  it("should return 404 for non-existent feature", async () => {
    const response = await request(app)
      .get("/api/features/non-existent-key")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(404);
  });

  it("should update a feature", async () => {
    const createResponse = await request(app)
      .post("/api/features")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        key: "update_test",
        name: "Update Test",
        type: "feature",
        enabled: false
      });
    
    const response = await request(app)
      .put(`/api/features/${createResponse.body.key}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Updated Feature",
        enabled: true,
        description: "Updated description"
      });
    
    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Updated Feature");
    expect(response.body.enabled).toBe(true);
  });

  it("should partially update a feature", async () => {
    const createResponse = await request(app)
      .post("/api/features")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        key: "patch_test",
        name: "Patch Test",
        type: "feature",
        enabled: false
      });
    
    const response = await request(app)
      .patch(`/api/features/${createResponse.body.key}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        enabled: true
      });
    
    expect(response.status).toBe(200);
    expect(response.body.enabled).toBe(true);
    expect(response.body.name).toBe("Patch Test");
  });

  it("should enable a feature", async () => {
    const createResponse = await request(app)
      .post("/api/features")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        key: "enable_test",
        name: "Enable Test",
        type: "feature",
        enabled: false
      });
    
    const response = await request(app)
      .post(`/api/features/${createResponse.body.key}/enable`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body.enabled).toBe(true);
  });

  it("should disable a feature", async () => {
    const createResponse = await request(app)
      .post("/api/features")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        key: "disable_test",
        name: "Disable Test",
        type: "feature",
        enabled: true
      });
    
    const response = await request(app)
      .post(`/api/features/${createResponse.body.key}/disable`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body.enabled).toBe(false);
  });

  it("should toggle a feature", async () => {
    const createResponse = await request(app)
      .post("/api/features")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        key: "toggle_test",
        name: "Toggle Test",
        type: "feature",
        enabled: false
      });
    
    const response1 = await request(app)
      .post(`/api/features/${createResponse.body.key}/toggle`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response1.status).toBe(200);
    expect(response1.body.enabled).toBe(true);
    
    const response2 = await request(app)
      .post(`/api/features/${createResponse.body.key}/toggle`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response2.status).toBe(200);
    expect(response2.body.enabled).toBe(false);
  });

  it("should delete a feature", async () => {
    const createResponse = await request(app)
      .post("/api/features")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        key: "delete_test",
        name: "Delete Test",
        type: "feature"
      });
    
    const deleteResponse = await request(app)
      .delete(`/api/features/${createResponse.body.key}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(deleteResponse.status).toBe(204);
    
    const getResponse = await request(app)
      .get(`/api/features/${createResponse.body.key}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(getResponse.status).toBe(404);
  });

  it("should check feature status", async () => {
    const createResponse = await request(app)
      .post("/api/features")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        key: "check_status",
        name: "Check Status",
        type: "feature",
        enabled: true
      });
    
    const response = await request(app)
      .get(`/api/features/${createResponse.body.key}/status`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body.enabled).toBe(true);
  });

  it("should get feature status for multiple features", async () => {
    await request(app)
      .post("/api/features")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        key: "multi_check_1",
        name: "Multi Check 1",
        type: "feature",
        enabled: true
      });
    
    await request(app)
      .post("/api/features")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        key: "multi_check_2",
        name: "Multi Check 2",
        type: "feature",
        enabled: false
      });
    
    const response = await request(app)
      .get("/api/features/status?keys=multi_check_1,multi_check_2")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("multi_check_1");
    expect(response.body).toHaveProperty("multi_check_2");
    expect(response.body.multi_check_1).toBe(true);
    expect(response.body.multi_check_2).toBe(false);
  });

  it("should set rollout percentage", async () => {
    const createResponse = await request(app)
      .post("/api/features")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        key: "rollout_test",
        name: "Rollout Test",
        type: "beta",
        enabled: true,
        rolloutPercentage: 0
      });
    
    const response = await request(app)
      .patch(`/api/features/${createResponse.body.key}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        rolloutPercentage: 50
      });
    
    expect(response.status).toBe(200);
    expect(response.body.rolloutPercentage).toBe(50);
  });

  it("should validate rollout percentage between 0-100", async () => {
    const response = await request(app)
      .post("/api/features")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        key: "invalid_rollout",
        name: "Invalid Rollout",
        type: "beta",
        rolloutPercentage: 150
      });
    
    expect(response.status).toBe(400);
  });
});

describe("Features API — missing required fields", () => {
  it("should return 400 when creating feature without key", async () => {
    const response = await request(app)
      .post("/api/features")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "No Key Feature",
        type: "feature"
      });

    expect(response.status).toBe(400);
  });

  it("should return 400 when creating feature without name", async () => {
    const response = await request(app)
      .post("/api/features")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        key: "no_name_feature",
        type: "feature"
      });

    expect(response.status).toBe(400);
  });

  it("should return 400 when creating feature without type", async () => {
    const response = await request(app)
      .post("/api/features")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        key: "no_type_feature",
        name: "No Type Feature"
      });

    expect(response.status).toBe(400);
  });

  it("should return 400 when creating feature with empty key", async () => {
    const response = await request(app)
      .post("/api/features")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        key: "",
        name: "Empty Key",
        type: "feature"
      });

    expect(response.status).toBe(400);
  });
});

describe("Features API — non-existent resource", () => {
  it("should return 404 when updating non-existent feature", async () => {
    const response = await request(app)
      .put("/api/features/non-existent-key")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Updated Name",
        enabled: true
      });

    expect(response.status).toBe(404);
  });

  it("should return 404 when deleting non-existent feature", async () => {
    const response = await request(app)
      .delete("/api/features/non-existent-key")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");

    expect(response.status).toBe(404);
  });

  it("should return 404 when enabling non-existent feature", async () => {
    const response = await request(app)
      .post("/api/features/non-existent-key/enable")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");

    expect(response.status).toBe(404);
  });

  it("should return 404 when disabling non-existent feature", async () => {
    const response = await request(app)
      .post("/api/features/non-existent-key/disable")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");

    expect(response.status).toBe(404);
  });

  it("should return 404 when toggling non-existent feature", async () => {
    const response = await request(app)
      .post("/api/features/non-existent-key/toggle")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");

    expect(response.status).toBe(404);
  });
});

describe("Features API — override edge cases", () => {
  it("should return 404 when adding override to non-existent feature", async () => {
    const response = await request(app)
      .post("/api/features/non-existent-key/override")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        overrideTenantId: "tenant-acme",
        value: true
      });

    expect(response.status).toBe(404);
  });

  it("should return 404 when deleting override from non-existent feature", async () => {
    const response = await request(app)
      .delete("/api/features/non-existent-key/override/tenant-acme")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");

    expect(response.status).toBe(404);
  });
});

describe("Features API — batch operations", () => {
  it("should get status for multiple features in one request", async () => {
    const response = await request(app)
      .get("/api/features/status?keys=new_ui,sso_enabled,audit_log_retention_days")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("new_ui");
    expect(response.body).toHaveProperty("sso_enabled");
    expect(response.body).toHaveProperty("audit_log_retention_days");
    expect(typeof response.body.new_ui).toBe("boolean");
    expect(typeof response.body.sso_enabled).toBe("boolean");
    expect(typeof response.body.audit_log_retention_days).toBe("boolean");
  });

  it("should return false for non-existent keys in batch status", async () => {
    const response = await request(app)
      .get("/api/features/status?keys=new_ui,non_existent_key")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");

    expect(response.status).toBe(200);
    expect(response.body.new_ui).toBe(true);
    expect(response.body.non_existent_key).toBe(false);
  });


});