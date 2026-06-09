import { describe, expect, it } from "vitest";

import { getPermissionsForRoles, hasPermission } from "./rbac";

describe("rbac helpers", () => {
  it("deduplicates permissions from multiple roles", () => {
    const permissions = getPermissionsForRoles([
      "tenant_admin",
      "auditor"
    ]);

    expect(permissions).toContain("audit:view");
    expect(permissions.filter((item) => item === "tenant:view")).toHaveLength(1);
  });

  it("checks permission membership", () => {
    expect(hasPermission(["release_manager"], "release:deploy")).toBe(true);
    expect(hasPermission(["member"], "release:deploy")).toBe(false);
  });
});
