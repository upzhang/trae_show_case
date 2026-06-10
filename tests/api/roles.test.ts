import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../apps/api/src/app";
import { roleDefinitions } from "../../apps/api/src/store";

const HEADERS = {
  "x-user-id": "u-platform",
  "x-tenant-id": "tenant-acme",
};

describe("Roles API", () => {
  beforeAll(() => {
    roleDefinitions.reset();
  });

  afterAll(() => {
    roleDefinitions.reset();
  });

  describe("GET /api/permissions", () => {
    it("should return permissions and groups", async () => {
      const res = await request(app)
        .get("/api/permissions")
        .set(HEADERS);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("permissions");
      expect(res.body).toHaveProperty("groups");
      expect(Array.isArray(res.body.permissions)).toBe(true);
      expect(Object.keys(res.body.groups).length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/roles", () => {
    it("should return roles list", async () => {
      const res = await request(app)
        .get("/api/roles")
        .set(HEADERS);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("POST /api/roles", () => {
    it("should create a new role", async () => {
      const res = await request(app)
        .post("/api/roles")
        .set(HEADERS)
        .send({
          name: "测试角色",
          description: "测试用自定义角色",
          permissions: ["tenant:read", "user:read", "metric:read"],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.name).toBe("测试角色");
      expect(res.body.permissions).toContain("tenant:read");
      expect(res.body.type).toBe("custom");
    });

    it("should reject duplicate role name", async () => {
      await request(app)
        .post("/api/roles")
        .set(HEADERS)
        .send({ name: "重复角色", permissions: ["tenant:read"] });

      const res = await request(app)
        .post("/api/roles")
        .set(HEADERS)
        .send({ name: "重复角色", permissions: ["tenant:read"] });

      expect(res.status).toBe(409);
    });

    it("should reject missing required fields", async () => {
      const res = await request(app)
        .post("/api/roles")
        .set(HEADERS)
        .send({ name: "无权限角色" });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/roles/:id", () => {
    it("should return role detail", async () => {
      const createRes = await request(app)
        .post("/api/roles")
        .set(HEADERS)
        .send({ name: "详情角色", permissions: ["tenant:read"] });

      const res = await request(app)
        .get(`/api/roles/${createRes.body.id}`)
        .set(HEADERS);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("详情角色");
    });

    it("should return 404 for non-existent role", async () => {
      const res = await request(app)
        .get("/api/roles/non-existent")
        .set(HEADERS);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/roles/:id", () => {
    it("should update role", async () => {
      const createRes = await request(app)
        .post("/api/roles")
        .set(HEADERS)
        .send({ name: "更新角色", permissions: ["tenant:read"] });

      const res = await request(app)
        .put(`/api/roles/${createRes.body.id}`)
        .set(HEADERS)
        .send({ name: "已更新角色", description: "更新后的描述" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("已更新角色");
      expect(res.body.description).toBe("更新后的描述");
    });
  });

  describe("POST /api/roles/:id/clone", () => {
    it("should clone a role", async () => {
      const createRes = await request(app)
        .post("/api/roles")
        .set(HEADERS)
        .send({ name: "克隆源角色", permissions: ["tenant:read", "user:read"] });

      const res = await request(app)
        .post(`/api/roles/${createRes.body.id}/clone`)
        .set(HEADERS)
        .send({ name: "克隆目标角色" });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("克隆目标角色");
      expect(res.body.permissions).toEqual(["tenant:read", "user:read"]);
    });
  });

  describe("DELETE /api/roles/:id", () => {
    it("should delete a custom role", async () => {
      const createRes = await request(app)
        .post("/api/roles")
        .set(HEADERS)
        .send({ name: "待删除角色", permissions: ["tenant:read"] });

      const res = await request(app)
        .delete(`/api/roles/${createRes.body.id}`)
        .set(HEADERS);

      expect(res.status).toBe(204);

      const getRes = await request(app)
        .get(`/api/roles/${createRes.body.id}`)
        .set(HEADERS);

      expect(getRes.status).toBe(404);
    });
  });

  describe("PUT /api/roles/:id — edge cases", () => {
    it("should return 404 when updating non-existent role", async () => {
      const res = await request(app)
        .put("/api/roles/non-existent-role-id")
        .set(HEADERS)
        .send({ name: "不会成功" });

      expect(res.status).toBe(404);
    });

    it("should return 403 when updating a system role", async () => {
      const res = await request(app)
        .put("/api/roles/role-3")
        .set(HEADERS)
        .send({ name: "尝试修改系统角色" });

      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/roles/:id — edge cases", () => {
    it("should return 404 when deleting non-existent role", async () => {
      const res = await request(app)
        .delete("/api/roles/non-existent-role-id")
        .set(HEADERS);

      expect(res.status).toBe(404);
    });

    it("should return 403 when deleting a system role", async () => {
      const res = await request(app)
        .delete("/api/roles/role-2")
        .set(HEADERS);

      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/roles — invalid permission filtering", () => {
    it("should filter out invalid permission codes when creating role", async () => {
      const res = await request(app)
        .post("/api/roles")
        .set(HEADERS)
        .send({
          name: "含无效权限的角色",
          permissions: ["tenant:read", "invalid:permission", "user:read", "fake:code"],
        });

      expect(res.status).toBe(201);
      expect(res.body.permissions).toContain("tenant:read");
      expect(res.body.permissions).toContain("user:read");
      expect(res.body.permissions).not.toContain("invalid:permission");
      expect(res.body.permissions).not.toContain("fake:code");
    });
  });

  describe("POST /api/roles/:id/clone — edge cases", () => {
    it("should return 404 when cloning non-existent role", async () => {
      const res = await request(app)
        .post("/api/roles/non-existent-role-id/clone")
        .set(HEADERS)
        .send({ name: "克隆目标" });

      expect(res.status).toBe(404);
    });

    it("should allow cloning a system role", async () => {
      const res = await request(app)
        .post("/api/roles/role-4/clone")
        .set(HEADERS)
        .send({ name: "系统角色克隆版" });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("系统角色克隆版");
      expect(res.body.type).toBe("custom");
    });
  });
});
