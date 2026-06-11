#!/usr/bin/env python3
"""Phase 1: Global Tests - TC-G01 to TC-G04"""
from playwright.sync_api import sync_playwright
import os, sys, json

BASE_URL = "http://localhost:5173"
SCREENSHOT_DIR = "/tmp/test_screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

results = []

def record(test_id, name, passed, error="", screenshot=""):
    status = "PASS" if passed else "FAIL"
    results.append({"id": test_id, "name": name, "status": status, "error": error, "screenshot": screenshot})
    print(f"  [{status}] {test_id}: {name}")
    if error:
        print(f"         Error: {error}")

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})
        page.set_default_timeout(10000)

        # TC-G01: Navigate all pages
        print("\n--- TC-G01: Navigate all pages ---")
        pages_to_test = [
            ("/", "dashboard"), ("/tenants", "tenants"), ("/users", "users"),
            ("/roles", "roles"), ("/teams", "teams"), ("/approvals", "approvals"),
            ("/releases", "releases"), ("/support-risks", "support-risks"),
            ("/tickets", "tickets"), ("/audit-logs", "audit-logs"),
            ("/notifications", "notifications"), ("/subscriptions", "subscriptions"),
            ("/invoices", "invoices"), ("/webhooks", "webhooks"),
            ("/integrations", "integrations"), ("/tokens", "tokens"),
            ("/features", "features"), ("/metrics", "metrics"),
        ]
        all_ok = True
        failed = []
        for url_path, name in pages_to_test:
            try:
                page.goto(f"{BASE_URL}{url_path}", timeout=10000)
                page.wait_for_load_state('networkidle', timeout=10000)
                page.wait_for_timeout(500)
                text = page.inner_text('body').strip()
                if not text or len(text) < 20:
                    all_ok = False
                    ss = f"{SCREENSHOT_DIR}/g01_{name}.png"
                    page.screenshot(path=ss)
                    failed.append(f"{name}: blank/empty page")
                    print(f"    FAIL: {name} - blank page")
                else:
                    print(f"    OK: {name} - {len(text)} chars")
            except Exception as e:
                all_ok = False
                ss = f"{SCREENSHOT_DIR}/g01_{name}.png"
                try: page.screenshot(path=ss)
                except: pass
                failed.append(f"{name}: {str(e)[:80]}")
                print(f"    FAIL: {name} - {str(e)[:80]}")
        record("TC-G01", "Navigate all 18 pages - no white screen", all_ok,
               "; ".join(failed) if failed else "")

        # TC-G02: Switch user roles
        print("\n--- TC-G02: Switch user roles ---")
        page.goto(BASE_URL, timeout=10000)
        page.wait_for_load_state('networkidle', timeout=10000)
        page.wait_for_timeout(1000)
        all_users = [
            "platform@example.com · 平台管理员", "苏嘉宁 · Acme 租户管理员",
            "audit@example.com · 审计员", "release@example.com · 发布经理",
            "周然 · Orbit 客户管理员", "陈屿 · Nova 运营成员",
            "方澜 · Nexus Health 客户管理员",
        ]
        role_ok = True
        role_errs = []
        for user in all_users:
            try:
                sel = page.locator('select').first
                sel.select_option(label=user, timeout=5000)
                page.wait_for_timeout(300)
                btn = page.locator('button:has-text("切换")').first
                btn.click(timeout=5000)
                page.wait_for_timeout(800)
                text = page.inner_text('body')
                if len(text) < 100:
                    role_ok = False
                    role_errs.append(f"After {user}: page too short ({len(text)} chars)")
                    print(f"    FAIL: {user}")
                else:
                    print(f"    OK: {user}")
            except Exception as e:
                role_ok = False
                role_errs.append(f"{user}: {str(e)[:60]}")
                print(f"    FAIL: {user} - {str(e)[:60]}")
        record("TC-G02", "Switch user roles - all 7 preset users", role_ok,
               "; ".join(role_errs) if role_errs else "")

        # TC-G03: Search by email
        print("\n--- TC-G03: Search by email ---")
        page.goto(BASE_URL, timeout=10000)
        page.wait_for_load_state('networkidle', timeout=10000)
        page.wait_for_timeout(1000)
        try:
            inp = page.locator('input[placeholder="或输入任意邮箱切换"]').first
            inp.fill("audit@example.com")
            page.wait_for_timeout(300)
            btn = page.locator('button:has-text("切换")').first
            btn.click(timeout=5000)
            page.wait_for_timeout(1000)
            text = page.inner_text('body')
            ok = "audit@example.com" in text
            record("TC-G03", "Search by email - audit@example.com", ok,
                   "Email switch not reflected" if not ok else "",
                   f"{SCREENSHOT_DIR}/g03.png" if not ok else "")
            print(f"    {'OK' if ok else 'FAIL'}")
        except Exception as e:
            record("TC-G03", "Search by email", False, str(e)[:80],
                   f"{SCREENSHOT_DIR}/g03_err.png")
            print(f"    FAIL: {str(e)[:80]}")

        # TC-G04: Sidebar navigation
        print("\n--- TC-G04: Sidebar navigation ---")
        page.goto(BASE_URL, timeout=10000)
        page.wait_for_load_state('networkidle', timeout=10000)
        page.wait_for_timeout(1000)
        nav_links = [
            ("工作台 / 总览", "/"), ("客户 / 租户", "/tenants"),
            ("用户与权限", "/users"), ("角色权限", "/roles"),
            ("团队管理", "/teams"), ("审批中心", "/approvals"),
            ("发布中心", "/releases"), ("风险工单", "/support-risks"),
            ("工单管理", "/tickets"), ("审计日志", "/audit-logs"),
            ("通知中心", "/notifications"), ("订阅管理", "/subscriptions"),
            ("发票管理", "/invoices"), ("Webhook 配置", "/webhooks"),
            ("系统集成", "/integrations"), ("API Token", "/tokens"),
            ("功能开关", "/features"), ("数据分析", "/metrics"),
        ]
        nav_ok = True
        nav_errs = []
        for link_text, expected in nav_links:
            try:
                link = page.locator(f'a:has-text("{link_text}")').first
                link.click(timeout=5000)
                page.wait_for_timeout(800)
                url = page.url
                if expected == "/":
                    ok = url in [BASE_URL + "/", BASE_URL]
                else:
                    ok = expected in url
                if not ok:
                    nav_ok = False
                    nav_errs.append(f"'{link_text}' -> {url} (expected {expected})")
                    print(f"    FAIL: {link_text} -> {url}")
                else:
                    print(f"    OK: {link_text}")
            except Exception as e:
                nav_ok = False
                nav_errs.append(f"'{link_text}': {str(e)[:60]}")
                print(f"    FAIL: {link_text} - {str(e)[:60]}")
        record("TC-G04", "Sidebar navigation links", nav_ok,
               "; ".join(nav_errs) if nav_errs else "")

        browser.close()

    # Summary
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    print(f"\nPhase 1 Summary: {len(results)} tests, {passed} passed, {failed} failed")
    return results

if __name__ == "__main__":
    run()
    print("\n---RESULTS_JSON---")
    print(json.dumps(results, ensure_ascii=False, indent=2))
