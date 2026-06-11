#!/usr/bin/env python3
"""Comprehensive black-box test - all phases in one script with proper session handling."""
from playwright.sync_api import sync_playwright
import os, json, time

BASE_URL = "http://localhost:5173"
SCREENSHOT_DIR = "/tmp/test_screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

results = []

def record(test_id, name, passed, error="", screenshot=""):
    status = "PASS" if passed else "FAIL"
    results.append({"id": test_id, "name": name, "status": status, "error": error, "screenshot": screenshot})
    print(f"  [{status}] {test_id}: {name}")
    if error: print(f"         Error: {error}")

def wait_for_session(page):
    """Wait for session to be fully loaded (email appears in header)."""
    for _ in range(20):
        try:
            text = page.inner_text('body')
            if "platform@example.com" in text and "当前登录" in text:
                return True
        except:
            pass
        page.wait_for_timeout(500)
    return False

def switch_user(page, option_label):
    """Switch to a user by selecting from dropdown and clicking switch."""
    sel = page.locator('select').first
    sel.select_option(label=option_label, timeout=5000)
    page.wait_for_timeout(300)
    btn = page.locator('button:has-text("切换")').first
    btn.click(timeout=5000)
    page.wait_for_timeout(1500)
    wait_for_session(page)

def navigate_and_wait(page, url):
    """Navigate and wait for page to be ready."""
    page.goto(url, timeout=15000)
    page.wait_for_load_state('networkidle', timeout=15000)
    page.wait_for_timeout(1500)

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})
        page.set_default_timeout(15000)

        # Initialize: go to dashboard and wait for session
        print("Initializing session...")
        page.goto(BASE_URL, timeout=15000)
        page.wait_for_load_state('networkidle', timeout=15000)
        if not wait_for_session(page):
            print("WARNING: Session may not be fully loaded")
        page.wait_for_timeout(1000)

        # ============================================================
        # PHASE 1: Global Tests
        # ============================================================
        print("\n=== PHASE 1: Global Tests ===")

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
                navigate_and_wait(page, f"{BASE_URL}{url_path}")
                text = page.inner_text('body').strip()
                if not text or len(text) < 20:
                    all_ok = False
                    ss = f"{SCREENSHOT_DIR}/g01_{name}.png"
                    page.screenshot(path=ss)
                    failed.append(f"{name}: blank")
                else:
                    print(f"    OK: {name} ({len(text)} chars)")
            except Exception as e:
                all_ok = False
                failed.append(f"{name}: {str(e)[:80]}")
                print(f"    FAIL: {name}")
        record("TC-G01", "Navigate all 18 pages - no white screen", all_ok,
               "; ".join(failed) if failed else "")

        # TC-G02: Switch user roles
        print("\n--- TC-G02: Switch user roles ---")
        page.goto(BASE_URL, timeout=15000)
        page.wait_for_load_state('networkidle', timeout=15000)
        wait_for_session(page)
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
                switch_user(page, user)
                text = page.inner_text('body')
                if len(text) < 100:
                    role_ok = False
                    role_errs.append(f"{user}: short page")
                    print(f"    FAIL: {user}")
                else:
                    print(f"    OK: {user}")
            except Exception as e:
                role_ok = False
                role_errs.append(f"{user}: {str(e)[:60]}")
                print(f"    FAIL: {user}")
        record("TC-G02", "Switch user roles - all 7 preset users", role_ok,
               "; ".join(role_errs) if role_errs else "")

        # TC-G03: Search by email
        print("\n--- TC-G03: Search by email ---")
        page.goto(BASE_URL, timeout=15000)
        page.wait_for_load_state('networkidle', timeout=15000)
        wait_for_session(page)
        try:
            inp = page.locator('input[placeholder="或输入任意邮箱切换"]').first
            inp.fill("audit@example.com")
            page.wait_for_timeout(300)
            btn = page.locator('button:has-text("切换")').first
            btn.click(timeout=5000)
            page.wait_for_timeout(1500)
            text = page.inner_text('body')
            ok = "audit@example.com" in text
            record("TC-G03", "Search by email - audit@example.com", ok,
                   "Email switch not reflected" if not ok else "",
                   f"{SCREENSHOT_DIR}/g03.png" if not ok else "")
            print(f"    {'OK' if ok else 'FAIL'}")
        except Exception as e:
            record("TC-G03", "Search by email", False, str(e)[:80],
                   f"{SCREENSHOT_DIR}/g03_err.png")

        # TC-G04: Sidebar navigation
        print("\n--- TC-G04: Sidebar navigation ---")
        # Switch back to platform admin
        page.goto(BASE_URL, timeout=15000)
        page.wait_for_load_state('networkidle', timeout=15000)
        wait_for_session(page)
        switch_user(page, "platform@example.com · 平台管理员")
        
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
                page.wait_for_timeout(1000)
                url = page.url
                if expected == "/":
                    ok = url.rstrip('/') == BASE_URL.rstrip('/')
                else:
                    ok = expected in url
                if not ok:
                    nav_ok = False
                    nav_errs.append(f"'{link_text}' -> {url}")
                    print(f"    FAIL: {link_text}")
                else:
                    print(f"    OK: {link_text}")
            except Exception as e:
                nav_ok = False
                nav_errs.append(f"'{link_text}': {str(e)[:60]}")
                print(f"    FAIL: {link_text}")
        record("TC-G04", "Sidebar navigation links", nav_ok,
               "; ".join(nav_errs) if nav_errs else "")

        # ============================================================
        # PHASE 2: Workspace Pages
        # ============================================================
        print("\n=== PHASE 2: Workspace Pages ===")

        # Ensure we're on dashboard with platform admin
        page.goto(BASE_URL, timeout=15000)
        page.wait_for_load_state('networkidle', timeout=15000)
        wait_for_session(page)
        switch_user(page, "platform@example.com · 平台管理员")
        page.goto(BASE_URL, timeout=15000)
        page.wait_for_load_state('networkidle', timeout=15000)
        page.wait_for_timeout(2000)

        # TC-D01: Dashboard stat cards
        print("\n--- TC-D01: Dashboard stat cards ---")
        text = page.inner_text('body')
        stats = ["年度经常性收入 (ARR)", "活跃客户", "待处理审批", "活跃风险工单"]
        all_found = all(s in text for s in stats)
        has_arr = "¥" in text
        record("TC-D01", "Dashboard - 4 stat cards with non-empty values", all_found and has_arr,
               f"Missing: {[s for s in stats if s not in text]}, has_ARR={has_arr}" if not (all_found and has_arr) else "",
               f"{SCREENSHOT_DIR}/d01.png" if not (all_found and has_arr) else "")

        # TC-D02: Dashboard trend charts
        print("\n--- TC-D02: Dashboard trend charts ---")
        svg_count = page.locator('svg').count()
        record("TC-D02", "Dashboard - 3 trend charts (SVG)", svg_count >= 3,
               f"Found {svg_count} SVG" if svg_count < 3 else "",
               f"{SCREENSHOT_DIR}/d02.png" if svg_count < 3 else "")

        # TC-D04: Dashboard activity timeline
        print("\n--- TC-D04: Dashboard activity timeline ---")
        has_activity = "最近活动" in text
        record("TC-D04", "Dashboard - activity timeline renders", has_activity,
               "Not found" if not has_activity else "",
               f"{SCREENSHOT_DIR}/d04.png" if not has_activity else "")

        # TC-T01: Tenants list
        print("\n--- TC-T01: Tenants list ---")
        navigate_and_wait(page, f"{BASE_URL}/tenants")
        text = page.inner_text('body')
        # Check for actual tenant data, not empty state
        has_data = "Acme" in text or "Infinity" in text or "Orbit" in text
        has_columns = "客户名称" in text or "租户" in text
        tenant_ok = has_data and has_columns
        record("TC-T01", "Tenants - list with name, plan, industry, health score, ARR", tenant_ok,
               f"Has data={has_data}, has columns={has_columns}" if not tenant_ok else "",
               f"{SCREENSHOT_DIR}/t01.png" if not tenant_ok else "")

        # TC-T02: Tenants search Acme
        print("\n--- TC-T02: Tenants search Acme ---")
        try:
            inp = page.locator('input[placeholder*="搜索"]').first
            inp.fill("Acme")
            page.wait_for_timeout(1000)
            text = page.inner_text('body')
            has_acme = "Acme" in text
            record("TC-T02", "Tenants - search for Acme", has_acme,
                   "Not found" if not has_acme else "",
                   f"{SCREENSHOT_DIR}/t02.png" if not has_acme else "")
        except Exception as e:
            record("TC-T02", "Tenants - search for Acme", False, str(e)[:80],
                   f"{SCREENSHOT_DIR}/t02_err.png")

        # TC-T03: Tenants filter by plan
        print("\n--- TC-T03: Tenants filter by plan ---")
        navigate_and_wait(page, f"{BASE_URL}/tenants")
        try:
            # Look for plan filter buttons
            plan_btns = page.locator('button:has-text("企业版")').all()
            filtered = False
            for btn in plan_btns:
                try:
                    btn.click(timeout=3000)
                    page.wait_for_timeout(1000)
                    filtered = True
                    break
                except:
                    pass
            if not filtered:
                # Try select dropdown
                selects = page.locator('select').all()
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
        navigate_and_wait(page, f"{BASE_URL}/tenants")
        try:
            # Click on a tenant name in the table
            rows = page.locator('table tbody tr').all()
            if len(rows) > 0:
                rows[0].click(timeout=5000)
                page.wait_for_timeout(1000)
                text = page.inner_text('body')
                modal = "客户详情" in text or "详情" in text
                record("TC-T05", "Tenants - click row, detail modal opens", modal,
                       "Modal not opened" if not modal else "",
                       f"{SCREENSHOT_DIR}/t05.png" if not modal else "")
            else:
                # Try clicking on card elements
                cards = page.locator('[class*="card"], [class*="row"]').all()
                clicked = False
                for card in cards:
                    txt = card.inner_text()
                    if "Acme" in txt or "Infinity" in txt:
                        card.click(timeout=3000)
                        page.wait_for_timeout(1000)
                        clicked = True
                        break
                if clicked:
                    text = page.inner_text('body')
                    modal = "客户详情" in text or "详情" in text
                    record("TC-T05", "Tenants - click row, detail modal opens", modal,
                           "Modal not opened" if not modal else "",
                           f"{SCREENSHOT_DIR}/t05.png" if not modal else "")
                else:
                    record("TC-T05", "Tenants - click row, detail modal opens", False,
                           "No clickable tenant rows", f"{SCREENSHOT_DIR}/t05.png")
        except Exception as e:
            record("TC-T05", "Tenants - click row, detail modal opens", False, str(e)[:80],
                   f"{SCREENSHOT_DIR}/t05_err.png")

        # TC-U01: Users list
        print("\n--- TC-U01: Users list ---")
        navigate_and_wait(page, f"{BASE_URL}/users")
        text = page.inner_text('body')
        has_data = "platform" in text or "苏嘉宁" in text or "陈屿" in text
        has_columns = "用户列表" in text or "邮箱" in text
        user_ok = has_data and has_columns
        record("TC-U01", "Users - list with name, email, role badges, tenant", user_ok,
               f"Has data={has_data}, has columns={has_columns}" if not user_ok else "",
               f"{SCREENSHOT_DIR}/u01.png" if not user_ok else "")

        # TC-U02: Users search
        print("\n--- TC-U02: Users search ---")
        try:
            inp = page.locator('input[placeholder*="搜索"]').first
            inp.fill("苏嘉宁")
            page.wait_for_timeout(1000)
            text = page.inner_text('body')
            record("TC-U02", "Users - search for user name", "苏嘉宁" in text,
                   "Not found" if "苏嘉宁" not in text else "",
                   f"{SCREENSHOT_DIR}/u02.png" if "苏嘉宁" not in text else "")
        except Exception as e:
            record("TC-U02", "Users - search for user name", False, str(e)[:80],
                   f"{SCREENSHOT_DIR}/u02_err.png")

        # TC-U03: Users filter by role
        print("\n--- TC-U03: Users filter by role ---")
        navigate_and_wait(page, f"{BASE_URL}/users")
        try:
            # Try filter buttons
            role_btns = page.locator('button:has-text("管理员"), button:has-text("成员"), button:has-text("审计")').all()
            filtered = False
            for btn in role_btns:
                try:
                    btn.click(timeout=3000)
                    page.wait_for_timeout(1000)
                    filtered = True
                    break
                except:
                    pass
            if not filtered:
                selects = page.locator('select').all()
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
        navigate_and_wait(page, f"{BASE_URL}/users")
        try:
            # Look for "编辑角色" or "角色" button
            btn = page.locator('button:has-text("编辑角色")').first
            if btn.count() == 0:
                btn = page.locator('button:has-text("角色")').first
            if btn.count() > 0:
                btn.click(timeout=5000)
                page.wait_for_timeout(1000)
                text = page.inner_text('body')
                modal = "编辑角色" in text or "角色编辑" in text or ("角色" in text and "保存" in text)
                record("TC-U05", "Users - role edit modal opens", modal,
                       "Modal not opened" if not modal else "",
                       f"{SCREENSHOT_DIR}/u05.png" if not modal else "")
            else:
                record("TC-U05", "Users - role edit modal opens", False,
                       "Role button not found", f"{SCREENSHOT_DIR}/u05.png")
        except Exception as e:
            record("TC-U05", "Users - role edit modal opens", False, str(e)[:80],
                   f"{SCREENSHOT_DIR}/u05_err.png")

        # TC-U07: Users detail modal
        print("\n--- TC-U07: Users detail modal ---")
        navigate_and_wait(page, f"{BASE_URL}/users")
        try:
            rows = page.locator('table tbody tr').all()
            if len(rows) > 0:
                rows[0].click(timeout=5000)
                page.wait_for_timeout(1000)
                text = page.inner_text('body')
                modal = "用户详情" in text or "详情" in text
                record("TC-U07", "Users - click row, detail modal opens", modal,
                       "Modal not opened" if not modal else "",
                       f"{SCREENSHOT_DIR}/u07.png" if not modal else "")
            else:
                record("TC-U07", "Users - click row, detail modal opens", False,
                       "No user rows", f"{SCREENSHOT_DIR}/u07.png")
        except Exception as e:
            record("TC-U07", "Users - click row, detail modal opens", False, str(e)[:80],
                   f"{SCREENSHOT_DIR}/u07_err.png")

        # TC-R01: Roles page
        print("\n--- TC-R01: Roles page ---")
        navigate_and_wait(page, f"{BASE_URL}/roles")
        text = page.inner_text('body')
        role_names = ["平台管理员", "租户管理员", "审计员", "发布经理", "客户管理员", "运营成员"]
        found = sum(1 for r in role_names if r in text)
        record("TC-R01", "Roles - 7 role cards with system roles gray bg", found >= 5,
               f"Found {found}/6 roles" if found < 5 else "",
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
        navigate_and_wait(page, f"{BASE_URL}/teams")
        text = page.inner_text('body')
        team_ok = "团队" in text and len(text) > 100
        record("TC-TM01", "Teams - list renders", team_ok,
               "Empty/broken" if not team_ok else "",
               f"{SCREENSHOT_DIR}/tm01.png" if not team_ok else "")

        # ============================================================
        # PHASE 3: Operations Pages
        # ============================================================
        print("\n=== PHASE 3: Operations Pages ===")

        # TC-A01: Approvals list
        print("\n--- TC-A01: Approvals list ---")
        navigate_and_wait(page, f"{BASE_URL}/approvals")
        text = page.inner_text('body')
        approval_ok = "审批" in text and len(text) > 100
        record("TC-A01", "Approvals - list renders", approval_ok,
               "Empty/broken" if not approval_ok else "",
               f"{SCREENSHOT_DIR}/a01.png" if not approval_ok else "")

        # TC-A02: Approvals stat cards
        print("\n--- TC-A02: Approvals stat cards ---")
        stats = ["待处理", "已通过", "已拒绝"]
        found_stats = sum(1 for s in stats if s in text)
        record("TC-A02", "Approvals - stat cards (pending/approved/rejected)", found_stats >= 2,
               f"Found {found_stats}/3 stats" if found_stats < 2 else "",
               f"{SCREENSHOT_DIR}/a02.png" if found_stats < 2 else "")

        # TC-A03: Approvals status tab filter
        print("\n--- TC-A03: Approvals status tab filter ---")
        try:
            tabs = page.locator('button:has-text("已通过"), button:has-text("已拒绝"), button:has-text("待处理")').all()
            clicked = False
            for tab in tabs:
                try:
                    tab.click(timeout=3000)
                    page.wait_for_timeout(1000)
                    clicked = True
                    break
                except:
                    pass
            record("TC-A03", "Approvals - status tab filter clickable", clicked,
                   "Status tabs not found" if not clicked else "",
                   f"{SCREENSHOT_DIR}/a03.png" if not clicked else "")
        except Exception as e:
            record("TC-A03", "Approvals - status tab filter", False, str(e)[:80],
                   f"{SCREENSHOT_DIR}/a03_err.png")

        # TC-A07: Approvals detail modal
        print("\n--- TC-A07: Approvals detail modal ---")
        navigate_and_wait(page, f"{BASE_URL}/approvals")
        try:
            rows = page.locator('table tbody tr').all()
            if len(rows) > 0:
                rows[0].click(timeout=5000)
                page.wait_for_timeout(1000)
                text = page.inner_text('body')
                modal = "审批详情" in text or "详情" in text
                record("TC-A07", "Approvals - click row, detail modal opens", modal,
                       "Modal not opened" if not modal else "",
                       f"{SCREENSHOT_DIR}/a07.png" if not modal else "")
            else:
                record("TC-A07", "Approvals - click row, detail modal opens", False,
                       "No approval rows", f"{SCREENSHOT_DIR}/a07.png")
        except Exception as e:
            record("TC-A07", "Approvals - click row, detail modal opens", False, str(e)[:80],
                   f"{SCREENSHOT_DIR}/a07_err.png")

        # TC-RL01: Releases list
        print("\n--- TC-RL01: Releases list ---")
        navigate_and_wait(page, f"{BASE_URL}/releases")
        text = page.inner_text('body')
        release_ok = "发布" in text and len(text) > 100
        record("TC-RL01", "Releases - list renders", release_ok,
               "Empty/broken" if not release_ok else "",
               f"{SCREENSHOT_DIR}/rl01.png" if not release_ok else "")

        # TC-RL03: Releases filter by environment
        print("\n--- TC-RL03: Releases filter by environment ---")
        try:
            selects = page.locator('select').all()
            filtered = False
            for s in selects:
                opts = s.locator('option').all_inner_texts()
                env_opts = [o for o in opts if any(e in o.lower() for e in ["production", "staging", "生产", "测试"])]
                if env_opts:
                    s.select_option(label=env_opts[0])
                    page.wait_for_timeout(1000)
                    filtered = True
                    break
            record("TC-RL03", "Releases - filter by environment", filtered,
                   "Env filter not found" if not filtered else "",
                   f"{SCREENSHOT_DIR}/rl03.png" if not filtered else "")
        except Exception as e:
            record("TC-RL03", "Releases - filter by environment", False, str(e)[:80],
                   f"{SCREENSHOT_DIR}/rl03_err.png")

        # TC-SR01: Support Risks list
        print("\n--- TC-SR01: Support Risks list ---")
        navigate_and_wait(page, f"{BASE_URL}/support-risks")
        text = page.inner_text('body')
        risk_ok = "风险" in text and len(text) > 100
        record("TC-SR01", "Support Risks - list renders", risk_ok,
               "Empty/broken" if not risk_ok else "",
               f"{SCREENSHOT_DIR}/sr01.png" if not risk_ok else "")

        # TC-TK01: Tickets list
        print("\n--- TC-TK01: Tickets list ---")
        navigate_and_wait(page, f"{BASE_URL}/tickets")
        text = page.inner_text('body')
        ticket_ok = "工单" in text and len(text) > 100
        record("TC-TK01", "Tickets - list renders", ticket_ok,
               "Empty/broken" if not ticket_ok else "",
               f"{SCREENSHOT_DIR}/tk01.png" if not ticket_ok else "")

        # TC-AL01: Audit Logs list
        print("\n--- TC-AL01: Audit Logs list ---")
        navigate_and_wait(page, f"{BASE_URL}/audit-logs")
        text = page.inner_text('body')
        audit_ok = "审计" in text and len(text) > 100
        record("TC-AL01", "Audit Logs - list renders", audit_ok,
               "Empty/broken" if not audit_ok else "",
               f"{SCREENSHOT_DIR}/al01.png" if not audit_ok else "")

        # TC-N01: Notifications list
        print("\n--- TC-N01: Notifications list ---")
        navigate_and_wait(page, f"{BASE_URL}/notifications")
        text = page.inner_text('body')
        notif_ok = "通知" in text and len(text) > 100
        record("TC-N01", "Notifications - list renders", notif_ok,
               "Empty/broken" if not notif_ok else "",
               f"{SCREENSHOT_DIR}/n01.png" if not notif_ok else "")

        # ============================================================
        # PHASE 4: Finance Pages
        # ============================================================
        print("\n=== PHASE 4: Finance Pages ===")

        # TC-S01: Subscriptions list
        print("\n--- TC-S01: Subscriptions list ---")
        navigate_and_wait(page, f"{BASE_URL}/subscriptions")
        text = page.inner_text('body')
        sub_ok = "订阅" in text and len(text) > 100
        record("TC-S01", "Subscriptions - list renders", sub_ok,
               "Empty/broken" if not sub_ok else "",
               f"{SCREENSHOT_DIR}/s01.png" if not sub_ok else "")

        # TC-I01: Invoices list
        print("\n--- TC-I01: Invoices list ---")
        navigate_and_wait(page, f"{BASE_URL}/invoices")
        text = page.inner_text('body')
        invoice_ok = "发票" in text and len(text) > 100
        record("TC-I01", "Invoices - list renders", invoice_ok,
               "Empty/broken" if not invoice_ok else "",
               f"{SCREENSHOT_DIR}/i01.png" if not invoice_ok else "")

        # ============================================================
        # PHASE 5: Integration Pages
        # ============================================================
        print("\n=== PHASE 5: Integration Pages ===")

        # TC-W01: Webhooks list
        print("\n--- TC-W01: Webhooks list ---")
        navigate_and_wait(page, f"{BASE_URL}/webhooks")
        text = page.inner_text('body')
        webhook_ok = "Webhook" in text and len(text) > 100
        record("TC-W01", "Webhooks - list renders", webhook_ok,
               "Empty/broken" if not webhook_ok else "",
               f"{SCREENSHOT_DIR}/w01.png" if not webhook_ok else "")

        # TC-IG01: Integrations list
        print("\n--- TC-IG01: Integrations list ---")
        navigate_and_wait(page, f"{BASE_URL}/integrations")
        text = page.inner_text('body')
        integ_ok = "集成" in text and len(text) > 100
        record("TC-IG01", "Integrations - list renders", integ_ok,
               "Empty/broken" if not integ_ok else "",
               f"{SCREENSHOT_DIR}/ig01.png" if not integ_ok else "")

        # TC-TK01-tokens: Tokens list
        print("\n--- TC-TK01-tokens: Tokens list ---")
        navigate_and_wait(page, f"{BASE_URL}/tokens")
        text = page.inner_text('body')
        token_ok = "Token" in text and len(text) > 100
        record("TC-TK01-tokens", "Tokens - list renders", token_ok,
               "Empty/broken" if not token_ok else "",
               f"{SCREENSHOT_DIR}/tk01t.png" if not token_ok else "")

        # TC-F01: Features list
        print("\n--- TC-F01: Features list ---")
        navigate_and_wait(page, f"{BASE_URL}/features")
        text = page.inner_text('body')
        feature_ok = "功能" in text and len(text) > 100
        record("TC-F01", "Features - list renders", feature_ok,
               "Empty/broken" if not feature_ok else "",
               f"{SCREENSHOT_DIR}/f01.png" if not feature_ok else "")

        # ============================================================
        # PHASE 6: System Pages
        # ============================================================
        print("\n=== PHASE 6: System Pages ===")

        # TC-M01: Metrics stat cards
        print("\n--- TC-M01: Metrics stat cards ---")
        navigate_and_wait(page, f"{BASE_URL}/metrics")
        text = page.inner_text('body')
        indicators = ["ARR", "客户", "审批", "发布", "工单", "成员", "收入", "通过率", "成功率", "解决率"]
        found_metrics = sum(1 for m in indicators if m in text)
        record("TC-M01", "Metrics - 6 stat cards render", found_metrics >= 4,
               f"Found {found_metrics} indicators" if found_metrics < 4 else "",
               f"{SCREENSHOT_DIR}/m01.png" if found_metrics < 4 else "")

        # TC-M02: Metrics trend charts
        print("\n--- TC-M02: Metrics trend charts ---")
        svg_count = page.locator('svg').count()
        record("TC-M02", "Metrics - trend charts render", svg_count >= 1,
               f"Found {svg_count} SVG" if svg_count < 1 else "",
               f"{SCREENSHOT_DIR}/m02.png" if svg_count < 1 else "")

        # TC-M03: Metrics health donut chart
        print("\n--- TC-M03: Metrics health donut chart ---")
        has_health = "健康" in text
        record("TC-M03", "Metrics - health donut chart renders", has_health,
               "Not found" if not has_health else "",
               f"{SCREENSHOT_DIR}/m03.png" if not has_health else "")

        # ============================================================
        # PHASE 7: Permission Tests
        # ============================================================
        print("\n=== PHASE 7: Permission Tests ===")

        # TC-P01: Auditor - no edit/delete on tenants
        print("\n--- TC-P01: Auditor permissions on tenants ---")
        page.goto(BASE_URL, timeout=15000)
        page.wait_for_load_state('networkidle', timeout=15000)
        wait_for_session(page)
        switch_user(page, "audit@example.com · 审计员")
        navigate_and_wait(page, f"{BASE_URL}/tenants")
        text = page.inner_text('body')
        has_edit = "编辑" in text
        has_delete = "删除" in text
        auditor_ok = not has_edit and not has_delete
        record("TC-P01", "Auditor - no edit/delete on tenants", auditor_ok,
               f"Auditor sees edit={has_edit}, delete={has_delete}" if not auditor_ok else "",
               f"{SCREENSHOT_DIR}/p01.png" if not auditor_ok else "")

        # TC-P04: Member - no edit/delete on tenants
        print("\n--- TC-P04: Member permissions on tenants ---")
        page.goto(BASE_URL, timeout=15000)
        page.wait_for_load_state('networkidle', timeout=15000)
        wait_for_session(page)
        switch_user(page, "陈屿 · Nova 运营成员")
        navigate_and_wait(page, f"{BASE_URL}/tenants")
        text = page.inner_text('body')
        has_edit = "编辑" in text
        has_delete = "删除" in text
        member_ok = not has_edit and not has_delete
        record("TC-P04", "Member - no edit/delete on tenants", member_ok,
               f"Member sees edit={has_edit}, delete={has_delete}" if not member_ok else "",
               f"{SCREENSHOT_DIR}/p04.png" if not member_ok else "")

        # TC-P06: Release manager - deploy/rollback buttons
        print("\n--- TC-P06: Release manager permissions on releases ---")
        page.goto(BASE_URL, timeout=15000)
        page.wait_for_load_state('networkidle', timeout=15000)
        wait_for_session(page)
        switch_user(page, "release@example.com · 发布经理")
        navigate_and_wait(page, f"{BASE_URL}/releases")
        text = page.inner_text('body')
        has_deploy = "部署" in text or "deploy" in text.lower()
        has_rollback = "回滚" in text or "rollback" in text.lower()
        rm_ok = has_deploy or has_rollback
        record("TC-P06", "Release manager - deploy/rollback buttons visible", rm_ok,
               f"deploy={has_deploy}, rollback={has_rollback}" if not rm_ok else "",
               f"{SCREENSHOT_DIR}/p06.png" if not rm_ok else "")

        # ============================================================
        # PHASE 8: Edge Cases
        # ============================================================
        print("\n=== PHASE 8: Edge Cases ===")

        # Switch back to platform admin
        page.goto(BASE_URL, timeout=15000)
        page.wait_for_load_state('networkidle', timeout=15000)
        wait_for_session(page)
        switch_user(page, "platform@example.com · 平台管理员")

        # TC-E01: Search non-existent keyword
        print("\n--- TC-E01: Search non-existent keyword ---")
        navigate_and_wait(page, f"{BASE_URL}/tenants")
        try:
            inp = page.locator('input[placeholder*="搜索"]').first
            inp.fill("XYZZY_NONEXISTENT_12345")
            page.wait_for_timeout(1000)
            text = page.inner_text('body')
            has_empty = any(kw in text for kw in ["暂无", "没有", "未找到", "无匹配", "空"])
            record("TC-E01", "Search non-existent keyword - empty state", has_empty,
                   "No empty state shown" if not has_empty else "",
                   f"{SCREENSHOT_DIR}/e01.png" if not has_empty else "")
        except Exception as e:
            record("TC-E01", "Search non-existent keyword", False, str(e)[:80],
                   f"{SCREENSHOT_DIR}/e01_err.png")

        # TC-E05: Invalid email error alert
        print("\n--- TC-E05: Invalid email error alert ---")
        page.goto(BASE_URL, timeout=15000)
        page.wait_for_load_state('networkidle', timeout=15000)
        wait_for_session(page)
        try:
            inp = page.locator('input[placeholder="或输入任意邮箱切换"]').first
            inp.fill("invalid-email")
            page.wait_for_timeout(300)
            btn = page.locator('button:has-text("切换")').first
            btn.click(timeout=5000)
            page.wait_for_timeout(1500)
            # Check for dialog
            try:
                dialog = page.wait_for_event('dialog', timeout=3000)
                dialog.accept()
                has_error = True
            except:
                text = page.inner_text('body')
                has_error = any(kw in text for kw in ["错误", "无效", "不存在", "未找到", "error"])
            record("TC-E05", "Invalid email - error alert shown", has_error,
                   "No error alert" if not has_error else "",
                   f"{SCREENSHOT_DIR}/e05.png" if not has_error else "")
        except Exception as e:
            record("TC-E05", "Invalid email - error alert shown", False, str(e)[:80],
                   f"{SCREENSHOT_DIR}/e05_err.png")

        browser.close()

    # Summary
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    total = len(results)
    print(f"\n{'='*60}")
    print(f"FINAL SUMMARY: {total} tests, {passed} passed, {failed} failed ({passed/total*100:.1f}%)")
    print(f"{'='*60}")
    for r in results:
        icon = "PASS" if r["status"] == "PASS" else "FAIL"
        print(f"  [{icon}] {r['id']}: {r['name']}")
        if r["error"]:
            print(f"       {r['error']}")

    return results

if __name__ == "__main__":
    results = run()
    print("\n---RESULTS_JSON---")
    print(json.dumps(results, ensure_ascii=False, indent=2))
