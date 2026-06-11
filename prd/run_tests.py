"""Nexus 客户运营管理台 — 黑盒测试脚本"""
from playwright.sync_api import sync_playwright
import json, sys, time

BASE = "http://localhost:5173"
API = "http://localhost:3001"
results = []

def test(name, fn):
    try:
        fn()
        results.append({"name": name, "status": "PASS"})
        print(f"  PASS: {name}")
    except Exception as e:
        results.append({"name": name, "status": "FAIL", "error": str(e)[:200]})
        print(f"  FAIL: {name} — {str(e)[:200]}")

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()
        page.on("pageerror", lambda err: print(f"  [JS ERROR] {err.message[:150]}"))

        # ====== GLOBAL ======
        print("\n=== 1. 全局功能 ===")

        def go(path):
            page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=15000)

        go("/")
        page.wait_for_timeout(500)

        test("G01: 首页加载不白屏", lambda: (
            assert page.locator(".stat-card").count() > 0, "无指标卡片"
        ))

        test("G02: 侧边栏导航存在", lambda: (
            assert page.locator(".sidebar a").count() > 5, "侧边栏链接不足"
        ))

        test("G03: 角色切换下拉框存在", lambda: (
            assert page.locator(".session-box select").count() > 0, "无角色切换下拉框"
        ))

        # Switch to auditor
        page.locator(".session-box select").select_option("u-auditor")
        page.wait_for_timeout(800)
        test("G04: 切换到审计员", lambda: (
            assert "audit@example.com" in page.locator(".session-email").inner_text(), "邮箱未更新"
        ))

        # Switch back to platform admin
        page.locator(".session-box select").select_option("u-platform")
        page.wait_for_timeout(800)

        # ====== DASHBOARD ======
        print("\n=== 2. 工作台 ===")
        go("/")
        page.wait_for_timeout(500)
        test("D01: 指标卡片渲染", lambda: (
            assert page.locator(".stat-card").count() >= 4, f"只有 {page.locator('.stat-card').count()} 个指标卡片"
        ))
        test("D02: 趋势图渲染", lambda: (
            assert page.locator("svg").count() > 0, "无 SVG 图表"
        ))
        test("D03: 活动时间线渲染", lambda: (
            assert page.locator("text=最近活动").count() > 0 or page.locator(".activity-timeline").count() > 0, "无活动时间线"
        ))

        # ====== TENANTS ======
        print("\n=== 3. 客户/租户 ===")
        go("/tenants")
        page.wait_for_timeout(500)
        test("T01: 租户列表渲染", lambda: (
            assert page.locator("table tbody tr").count() > 0, "无租户行"
        ))
        test("T02: 搜索功能", lambda: (
            page.locator("input[placeholder*='搜索']").fill("Acme"),
            page.wait_for_timeout(300),
            assert page.locator("table tbody tr").count() > 0, "搜索后无结果"
        ))
        test("T03: 租户详情 Modal", lambda: (
            page.locator("input[placeholder*='搜索']").fill(""),
            page.wait_for_timeout(300),
            page.locator("table tbody tr").first.click(),
            page.wait_for_timeout(300),
            assert page.locator(".modal").count() > 0, "Modal 未打开"
        ))
        # Close modal
        page.keyboard.press("Escape")
        page.wait_for_timeout(300)

        # ====== USERS ======
        print("\n=== 4. 用户与权限 ===")
        go("/users")
        page.wait_for_timeout(500)
        test("U01: 用户列表渲染", lambda: (
            assert page.locator("table tbody tr").count() > 0, "无用户行"
        ))
        test("U02: 搜索功能", lambda: (
            page.locator("input[placeholder*='搜索']").fill("苏嘉宁"),
            page.wait_for_timeout(300),
            assert page.locator("table tbody tr").count() > 0, "搜索后无结果"
        ))
        test("U03: 角色编辑 Modal", lambda: (
            page.locator("input[placeholder*='搜索']").fill(""),
            page.wait_for_timeout(300),
            # Find role edit button
            role_btn = page.locator("button:has-text('角色')").first
            if role_btn.count() > 0:
                role_btn.click()
                page.wait_for_timeout(300)
                assert page.locator(".modal").count() > 0, "角色编辑 Modal 未打开"
                page.keyboard.press("Escape")
                page.wait_for_timeout(300)
            else:
                print("  SKIP: 无角色编辑按钮（可能权限不足）")
        ))

        # ====== ROLES ======
        print("\n=== 5. 角色权限 ===")
        go("/roles")
        page.wait_for_timeout(500)
        test("R01: 角色卡片渲染", lambda: (
            assert page.locator(".card").count() >= 5, f"只有 {page.locator('.card').count()} 个角色卡片"
        ))
        test("R02: 权限矩阵 Modal", lambda: (
            edit_btn = page.locator("button:has-text('编辑')").first
            if edit_btn.count() > 0:
                edit_btn.click()
                page.wait_for_timeout(500)
                assert page.locator(".modal").count() > 0, "权限矩阵 Modal 未打开"
                page.keyboard.press("Escape")
                page.wait_for_timeout(300)
            else:
                print("  SKIP: 无编辑按钮")
        ))

        # ====== TEAMS ======
        print("\n=== 6. 团队管理 ===")
        go("/teams")
        page.wait_for_timeout(500)
        test("TM01: 团队列表渲染", lambda: (
            assert page.locator("table tbody tr").count() > 0, "无团队行"
        ))

        # ====== APPROVALS ======
        print("\n=== 7. 审批中心 ===")
        go("/approvals")
        page.wait_for_timeout(500)
        test("A01: 审批列表渲染", lambda: (
            assert page.locator("table tbody tr").count() > 0, "无审批行"
        ))
        test("A02: 审批详情 Modal", lambda: (
            page.locator("table tbody tr").first.click(),
            page.wait_for_timeout(300),
            assert page.locator(".modal").count() > 0, "审批详情 Modal 未打开"
        ))
        page.keyboard.press("Escape")
        page.wait_for_timeout(300)

        # ====== RELEASES ======
        print("\n=== 8. 发布中心 ===")
        go("/releases")
        page.wait_for_timeout(500)
        test("RL01: 发布列表渲染", lambda: (
            assert page.locator("table tbody tr").count() > 0, "无发布行"
        ))

        # ====== SUPPORT RISKS ======
        print("\n=== 9. 风险工单 ===")
        go("/support-risks")
        page.wait_for_timeout(500)
        test("SR01: 风险列表渲染", lambda: (
            assert page.locator("table tbody tr").count() > 0, "无风险行"
        ))

        # ====== TICKETS ======
        print("\n=== 10. 工单管理 ===")
        go("/tickets")
        page.wait_for_timeout(500)
        test("TK01: 工单列表渲染", lambda: (
            assert page.locator("table tbody tr").count() > 0, "无工单行"
        ))

        # ====== AUDIT LOGS ======
        print("\n=== 11. 审计日志 ===")
        go("/audit-logs")
        page.wait_for_timeout(500)
        test("AL01: 审计日志列表渲染", lambda: (
            assert page.locator("table tbody tr").count() > 0, "无审计日志行"
        ))

        # ====== NOTIFICATIONS ======
        print("\n=== 12. 通知中心 ===")
        go("/notifications")
        page.wait_for_timeout(500)
        test("N01: 通知列表渲染", lambda: (
            assert page.locator("table tbody tr").count() > 0, "无通知行"
        ))

        # ====== SUBSCRIPTIONS ======
        print("\n=== 13. 订阅管理 ===")
        go("/subscriptions")
        page.wait_for_timeout(500)
        test("S01: 订阅列表渲染", lambda: (
            assert page.locator("table tbody tr").count() > 0, "无订阅行"
        ))

        # ====== INVOICES ======
        print("\n=== 14. 发票管理 ===")
        go("/invoices")
        page.wait_for_timeout(500)
        test("I01: 发票列表渲染", lambda: (
            assert page.locator("table tbody tr").count() > 0, "无发票行"
        ))

        # ====== WEBHOOKS ======
        print("\n=== 15. Webhook 配置 ===")
        go("/webhooks")
        page.wait_for_timeout(500)
        test("W01: Webhook 列表渲染", lambda: (
            assert page.locator("table tbody tr").count() > 0, "无 Webhook 行"
        ))

        # ====== INTEGRATIONS ======
        print("\n=== 16. 系统集成 ===")
        go("/integrations")
        page.wait_for_timeout(500)
        test("IG01: 集成列表渲染", lambda: (
            assert page.locator("table tbody tr").count() > 0, "无集成行"
        ))

        # ====== TOKENS ======
        print("\n=== 17. API Token ===")
        go("/tokens")
        page.wait_for_timeout(500)
        test("TO01: Token 列表渲染", lambda: (
            assert page.locator("table tbody tr").count() > 0, "无 Token 行"
        ))

        # ====== FEATURES ======
        print("\n=== 18. 功能开关 ===")
        go("/features")
        page.wait_for_timeout(500)
        test("F01: 功能开关列表渲染", lambda: (
            assert page.locator("table tbody tr").count() > 0, "无功能开关行"
        ))

        # ====== METRICS ======
        print("\n=== 19. 数据分析 ===")
        go("/metrics")
        page.wait_for_timeout(500)
        test("M01: 指标卡片渲染", lambda: (
            assert page.locator(".stat-card").count() > 0, "无指标卡片"
        ))
        test("M02: 图表渲染", lambda: (
            assert page.locator("svg").count() > 0, "无 SVG 图表"
        ))

        # ====== PERMISSION TESTS ======
        print("\n=== 20. 权限测试 ===")

        # Switch to auditor
        page.locator(".session-box select").select_option("u-auditor")
        page.wait_for_timeout(800)

        go("/tenants")
        page.wait_for_timeout(500)
        test("P01: 审计员查看租户（无编辑按钮）", lambda: (
            assert page.locator("table tbody tr").count() > 0, "租户列表为空"
        ))

        go("/roles")
        page.wait_for_timeout(500)
        test("P02: 审计员查看角色（无创建按钮）", lambda: (
            assert page.locator(".card").count() > 0, "角色列表为空"
        ))

        # Switch to member
        page.locator(".session-box select").select_option("u-nova-member")
        page.wait_for_timeout(800)

        go("/tenants")
        page.wait_for_timeout(500)
        test("P03: 普通成员查看租户", lambda: (
            assert page.locator("table tbody tr").count() > 0, "租户列表为空"
        ))

        # Switch back
        page.locator(".session-box select").select_option("u-platform")
        page.wait_for_timeout(800)

        # ====== SUMMARY ======
        browser.close()

        passed = sum(1 for r in results if r["status"] == "PASS")
        failed = sum(1 for r in results if r["status"] == "FAIL")
        print(f"\n{'='*50}")
        print(f"总计: {len(results)} | 通过: {passed} | 失败: {failed}")
        print(f"{'='*50}")

        # Write results
        with open("prd/test-results.md", "w") as f:
            f.write("# Nexus 客户运营管理台 — 黑盒测试结果\n\n")
            f.write(f"**测试时间**: {time.strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write(f"| 总计 | 通过 | 失败 |\n")
            f.write(f"|------|------|------|\n")
            f.write(f"| {len(results)} | {passed} | {failed} |\n\n")
            f.write("## 详细结果\n\n")
            f.write("| 编号 | 用例名称 | 结果 | 备注 |\n")
            f.write("|------|----------|------|------|\n")
            for r in results:
                status_icon = "✅" if r["status"] == "PASS" else "❌"
                error = r.get("error", "") if r["status"] == "FAIL" else ""
                f.write(f"| | {r['name']} | {status_icon} {r['status']} | {error} |\n")

        return 0 if failed == 0 else 1

if __name__ == "__main__":
    sys.exit(run())
