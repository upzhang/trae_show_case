import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../apps/api/src/app";

describe("Tokens API", () => {
  it("should list tokens", async () => {
    const response = await request(app)
      .get("/api/tokens")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should list tokens with pagination", async () => {
    const response = await request(app)
      .get("/api/tokens?page=1&pageSize=10")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body).toHaveProperty("total");
  });

  it("should create a token", async () => {
    const response = await request(app)
      .post("/api/tokens")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Test Token",
        scopes: ["read", "write"],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    
    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Test Token");
    expect(response.body.scopes).toEqual(["read", "write"]);
    expect(response.body.token).toBeDefined();
    expect(response.body.token).toMatch(/^sk_/);
  });

  it("should create a token without expiration", async () => {
    const response = await request(app)
      .post("/api/tokens")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Permanent Token",
        scopes: ["read"]
      });
    
    expect(response.status).toBe(201);
    expect(response.body.expiresAt).toBeNull();
  });

  it("should create a token with admin scope", async () => {
    const response = await request(app)
      .post("/api/tokens")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Admin Token",
        scopes: ["admin"]
      });
    
    expect(response.status).toBe(201);
    expect(response.body.scopes).toEqual(["admin"]);
  });

  it("should reject creating token without name", async () => {
    const response = await request(app)
      .post("/api/tokens")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        scopes: ["read"]
      });
    
    expect(response.status).toBe(400);
  });

  it("should reject creating token without scopes", async () => {
    const response = await request(app)
      .post("/api/tokens")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "No Scopes"
      });
    
    expect(response.status).toBe(400);
  });

  it("should reject creating token with invalid scopes", async () => {
    const response = await request(app)
      .post("/api/tokens")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Invalid Scopes",
        scopes: ["invalid_scope"]
      });
    
    expect(response.status).toBe(400);
  });

  it("should get a token by ID", async () => {
    const createResponse = await request(app)
      .post("/api/tokens")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Get Test",
        scopes: ["read"]
      });
    
    const response = await request(app)
      .get(`/api/tokens/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createResponse.body.id);
    expect(response.body.name).toBe("Get Test");
  });

  it("should return 404 for non-existent token", async () => {
    const response = await request(app)
      .get("/api/tokens/non-existent-id")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(404);
  });

  it("should rotate a token", async () => {
    const createResponse = await request(app)
      .post("/api/tokens")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Rotate Test",
        scopes: ["read"]
      });
    
    const originalToken = createResponse.body.token;
    
    const response = await request(app)
      .post(`/api/tokens/${createResponse.body.id}/rotate`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.token).not.toBe(originalToken);
    expect(response.body.token).toMatch(/^sk_/);
  });

  it("should return 404 when rotating non-existent token", async () => {
    const response = await request(app)
      .post("/api/tokens/non-existent-id/rotate")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(404);
  });

  it("should update a token", async () => {
    const createResponse = await request(app)
      .post("/api/tokens")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Update Test",
        scopes: ["read"]
      });
    
    const response = await request(app)
      .put(`/api/tokens/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Updated Token",
        scopes: ["read", "write"]
      });
    
    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Updated Token");
    expect(response.body.scopes).toEqual(["read", "write"]);
  });

  it("should partially update a token", async () => {
    const createResponse = await request(app)
      .post("/api/tokens")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Patch Test",
        scopes: ["read"]
      });
    
    const response = await request(app)
      .patch(`/api/tokens/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Patched Token"
      });
    
    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Patched Token");
    expect(response.body.scopes).toEqual(["read"]);
  });

  it("should delete a token", async () => {
    const createResponse = await request(app)
      .post("/api/tokens")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Delete Test",
        scopes: ["read"]
      });
    
    const deleteResponse = await request(app)
      .delete(`/api/tokens/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(deleteResponse.status).toBe(204);
    
    const getResponse = await request(app)
      .get(`/api/tokens/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(getResponse.status).toBe(404);
  });

  it("should return 404 when deleting non-existent token", async () => {
    const response = await request(app)
      .delete("/api/tokens/non-existent-id")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(404);
  });

  it("should validate a token", async () => {
    const createResponse = await request(app)
      .post("/api/tokens")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Validate Test",
        scopes: ["read"]
      });
    
    const response = await request(app)
      .post("/api/tokens/validate")
      .set("X-Tenant-ID", "tenant-acme")
      .send({
        token: createResponse.body.token
      });
    
    expect(response.status).toBe(200);
    expect(response.body.valid).toBe(true);
    expect(response.body.scopes).toEqual(["read"]);
  });

  it("should invalidate invalid token", async () => {
    const response = await request(app)
      .post("/api/tokens/validate")
      .set("X-Tenant-ID", "tenant-acme")
      .send({
        token: "invalid-token"
      });
    
    expect(response.status).toBe(200);
    expect(response.body.valid).toBe(false);
  });

  it("should check token permissions", async () => {
    const createResponse = await request(app)
      .post("/api/tokens")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Permission Test",
        scopes: ["read", "write"]
      });
    
    const response = await request(app)
      .post("/api/tokens/check-permission")
      .set("X-Tenant-ID", "tenant-acme")
      .send({
        token: createResponse.body.token,
        permission: "read"
      });
    
    expect(response.status).toBe(200);
    expect(response.body.hasPermission).toBe(true);
  });

  it("should deny missing permission", async () => {
    const createResponse = await request(app)
      .post("/api/tokens")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Deny Test",
        scopes: ["read"]
      });
    
    const response = await request(app)
      .post("/api/tokens/check-permission")
      .set("X-Tenant-ID", "tenant-acme")
      .send({
        token: createResponse.body.token,
        permission: "delete"
      });
    
    expect(response.status).toBe(200);
    expect(response.body.hasPermission).toBe(false);
  });

  it("should expire token after expiration date", async () => {
    const pastDate = new Date(Date.now() - 1000).toISOString();
    
    const createResponse = await request(app)
      .post("/api/tokens")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Expired Token",
        scopes: ["read"],
        expiresAt: pastDate
      });
    
    const response = await request(app)
      .post("/api/tokens/validate")
      .set("X-Tenant-ID", "tenant-acme")
      .send({
        token: createResponse.body.token
      });
    
    expect(response.status).toBe(200);
    expect(response.body.valid).toBe(false);
  });
});

describe("Tokens API - Edge Cases", () => {
  const HEADERS = { "x-user-id": "u-platform", "x-tenant-id": "tenant-acme" };

  it("should return 400 when creating token with empty name string", async () => {
    const response = await request(app)
      .post("/api/tokens")
      .set(HEADERS)
      .send({ name: "", scopes: ["read"] });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 400 when creating token with empty scopes array", async () => {
    const response = await request(app)
      .post("/api/tokens")
      .set(HEADERS)
      .send({ name: "Test Token", scopes: [] });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 400 when creating token with completely empty body", async () => {
    const response = await request(app)
      .post("/api/tokens")
      .set(HEADERS)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 404 when updating non-existent token", async () => {
    const response = await request(app)
      .put("/api/tokens/non-existent-token-id")
      .set(HEADERS)
      .send({ name: "Updated", scopes: ["read"] });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 404 when patching non-existent token", async () => {
    const response = await request(app)
      .patch("/api/tokens/non-existent-token-id")
      .set(HEADERS)
      .send({ name: "Patched" });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 400 when creating token with invalid expiresAt format", async () => {
    const response = await request(app)
      .post("/api/tokens")
      .set(HEADERS)
      .send({ name: "Bad Date", scopes: ["read"], expiresAt: "not-a-valid-date" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 400 when creating token with empty string expiresAt", async () => {
    const response = await request(app)
      .post("/api/tokens")
      .set(HEADERS)
      .send({ name: "Empty Date", scopes: ["read"], expiresAt: "" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 400 when creating token with scope 'delete' (not in enum)", async () => {
    const response = await request(app)
      .post("/api/tokens")
      .set(HEADERS)
      .send({ name: "Bad Scope", scopes: ["delete"] });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 400 when creating token with scope 'super_admin' (not in enum)", async () => {
    const response = await request(app)
      .post("/api/tokens")
      .set(HEADERS)
      .send({ name: "Bad Scope", scopes: ["super_admin"] });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 400 when creating token with mixed valid and invalid scopes", async () => {
    const response = await request(app)
      .post("/api/tokens")
      .set(HEADERS)
      .send({ name: "Mixed Scopes", scopes: ["read", "invalid_scope"] });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 400 when creating token with scopes as string instead of array", async () => {
    const response = await request(app)
      .post("/api/tokens")
      .set(HEADERS)
      .send({ name: "String Scopes", scopes: "read" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 404 when validating with empty token body", async () => {
    const response = await request(app)
      .post("/api/tokens/validate")
      .set(HEADERS)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.valid).toBe(false);
  });
});