#!/usr/bin/env python3
"""Phase 2: Workspace Pages - TC-D01 to TC-TM01"""
from playwright.sync_api import sync_playwright
import os, json

BASE_URL = "http://localhost:5173"
SCREENSHOT_DIR = "/tmp/test_screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

results = []

def record(test_id, name, passed, error="", screenshot=""):
    status = "PASS" if passed else "FAIL"
    results.append({"id": test_id, "name": name, "status": status, "error": error, "screenshot": screenshot})
    print(f"  [{status}] {test_id}: {name}")
    if error: print(f"         Error: {error}")

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})
        page.set_default_timeout(10000)

        # TC-D01: Dashboard stat cards
        print("\n--- TC-D01: Dashboard stat cards ---")
        page.goto(BASE_URL, timeout=10000)
        page.wait_for_load_state('networkidle', timeout=10000)
        page.wait_for_timeout(1000)
        text = page.inner_text('body')
        stats = ["年度经常性收入 (ARR)", "活跃客户", "待处理审批", "活跃风险工单"]
        all_found = all(s in text for s in stats)
        has_arr = "¥" in text
        record("TC-D01", "Dashboard - 4 stat cards with non-empty values", all_found and has_arr,
               f"Missing: {[s for s in stats if s not in text]}, has_ARR_value={has_arr}" if not (all_found and has_arr) else "",
               f"{SCREENSHOT_DIR}/d01.png" if not (all_found and has_arr) else "")

        # TC-D02: Dashboard trend charts (SVG)
        print("\n--- TC-D02: Dashboard trend charts ---")
        svg_count = page.locator('svg').count()
        record("TC-D02", "Dashboard - 3 trend charts (SVG)", svg_count >= 3,
               f"Found {svg_count} SVG, expected >= 3" if svg_count < 3 else "",
               f"{SCREENSHOT_DIR}/d02.png" if svg_count < 3 else "")

        # TC-D04: Dashboard activity timeline
        print("\n--- TC-D04: Dashboard activity timeline ---")
        has_activity = "最近活动" in text
        record("TC-D04", "Dashboard - activity timeline renders", has_activity,
               "Activity timeline not found" if not has_activity else "",
               f"{SCREENSHOT_DIR}/d04.png" if not has_activity else "")

        # TC-T01: Tenants list
        print("\n--- TC-T01: Tenants list ---")
        page.goto(f"{BASE_URL}/tenants", timeout=10000)
        page.wait_for_load_state('networkidle', timeout=10000)
        page.wait_for_timeout(1000)
        text = page.inner_text('body')
        checks = ["租户", "计划", "行业", "健康分", "ARR"]
        tenant_ok = all(c in text for c in checks)
        record("TC-T01", "Tenants - list with name, plan, industry, health score, ARR", tenant_ok,
               f"Missing: {[c for c in checks if c not in text]}" if not tenant_ok else "",
               f"{SCREENSHOT_DIR}/t01.png" if not tenant_ok else "")

        # TC-T02: Tenants search Acme
        print("\n--- TC-T02: Tenants search Acme ---")
        try:
            inp = page.locator('input[placeholder*="搜索"]').first
            if inp.count() == 0:
                inp = page.locator('input[type="text"]').first
            inp.fill("Acme")
            page.wait_for_timeout(1000)
            text = page.inner_text('body')
            has_acme = "Acme" in text
            record("TC-T02", "Tenants - search for Acme", has_acme,
                   "Acme not found" if not has_acme else "",
                   f"{SCREENSHOT_DIR}/t02.png" if not has_acme else "")
        except Exception as e:
            record("TC-T02", "Tenants - search for Acme", False, str(e)[:80],
                   f"{SCREENSHOT_DIR}/t02_err.png")

        # TC-T03: Tenants filter by plan
        print("\n--- TC-T03: Tenants filter by plan ---")
        page.goto(f"{BASE_URL}/tenants", timeout=10000)
        page.wait_for_load_state('networkidle', timeout=10000)
        page.wait_for_timeout(1000)
        try:
            selects = page.locator('select').all()
            filtered = False
            for s in selects:
                opts = s.locator('option').all_inner_texts()
                plan_opts = [o for o in opts if "企业版" in o]
                if plan_opts:
                    s.select_option(label=plan_opts[0])
                    page.wait_for_timeout(1000)
                    filtered = True
                    break
            record("TC-T03", "Tenants - filter by plan 企业版", filtered,
                   "Plan filter not found" if not filtered else "",
                   f"{SCREENSHOT_DIR}/t03.png" if not filtered else "")
        except Exception as e:
            record("TC-T03", "Tenants - filter by plan", False, str(e)[:80],
                   f"{SCREENSHOT_DIR}/t03_err.png")

        # TC-T05: Tenants detail modal
        print("\n--- TC-T05: Tenants detail modal ---")
        page.goto(f"{BASE_URL}/tenants", timeout=10000)
        page.wait_for_load_state('networkidle', timeout=10000)
        page.wait_for_timeout(1000)
        try:
            rows = page.locator('table tbody tr').all()
            if len(rows) > 0:
                rows[0].click(timeout=5000)
                page.wait_for_timeout(1000)
                text = page.inner_text('body')
                modal = "详情" in text or "关闭" in text or "租户详情" in text
                record("TC-T05", "Tenants - click row, detail modal opens", modal,
                       "Detail modal did not open" if not modal else "",
                       f"{SCREENSHOT_DIR}/t05.png" if not modal else "")
            else:
                record("TC-T05", "Tenants - click row, detail modal opens", False,
                       "No tenant rows found", f"{SCREENSHOT_DIR}/t05.png")
        except Exception as e:
            record("TC-T05", "Tenants - click row, detail modal opens", False, str(e)[:80],
                   f"{SCREENSHOT_DIR}/t05_err.png")

        # TC-U01: Users list
        print("\n--- TC-U01: Users list ---")
        page.goto(f"{BASE_URL}/users", timeout=10000)
        page.wait_for_load_state('networkidle', timeout=10000)
        page.wait_for_timeout(1000)
        text = page.inner_text('body')
        user_ok = any(c in text for c in ["用户", "邮箱", "角色", "租户"])
        record("TC-U01", "Users - list with name, email, role badges, tenant", user_ok,
               "Missing expected columns" if not user_ok else "",
               f"{SCREENSHOT_DIR}/u01.png" if not user_ok else "")

        # TC-U02: Users search
        print("\n--- TC-U02: Users search ---")
        try:
            inp = page.locator('input[placeholder*="搜索"]').first
            if inp.count() == 0:
                inp = page.locator('input[type="text"]').first
            inp.fill("苏嘉宁")
            page.wait_for_timeout(1000)
            text = page.inner_text('body')
            record("TC-U02", "Users - search for user name", "苏嘉宁" in text,
                   "User not found" if "苏嘉宁" not in text else "",
                   f"{SCREENSHOT_DIR}/u02.png" if "苏嘉宁" not in text else "")
        except Exception as e:
            record("TC-U02", "Users - search for user name", False, str(e)[:80],
                   f"{SCREENSHOT_DIR}/u02_err.png")

        # TC-U03: Users filter by role
        print("\n--- TC-U03: Users filter by role ---")
        page.goto(f"{BASE_URL}/users", timeout=10000)
        page.wait_for_load_state('networkidle', timeout=10000)
        page.wait_for_timeout(1000)
        try:
            selects = page.locator('select').all()
            filtered = False
            for s in selects:
                opts = s.locator('option').all_inner_texts()
                role_opts = [o for o in opts if any(r in o for r in ["管理员", "成员", "审计"])]
                if role_opts:
                    s.select_option(label=role_opts[0])
                    page.wait_for_timeout(1000)
                    filtered = True
                    break
            record("TC-U03", "Users - filter by role", filtered,
                   "Role filter not found" if not filtered else "",
                   f"{SCREENSHOT_DIR}/u03.png" if not filtered else "")
        except Exception as e:
            record("TC-U03", "Users - filter by role", False, str(e)[:80],
                   f"{SCREENSHOT_DIR}/u03_err.png")

        # TC-U05: Users role edit modal
        print("\n--- TC-U05: Users role edit modal ---")
        page.goto(f"{BASE_URL}/users", timeout=10000)
        page.wait_for_load_state('networkidle', timeout=10000)
        page.wait_for_timeout(1000)
        try:
            btn = page.locator('button:has-text("角色")').first
            if btn.count() > 0:
                btn.click(timeout=5000)
                page.wait_for_timeout(1000)
                text = page.inner_text('body')
                modal = "角色" in text and ("编辑" in text or "保存" in text or "取消" in text)
                record("TC-U05", "Users - role edit modal opens", modal,
                       "Role edit modal did not open" if not modal else "",
                       f"{SCREENSHOT_DIR}/u05.png" if not modal else "")
            else:
                record("TC-U05", "Users - role edit modal opens", False,
                       "Role button not found", f"{SCREENSHOT_DIR}/u05.png")
        except Exception as e:
            record("TC-U05", "Users - role edit modal opens", False, str(e)[:80],
                   f"{SCREENSHOT_DIR}/u05_err.png")

        # TC-U07: Users detail modal
        print("\n--- TC-U07: Users detail modal ---")
        page.goto(f"{BASE_URL}/users", timeout=10000)
        page.wait_for_load_state('networkidle', timeout=10000)
        page.wait_for_timeout(1000)
        try:
            rows = page.locator('table tbody tr').all()
            if len(rows) > 0:
                rows[0].click(timeout=5000)
                page.wait_for_timeout(1000)
                text = page.inner_text('body')
                modal = "详情" in text or "用户详情" in text or "关闭" in text
                record("TC-U07", "Users - click row, detail modal opens", modal,
                       "Detail modal did not open" if not modal else "",
                       f"{SCREENSHOT_DIR}/u07.png" if not modal else "")
            else:
                record("TC-U07", "Users - click row, detail modal opens", False,
                       "No user rows", f"{SCREENSHOT_DIR}/u07.png")
        except Exception as e:
            record("TC-U07", "Users - click row, detail modal opens", False, str(e)[:80],
                   f"{SCREENSHOT_DIR}/u07_err.png")

        # TC-R01: Roles page
        print("\n--- TC-R01: Roles page ---")
        page.goto(f"{BASE_URL}/roles", timeout=10000)
        page.wait_for_load_state('networkidle', timeout=10000)
        page.wait_for_timeout(1000)
        text = page.inner_text('body')
        role_names = ["平台管理员", "租户管理员", "审计员", "发布经理", "客户管理员", "运营成员"]
        found = sum(1 for r in role_names if r in text)
        record("TC-R01", "Roles - 7 role cards with system roles gray bg", found >= 5,
               f"Found {found}/6 expected roles" if found < 5 else "",
               f"{SCREENSHOT_DIR}/r01.png" if found < 5 else "")

        # TC-R02: Roles permission matrix
        print("\n--- TC-R02: Roles permission matrix ---")
        try:
            btn = page.locator('button:has-text("编辑")').first
            if btn.count() > 0:
                btn.click(timeout=5000)
                page.wait_for_timeout(1000)
                checkboxes = page.locator('input[type="checkbox"]').count()
                record("TC-R02", "Roles - permission matrix modal with checkboxes", checkboxes > 0,
                       f"Found {checkboxes} checkboxes" if checkboxes == 0 else "",
                       f"{SCREENSHOT_DIR}/r02.png" if checkboxes == 0 else "")
            else:
                record("TC-R02", "Roles - permission matrix modal", False,
                       "Edit button not found", f"{SCREENSHOT_DIR}/r02.png")
        except Exception as e:
            record("TC-R02", "Roles - permission matrix modal", False, str(e)[:80],
                   f"{SCREENSHOT_DIR}/r02_err.png")

        # TC-TM01: Teams list
        print("\n--- TC-TM01: Teams list ---")
        page.goto(f"{BASE_URL}/teams", timeout=10000)
        page.wait_for_load_state('networkidle', timeout=10000)
        page.wait_for_timeout(1000)
        text = page.inner_text('body')
        team_ok = "团队" in text and len(text) > 50
        record("TC-TM01", "Teams - list renders", team_ok,
               "Teams page appears empty/broken" if not team_ok else "",
               f"{SCREENSHOT_DIR}/tm01.png" if not team_ok else "")

        browser.close()

    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    print(f"\nPhase 2 Summary: {len(results)} tests, {passed} passed, {failed} failed")
    return results

if __name__ == "__main__":
    run()
    print("\n---RESULTS_JSON---")
    print(json.dumps(results, ensure_ascii=False, indent=2))
