import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../apps/api/src/app";

describe("Teams API", () => {
  it("should list teams", async () => {
    const response = await request(app)
      .get("/api/teams")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should list teams with pagination", async () => {
    const response = await request(app)
      .get("/api/teams?page=1&pageSize=10")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body).toHaveProperty("total");
  });

  it("should list teams with search", async () => {
    const response = await request(app)
      .get("/api/teams?search=admin")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should create a team", async () => {
    const response = await request(app)
      .post("/api/teams")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Test Team",
        description: "A test team"
      });
    
    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Test Team");
    expect(response.body.description).toBe("A test team");
    expect(response.body.isActive).toBe(true);
  });

  it("should create a team without description", async () => {
    const response = await request(app)
      .post("/api/teams")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Team Without Description"
      });
    
    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Team Without Description");
    expect(response.body.description).toBeNull();
  });

  it("should reject creating team without name", async () => {
    const response = await request(app)
      .post("/api/teams")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        description: "No name"
      });
    
    expect(response.status).toBe(400);
  });

  it("should reject creating team with duplicate name", async () => {
    await request(app)
      .post("/api/teams")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Duplicate Team"
      });
    
    const response = await request(app)
      .post("/api/teams")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Duplicate Team"
      });
    
    expect(response.status).toBe(400);
  });

  it("should get a team by ID", async () => {
    const createResponse = await request(app)
      .post("/api/teams")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Get Test Team",
        description: "For testing get"
      });
    
    const response = await request(app)
      .get(`/api/teams/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createResponse.body.id);
    expect(response.body.name).toBe("Get Test Team");
  });

  it("should return 404 for non-existent team", async () => {
    const response = await request(app)
      .get("/api/teams/non-existent-id")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(404);
  });

  it("should update a team", async () => {
    const createResponse = await request(app)
      .post("/api/teams")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Update Test",
        description: "Original"
      });
    
    const response = await request(app)
      .put(`/api/teams/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Updated Team",
        description: "Updated description"
      });
    
    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Updated Team");
    expect(response.body.description).toBe("Updated description");
  });

  it("should partially update a team", async () => {
    const createResponse = await request(app)
      .post("/api/teams")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Patch Test",
        description: "Original"
      });
    
    const response = await request(app)
      .patch(`/api/teams/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Patched Team"
      });
    
    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Patched Team");
    expect(response.body.description).toBe("Original");
  });

  it("should disable a team", async () => {
    const createResponse = await request(app)
      .post("/api/teams")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Disable Test"
      });
    
    const response = await request(app)
      .patch(`/api/teams/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        isActive: false
      });
    
    expect(response.status).toBe(200);
    expect(response.body.isActive).toBe(false);
  });

  it("should delete a team", async () => {
    const createResponse = await request(app)
      .post("/api/teams")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Delete Test"
      });
    
    const deleteResponse = await request(app)
      .delete(`/api/teams/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(deleteResponse.status).toBe(204);
    
    const getResponse = await request(app)
      .get(`/api/teams/${createResponse.body.id}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(getResponse.status).toBe(404);
  });

  it("should list team members", async () => {
    const createResponse = await request(app)
      .post("/api/teams")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Members Test"
      });
    
    const response = await request(app)
      .get(`/api/teams/${createResponse.body.id}/members`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should add a member to a team", async () => {
    const createResponse = await request(app)
      .post("/api/teams")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Add Member Test"
      });
    
    const response = await request(app)
      .post(`/api/teams/${createResponse.body.id}/members`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        userId: "u-tenant-admin",
        role: "admin"
      });
    
    expect(response.status).toBe(201);
    expect(response.body.userId).toBe("u-tenant-admin");
    expect(response.body.role).toBe("admin");
  });

  it("should add a member with default role", async () => {
    const createResponse = await request(app)
      .post("/api/teams")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Default Role Test"
      });
    
    const response = await request(app)
      .post(`/api/teams/${createResponse.body.id}/members`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        userId: "u-platform"
      });
    
    expect(response.status).toBe(201);
    expect(response.body.userId).toBe("u-platform");
    expect(response.body.role).toBe("member");
  });

  it("should reject adding duplicate member", async () => {
    const createResponse = await request(app)
      .post("/api/teams")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Duplicate Member Test"
      });
    
    await request(app)
      .post(`/api/teams/${createResponse.body.id}/members`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        userId: "u-platform"
      });
    
    const response = await request(app)
      .post(`/api/teams/${createResponse.body.id}/members`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        userId: "u-platform"
      });
    
    expect(response.status).toBe(400);
  });

  it("should remove a member from a team", async () => {
    const createResponse = await request(app)
      .post("/api/teams")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Remove Member Test"
      });
    
    const addResponse = await request(app)
      .post(`/api/teams/${createResponse.body.id}/members`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        userId: "u-platform"
      });
    
    const deleteResponse = await request(app)
      .delete(`/api/teams/${createResponse.body.id}/members/${addResponse.body.userId}`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(deleteResponse.status).toBe(204);
    
    const getResponse = await request(app)
      .get(`/api/teams/${createResponse.body.id}/members`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(getResponse.body).toHaveLength(0);
  });

  it("should update member role", async () => {
    const createResponse = await request(app)
      .post("/api/teams")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        name: "Update Role Test"
      });
    
    await request(app)
      .post(`/api/teams/${createResponse.body.id}/members`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        userId: "u-platform",
        role: "member"
      });
    
    const response = await request(app)
      .put(`/api/teams/${createResponse.body.id}/members/u-platform`)
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform")
      .send({
        role: "admin"
      });
    
    expect(response.status).toBe(200);
    expect(response.body.role).toBe("admin");
  });

  it("should get teams for a user", async () => {
    const response = await request(app)
      .get("/api/teams/user/u-platform")
      .set("X-Tenant-ID", "tenant-acme")
      .set("X-User-ID", "u-platform");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe("Teams API - 边界与异常路径", () => {
  const HEADERS = { "x-user-id": "u-platform", "x-tenant-id": "tenant-acme" };

  describe("POST /api/teams - 缺少必填字段", () => {
    it("should return 400 when body is empty", async () => {
      const response = await request(app)
        .post("/api/teams")
        .set(HEADERS)
        .send({});

      expect(response.status).toBe(400);
    });

    it("should return 400 when name is empty string", async () => {
      const response = await request(app)
        .post("/api/teams")
        .set(HEADERS)
        .send({ name: "", description: "test" });

      expect(response.status).toBe(400);
    });

    it("should return 400 when name exceeds 100 characters", async () => {
      const response = await request(app)
        .post("/api/teams")
        .set(HEADERS)
        .send({ name: "a".repeat(101), description: "test" });

      expect(response.status).toBe(400);
    });

    it("should return 400 when description exceeds 500 characters", async () => {
      const response = await request(app)
        .post("/api/teams")
        .set(HEADERS)
        .send({ name: "Valid Name", description: "x".repeat(501) });

      expect(response.status).toBe(400);
    });
  });

  describe("PUT /api/teams/:id - 更新不存在的团队", () => {
    it("should return 404 when updating non-existent team", async () => {
      const response = await request(app)
        .put("/api/teams/non-existent-id")
        .set(HEADERS)
        .send({ name: "Updated", description: "test" });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/teams/:id - 删除不存在的团队", () => {
    it("should return 404 when deleting non-existent team", async () => {
      const response = await request(app)
        .delete("/api/teams/non-existent-id")
        .set(HEADERS);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/teams/:id/members - 添加成员到不存在的团队", () => {
    it("should return 404 when adding member to non-existent team", async () => {
      const response = await request(app)
        .post("/api/teams/non-existent-id/members")
        .set(HEADERS)
        .send({ userId: "u-platform", role: "member" });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/teams/:id/members/:userId - 移除不存在的成员", () => {
    it("should return 404 when removing member from non-existent team", async () => {
      const response = await request(app)
        .delete("/api/teams/non-existent-id/members/u-platform")
        .set(HEADERS);

      expect(response.status).toBe(404);
    });

    it("should return 404 when removing non-existent member from existing team", async () => {
      const createResponse = await request(app)
        .post("/api/teams")
        .set(HEADERS)
        .send({ name: "Team For Member Removal Test" });

      const response = await request(app)
        .delete(`/api/teams/${createResponse.body.id}/members/non-existent-user`)
        .set(HEADERS);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/teams/:id/members - 重复添加同一成员", () => {
    it("should return 400 when adding duplicate member", async () => {
      const createResponse = await request(app)
        .post("/api/teams")
        .set(HEADERS)
        .send({ name: "Duplicate Add Test" });

      await request(app)
        .post(`/api/teams/${createResponse.body.id}/members`)
        .set(HEADERS)
        .send({ userId: "u-tenant-admin", role: "member" });

      const response = await request(app)
        .post(`/api/teams/${createResponse.body.id}/members`)
        .set(HEADERS)
        .send({ userId: "u-tenant-admin", role: "admin" });

      expect(response.status).toBe(400);
    });
  });
});