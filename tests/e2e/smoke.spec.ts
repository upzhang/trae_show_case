import { test, expect } from "@playwright/test";

// 说明：本文件示例性覆盖主干链路。
// 在 CI 环境下若不稳定，可在 CI 配置中跳过 E2E。

test.use({
  baseURL: "http://localhost:5173"
});

test("登录后能看到工作台统计卡片", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("用户").first()).toBeVisible();
  await expect(page.getByText("待审批").first()).toBeVisible();
});

test("能够从工作台跳转到审批页", async ({ page }) => {
  await page.goto("/");
  await page.getByText("审批").first().click();
  await expect(page.getByRole("heading", { name: "审批列表" })).toBeVisible({ timeout: 5000 });
});
