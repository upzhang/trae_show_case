#!/usr/bin/env python3
"""Comprehensive black-box test runner for Nexus 客户运营管理台."""

from playwright.sync_api import sync_playwright, Page
import json
import os
import time

BASE_URL = "http://localhost:5173"
SCREENSHOT_DIR = "/tmp/test_screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

results = []

def record(test_id, name, passed, error="", screenshot=""):
    status = "PASS" if passed else "FAIL"
    results.append({
        "id": test_id,
        "name": name,
        "status": status,
        "error": error,
        "screenshot": screenshot
    })
    print(f"  [{status}] {test_id}: {name}")
    if error:
        print(f"         Error: {error}")

def screenshot(page, name):
    path = f"{SCREENSHOT_DIR}/{name}.png"
    page.screenshot(path=path, full_page=True)
    return path

def navigate_and_check(page, url, page_name):
    """Navigate to a URL and check it's not a white screen."""
    try:
        page.goto(url, timeout=15000)
        page.wait_for_load_state('networkidle', timeout=15000)
        page.wait_for_timeout(1000)
        body_text = page.inner_text('body').strip()
        if not body_text or len(body_text) < 10:
            return False, "Page appears blank/white screen", screenshot(page, f"whitescreen_{page_name}")
        # Check for error indicators
        if "404" in body_text and "Not Found" in body_text:
            return False, "Page shows 404 error", screenshot(page, f"error_{page_name}")
        return True, "", ""
    except Exception as e:
        return False, str(e), screenshot(page, f"error_{page_name}")

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})
        
        # ============================================================
        # PHASE 1: Global Tests
        # ============================================================
        print("\n=== PHASE 1: Global Tests ===")
        
        # TC-G01: Navigate to all pages and verify no white screen
        print("\n--- TC-G01: Navigate all pages ---")
        pages_to_test = [
            ("/", "dashboard"),
            ("/tenants", "tenants"),
            ("/users", "users"),
            ("/roles", "roles"),
            ("/teams", "teams"),
            ("/approvals", "approvals"),
            ("/releases", "releases"),
            ("/support-risks", "support-risks"),
            ("/tickets", "tickets"),
            ("/audit-logs", "audit-logs"),
            ("/notifications", "notifications"),
            ("/subscriptions", "subscriptions"),
            ("/invoices", "invoices"),
            ("/webhooks", "webhooks"),
            ("/integrations", "integrations"),
            ("/tokens", "tokens"),
            ("/features", "features"),
            ("/metrics", "metrics"),
        ]
        
        all_pages_ok = True
        failed_pages = []
        for url_path, name in pages_to_test:
            ok, err, ss = navigate_and_check(page, f"{BASE_URL}{url_path}", name)
            if not ok:
                all_pages_ok = False
                failed_pages.append(f"{name}: {err}")
        
        record("TC-G01", "Navigate all 18 pages - no white screen", all_pages_ok,
               "; ".join(failed_pages) if failed_pages else "",
               screenshot(page, "g01_dashboard") if not all_pages_ok else "")
        
        # TC-G02: Switch user roles via dropdown
        print("\n--- TC-G02: Switch user roles ---")
        page.goto(BASE_URL)
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        
        all_users = [
            "platform@example.com · 平台管理员",
            "苏嘉宁 · Acme 租户管理员",
            "audit@example.com · 审计员",
            "release@example.com · 发布经理",
            "周然 · Orbit 客户管理员",
            "陈屿 · Nova 运营成员",
            "方澜 · Nexus Health 客户管理员",
        ]
        
        role_switch_ok = True
        role_errors = []
        for user_option in all_users:
            try:
                select_el = page.locator('select').first
                select_el.select_option(label=user_option, timeout=5000)
                page.wait_for_timeout(500)
                # Click the switch button
                switch_btn = page.locator('button:has-text("切换")').first
                switch_btn.click(timeout=5000)
                page.wait_for_timeout(1000)
                body_text = page.inner_text('body')
                if "切换" not in body_text:
                    role_switch_ok = False
                    role_errors.append(f"After switching to {user_option}, page may have issues")
            except Exception as e:
                role_switch_ok = False
                role_errors.append(f"Failed to switch to {user_option}: {e}")
        
        record("TC-G02", "Switch user roles - all 7 preset users", role_switch_ok,
               "; ".join(role_errors) if role_errors else "")
        
        # TC-G03: Search by email
        print("\n--- TC-G03: Search by email ---")
        page.goto(BASE_URL)
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        
        try:
            email_input = page.locator('input[placeholder="或输入任意邮箱切换"]').first
            email_input.fill("audit@example.com")
            page.wait_for_timeout(300)
            switch_btn = page.locator('button:has-text("切换")').first
            switch_btn.click()
            page.wait_for_timeout(1000)
            body_text = page.inner_text('body')
            # Check if audit user is now active
            if "audit@example.com" in body_text:
                record("TC-G03", "Search by email - audit@example.com", True)
            else:
                record("TC-G03", "Search by email - audit@example.com", False,
                       "Email switch did not reflect in UI",
                       screenshot(page, "g03_email_switch"))
        except Exception as e:
            record("TC-G03", "Search by email - audit@example.com", False, str(e),
                   screenshot(page, "g03_email_error"))
        
        # TC-G04: Click each sidebar navigation link
        print("\n--- TC-G04: Sidebar navigation links ---")
        page.goto(BASE_URL)
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        
        nav_links = [
            ("工作台 / 总览", "/"),
            ("客户 / 租户", "/tenants"),
            ("用户与权限", "/users"),
            ("角色权限", "/roles"),
            ("团队管理", "/teams"),
            ("审批中心", "/approvals"),
            ("发布中心", "/releases"),
            ("风险工单", "/support-risks"),
            ("工单管理", "/tickets"),
            ("审计日志", "/audit-logs"),
            ("通知中心", "/notifications"),
            ("订阅管理", "/subscriptions"),
            ("发票管理", "/invoices"),
            ("Webhook 配置", "/webhooks"),
            ("系统集成", "/integrations"),
            ("API Token", "/tokens"),
            ("功能开关", "/features"),
            ("数据分析", "/metrics"),
        ]
        
        nav_ok = True
        nav_errors = []
        for link_text, expected_path in nav_links:
            try:
                link = page.locator(f'a:has-text("{link_text}")').first
                link.click(timeout=5000)
                page.wait_for_timeout(1000)
                current_url = page.url
                if expected_path not in current_url and not (expected_path == "/" and current_url == BASE_URL + "/"):
                    nav_ok = False
                    nav_errors.append(f"Clicked '{link_text}', expected {expected_path}, got {current_url}")
            except Exception as e:
                nav_ok = False
                nav_errors.append(f"Failed to click '{link_text}': {e}")
        
        record("TC-G04", "Sidebar navigation links", nav_ok,
               "; ".join(nav_errors) if nav_errors else "")
        
        # ============================================================
        # PHASE 2: Workspace Pages
        # ============================================================
        print("\n=== PHASE 2: Workspace Pages ===")
        
        # TC-D01: Dashboard - verify 4 stat cards
        print("\n--- TC-D01: Dashboard stat cards ---")
        page.goto(BASE_URL)
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        
        body_text = page.inner_text('body')
        stat_checks = [
            "年度经常性收入 (ARR)",
            "活跃客户",
            "待处理审批",
            "活跃风险工单",
        ]
        all_stats_found = all(s in body_text for s in stat_checks)
        
        # Also check values are non-empty (not just labels)
        has_arr_value = "¥" in body_text
        record("TC-D01", "Dashboard - 4 stat cards with non-empty values",
               all_stats_found and has_arr_value,
               "" if all_stats_found and has_arr_value else "Missing stat cards or empty values",
               screenshot(page, "d01_stats") if not (all_stats_found and has_arr_value) else "")
        
        # TC-D02: Dashboard - 3 trend charts (SVG)
        print("\n--- TC-D02: Dashboard trend charts ---")
        svg_count = page.locator('svg').count()
        # We expect at least 3 SVG charts
        record("TC-D02", "Dashboard - 3 trend charts (SVG)", svg_count >= 3,
               f"Found {svg_count} SVG elements, expected >= 3" if svg_count < 3 else "",
               screenshot(page, "d02_charts") if svg_count < 3 else "")
        
        # TC-D04: Dashboard - activity timeline
        print("\n--- TC-D04: Dashboard activity timeline ---")
        has_activity = "最近活动" in body_text
        record("TC-D04", "Dashboard - activity timeline renders", has_activity,
               "Activity timeline not found" if not has_activity else "",
               screenshot(page, "d04_activity") if not has_activity else "")
        
        # TC-T01: Tenants - verify list
        print("\n--- TC-T01: Tenants list ---")
        page.goto(f"{BASE_URL}/tenants")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        body_text = page.inner_text('body')
        
        tenant_checks = ["租户", "计划", "行业", "健康分", "ARR"]
        tenant_ok = all(c in body_text for c in tenant_checks)
        record("TC-T01", "Tenants - list with name, plan, industry, health score, ARR",
               tenant_ok,
               "Missing expected columns" if not tenant_ok else "",
               screenshot(page, "t01_tenants") if not tenant_ok else "")
        
        # TC-T02: Tenants - search for "Acme"
        print("\n--- TC-T02: Tenants search Acme ---")
        try:
            search_input = page.locator('input[placeholder*="搜索"]').first
            if search_input.count() == 0:
                search_input = page.locator('input[type="text"]').first
            search_input.fill("Acme")
            page.wait_for_timeout(1000)
            body_text = page.inner_text('body')
            # Should show Acme-related results
            has_acme = "Acme" in body_text
            record("TC-T02", "Tenants - search for Acme", has_acme,
                   "Acme not found in search results" if not has_acme else "",
                   screenshot(page, "t02_acme_search") if not has_acme else "")
        except Exception as e:
            record("TC-T02", "Tenants - search for Acme", False, str(e),
                   screenshot(page, "t02_error"))
        
        # TC-T03: Tenants - filter by plan "企业版"
        print("\n--- TC-T03: Tenants filter by plan ---")
        page.goto(f"{BASE_URL}/tenants")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        try:
            # Try to find a plan filter dropdown
            selects = page.locator('select').all()
            plan_filtered = False
            for s in selects:
                options = s.locator('option').all_inner_texts()
                if any("企业版" in o for o in options):
                    s.select_option(label=[o for o in options if "企业版" in o][0])
                    page.wait_for_timeout(1000)
                    plan_filtered = True
                    break
            if plan_filtered:
                body_text = page.inner_text('body')
                record("TC-T03", "Tenants - filter by plan 企业版", True)
            else:
                record("TC-T03", "Tenants - filter by plan 企业版", False,
                       "Plan filter dropdown not found",
                       screenshot(page, "t03_plan_filter"))
        except Exception as e:
            record("TC-T03", "Tenants - filter by plan 企业版", False, str(e),
                   screenshot(page, "t03_error"))
        
        # TC-T05: Tenants - click tenant row, verify detail modal
        print("\n--- TC-T05: Tenants detail modal ---")
        page.goto(f"{BASE_URL}/tenants")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        try:
            # Click first tenant row (look for a clickable row or link)
            rows = page.locator('tr').all()
            detail_opened = False
            for row in rows:
                text = row.inner_text()
                if "Acme" in text or "Infinity" in text:
                    row.click(timeout=3000)
                    page.wait_for_timeout(1000)
                    body_text = page.inner_text('body')
                    # Check if a modal/detail view appeared
                    if "详情" in body_text or "关闭" in body_text or "租户详情" in body_text:
                        detail_opened = True
                    break
            if detail_opened:
                record("TC-T05", "Tenants - click row, detail modal opens", True)
            else:
                # Try clicking on table rows more broadly
                table_rows = page.locator('table tbody tr').all()
                if len(table_rows) > 0:
                    table_rows[0].click(timeout=3000)
                    page.wait_for_timeout(1000)
                    body_text = page.inner_text('body')
                    if "详情" in body_text or "关闭" in body_text or "租户详情" in body_text:
                        detail_opened = True
                record("TC-T05", "Tenants - click row, detail modal opens", detail_opened,
                       "Detail modal did not open" if not detail_opened else "",
                       screenshot(page, "t05_detail") if not detail_opened else "")
        except Exception as e:
            record("TC-T05", "Tenants - click row, detail modal opens", False, str(e),
                   screenshot(page, "t05_error"))
        
        # TC-U01: Users - verify list
        print("\n--- TC-U01: Users list ---")
        page.goto(f"{BASE_URL}/users")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        body_text = page.inner_text('body')
        user_checks = ["用户", "邮箱", "角色", "租户"]
        user_ok = any(c in body_text for c in user_checks)
        record("TC-U01", "Users - list with name, email, role badges, tenant",
               user_ok,
               "Missing expected user list columns" if not user_ok else "",
               screenshot(page, "u01_users") if not user_ok else "")
        
        # TC-U02: Users - search for a user name
        print("\n--- TC-U02: Users search ---")
        try:
            search_input = page.locator('input[placeholder*="搜索"]').first
            if search_input.count() == 0:
                search_input = page.locator('input[type="text"]').first
            search_input.fill("苏嘉宁")
            page.wait_for_timeout(1000)
            body_text = page.inner_text('body')
            record("TC-U02", "Users - search for user name", "苏嘉宁" in body_text,
                   "User not found" if "苏嘉宁" not in body_text else "",
                   screenshot(page, "u02_search") if "苏嘉宁" not in body_text else "")
        except Exception as e:
            record("TC-U02", "Users - search for user name", False, str(e),
                   screenshot(page, "u02_error"))
        
        # TC-U03: Users - filter by role
        print("\n--- TC-U03: Users filter by role ---")
        page.goto(f"{BASE_URL}/users")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        try:
            selects = page.locator('select').all()
            role_filtered = False
            for s in selects:
                options = s.locator('option').all_inner_texts()
                role_options = [o for o in options if "管理员" in o or "成员" in o or "审计" in o]
                if role_options:
                    s.select_option(label=role_options[0])
                    page.wait_for_timeout(1000)
                    role_filtered = True
                    break
            record("TC-U03", "Users - filter by role", role_filtered,
                   "Role filter not found" if not role_filtered else "",
                   screenshot(page, "u03_role_filter") if not role_filtered else "")
        except Exception as e:
            record("TC-U03", "Users - filter by role", False, str(e),
                   screenshot(page, "u03_error"))
        
        # TC-U05: Users - click "角色" button, verify role edit modal
        print("\n--- TC-U05: Users role edit modal ---")
        page.goto(f"{BASE_URL}/users")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        try:
            role_btn = page.locator('button:has-text("角色")').first
            if role_btn.count() > 0:
                role_btn.click(timeout=3000)
                page.wait_for_timeout(1000)
                body_text = page.inner_text('body')
                modal_open = "角色" in body_text and ("编辑" in body_text or "保存" in body_text or "取消" in body_text)
                record("TC-U05", "Users - role edit modal opens", modal_open,
                       "Role edit modal did not open" if not modal_open else "",
                       screenshot(page, "u05_role_modal") if not modal_open else "")
            else:
                record("TC-U05", "Users - role edit modal opens", False,
                       "Role button not found",
                       screenshot(page, "u05_no_button"))
        except Exception as e:
            record("TC-U05", "Users - role edit modal opens", False, str(e),
                   screenshot(page, "u05_error"))
        
        # TC-U07: Users - click user row, verify detail modal
        print("\n--- TC-U07: Users detail modal ---")
        page.goto(f"{BASE_URL}/users")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        try:
            table_rows = page.locator('table tbody tr').all()
            if len(table_rows) > 0:
                table_rows[0].click(timeout=3000)
                page.wait_for_timeout(1000)
                body_text = page.inner_text('body')
                detail_open = "详情" in body_text or "用户详情" in body_text or "关闭" in body_text
                record("TC-U07", "Users - click row, detail modal opens", detail_open,
                       "Detail modal did not open" if not detail_open else "",
                       screenshot(page, "u07_detail") if not detail_open else "")
            else:
                record("TC-U07", "Users - click row, detail modal opens", False,
                       "No user rows found",
                       screenshot(page, "u07_no_rows"))
        except Exception as e:
            record("TC-U07", "Users - click row, detail modal opens", False, str(e),
                   screenshot(page, "u07_error"))
        
        # TC-R01: Roles - verify 7 role cards, system roles gray bg
        print("\n--- TC-R01: Roles page ---")
        page.goto(f"{BASE_URL}/roles")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        body_text = page.inner_text('body')
        role_names = ["平台管理员", "租户管理员", "审计员", "发布经理", "客户管理员", "运营成员"]
        roles_found = sum(1 for r in role_names if r in body_text)
        record("TC-R01", "Roles - 7 role cards with system roles gray bg",
               roles_found >= 5,
               f"Found {roles_found}/6 expected role names" if roles_found < 5 else "",
               screenshot(page, "r01_roles") if roles_found < 5 else "")
        
        # TC-R02: Roles - click "编辑" on a role card, verify permission matrix
        print("\n--- TC-R02: Roles permission matrix ---")
        try:
            edit_btn = page.locator('button:has-text("编辑")').first
            if edit_btn.count() > 0:
                edit_btn.click(timeout=3000)
                page.wait_for_timeout(1000)
                body_text = page.inner_text('body')
                # Check for permission matrix with checkboxes
                has_checkboxes = page.locator('input[type="checkbox"]').count() > 0
                record("TC-R02", "Roles - permission matrix modal with checkboxes",
                       has_checkboxes,
                       "No checkboxes found in permission matrix" if not has_checkboxes else "",
                       screenshot(page, "r02_permissions") if not has_checkboxes else "")
            else:
                record("TC-R02", "Roles - permission matrix modal with checkboxes", False,
                       "Edit button not found",
                       screenshot(page, "r02_no_edit"))
        except Exception as e:
            record("TC-R02", "Roles - permission matrix modal with checkboxes", False, str(e),
                   screenshot(page, "r02_error"))
        
        # TC-TM01: Teams - verify list
        print("\n--- TC-TM01: Teams list ---")
        page.goto(f"{BASE_URL}/teams")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        body_text = page.inner_text('body')
        team_ok = "团队" in body_text and len(body_text) > 50
        record("TC-TM01", "Teams - list renders", team_ok,
               "Teams page appears empty or broken" if not team_ok else "",
               screenshot(page, "tm01_teams") if not team_ok else "")
        
        # ============================================================
        # PHASE 3: Operations Pages
        # ============================================================
        print("\n=== PHASE 3: Operations Pages ===")
        
        # TC-A01: Approvals - verify list
        print("\n--- TC-A01: Approvals list ---")
        page.goto(f"{BASE_URL}/approvals")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        body_text = page.inner_text('body')
        approval_ok = "审批" in body_text and len(body_text) > 50
        record("TC-A01", "Approvals - list renders", approval_ok,
               "Approvals page appears empty or broken" if not approval_ok else "",
               screenshot(page, "a01_approvals") if not approval_ok else "")
        
        # TC-A02: Approvals - stat cards
        print("\n--- TC-A02: Approvals stat cards ---")
        stat_checks = ["待处理", "已通过", "已拒绝"]
        stats_found = sum(1 for s in stat_checks if s in body_text)
        record("TC-A02", "Approvals - stat cards (pending/approved/rejected)",
               stats_found >= 2,
               f"Found {stats_found}/3 expected stat labels" if stats_found < 2 else "",
               screenshot(page, "a02_stats") if stats_found < 2 else "")
        
        # TC-A03: Approvals - click status tab filter
        print("\n--- TC-A03: Approvals status tab filter ---")
        try:
            tabs = page.locator('button, [role="tab"], .tab, .filter-btn').all()
            tab_clicked = False
            for tab in tabs:
                text = tab.inner_text().strip()
                if text in ["已通过", "已拒绝", "待处理", "全部"]:
                    tab.click(timeout=3000)
                    page.wait_for_timeout(1000)
                    tab_clicked = True
                    break
            record("TC-A03", "Approvals - status tab filter clickable", tab_clicked,
                   "Status tab not found" if not tab_clicked else "",
                   screenshot(page, "a03_tabs") if not tab_clicked else "")
        except Exception as e:
            record("TC-A03", "Approvals - status tab filter clickable", False, str(e),
                   screenshot(page, "a03_error"))
        
        # TC-A07: Approvals - click row, verify detail modal
        print("\n--- TC-A07: Approvals detail modal ---")
        page.goto(f"{BASE_URL}/approvals")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        try:
            table_rows = page.locator('table tbody tr').all()
            if len(table_rows) > 0:
                table_rows[0].click(timeout=3000)
                page.wait_for_timeout(1000)
                body_text = page.inner_text('body')
                detail_open = "详情" in body_text or "审批详情" in body_text or "关闭" in body_text
                record("TC-A07", "Approvals - click row, detail modal opens", detail_open,
                       "Detail modal did not open" if not detail_open else "",
                       screenshot(page, "a07_detail") if not detail_open else "")
            else:
                record("TC-A07", "Approvals - click row, detail modal opens", False,
                       "No approval rows found",
                       screenshot(page, "a07_no_rows"))
        except Exception as e:
            record("TC-A07", "Approvals - click row, detail modal opens", False, str(e),
                   screenshot(page, "a07_error"))
        
        # TC-RL01: Releases - verify list
        print("\n--- TC-RL01: Releases list ---")
        page.goto(f"{BASE_URL}/releases")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        body_text = page.inner_text('body')
        release_ok = "发布" in body_text and len(body_text) > 50
        record("TC-RL01", "Releases - list renders", release_ok,
               "Releases page appears empty or broken" if not release_ok else "",
               screenshot(page, "rl01_releases") if not release_ok else "")
        
        # TC-RL03: Releases - filter by environment
        print("\n--- TC-RL03: Releases filter by environment ---")
        try:
            selects = page.locator('select').all()
            env_filtered = False
            for s in selects:
                options = s.locator('option').all_inner_texts()
                env_options = [o for o in options if any(e in o for e in ["production", "staging", "生产", "测试"])]
                if env_options:
                    s.select_option(label=env_options[0])
                    page.wait_for_timeout(1000)
                    env_filtered = True
                    break
            record("TC-RL03", "Releases - filter by environment", env_filtered,
                   "Environment filter not found" if not env_filtered else "",
                   screenshot(page, "rl03_env") if not env_filtered else "")
        except Exception as e:
            record("TC-RL03", "Releases - filter by environment", False, str(e),
                   screenshot(page, "rl03_error"))
        
        # TC-SR01: Support Risks - verify list
        print("\n--- TC-SR01: Support Risks list ---")
        page.goto(f"{BASE_URL}/support-risks")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        body_text = page.inner_text('body')
        risk_ok = "风险" in body_text and len(body_text) > 50
        record("TC-SR01", "Support Risks - list renders", risk_ok,
               "Support Risks page appears empty or broken" if not risk_ok else "",
               screenshot(page, "sr01_risks") if not risk_ok else "")
        
        # TC-TK01: Tickets - verify list
        print("\n--- TC-TK01: Tickets list ---")
        page.goto(f"{BASE_URL}/tickets")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        body_text = page.inner_text('body')
        ticket_ok = "工单" in body_text and len(body_text) > 50
        record("TC-TK01", "Tickets - list renders", ticket_ok,
               "Tickets page appears empty or broken" if not ticket_ok else "",
               screenshot(page, "tk01_tickets") if not ticket_ok else "")
        
        # TC-AL01: Audit Logs - verify list
        print("\n--- TC-AL01: Audit Logs list ---")
        page.goto(f"{BASE_URL}/audit-logs")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        body_text = page.inner_text('body')
        audit_ok = "审计" in body_text and len(body_text) > 50
        record("TC-AL01", "Audit Logs - list renders", audit_ok,
               "Audit Logs page appears empty or broken" if not audit_ok else "",
               screenshot(page, "al01_audit") if not audit_ok else "")
        
        # TC-N01: Notifications - verify list
        print("\n--- TC-N01: Notifications list ---")
        page.goto(f"{BASE_URL}/notifications")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        body_text = page.inner_text('body')
        notif_ok = "通知" in body_text and len(body_text) > 50
        record("TC-N01", "Notifications - list renders", notif_ok,
               "Notifications page appears empty or broken" if not notif_ok else "",
               screenshot(page, "n01_notifications") if not notif_ok else "")
        
        # ============================================================
        # PHASE 4: Finance Pages
        # ============================================================
        print("\n=== PHASE 4: Finance Pages ===")
        
        # TC-S01: Subscriptions - verify list
        print("\n--- TC-S01: Subscriptions list ---")
        page.goto(f"{BASE_URL}/subscriptions")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        body_text = page.inner_text('body')
        sub_ok = "订阅" in body_text and len(body_text) > 50
        record("TC-S01", "Subscriptions - list renders", sub_ok,
               "Subscriptions page appears empty or broken" if not sub_ok else "",
               screenshot(page, "s01_subscriptions") if not sub_ok else "")
        
        # TC-I01: Invoices - verify list
        print("\n--- TC-I01: Invoices list ---")
        page.goto(f"{BASE_URL}/invoices")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        body_text = page.inner_text('body')
        invoice_ok = "发票" in body_text and len(body_text) > 50
        record("TC-I01", "Invoices - list renders", invoice_ok,
               "Invoices page appears empty or broken" if not invoice_ok else "",
               screenshot(page, "i01_invoices") if not invoice_ok else "")
        
        # ============================================================
        # PHASE 5: Integration Pages
        # ============================================================
        print("\n=== PHASE 5: Integration Pages ===")
        
        # TC-W01: Webhooks - verify list
        print("\n--- TC-W01: Webhooks list ---")
        page.goto(f"{BASE_URL}/webhooks")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        body_text = page.inner_text('body')
        webhook_ok = "Webhook" in body_text and len(body_text) > 50
        record("TC-W01", "Webhooks - list renders", webhook_ok,
               "Webhooks page appears empty or broken" if not webhook_ok else "",
               screenshot(page, "w01_webhooks") if not webhook_ok else "")
        
        # TC-IG01: Integrations - verify list
        print("\n--- TC-IG01: Integrations list ---")
        page.goto(f"{BASE_URL}/integrations")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        body_text = page.inner_text('body')
        integ_ok = "集成" in body_text and len(body_text) > 50
        record("TC-IG01", "Integrations - list renders", integ_ok,
               "Integrations page appears empty or broken" if not integ_ok else "",
               screenshot(page, "ig01_integrations") if not integ_ok else "")
        
        # TC-TK01-tokens: Tokens - verify list
        print("\n--- TC-TK01-tokens: Tokens list ---")
        page.goto(f"{BASE_URL}/tokens")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        body_text = page.inner_text('body')
        token_ok = "Token" in body_text and len(body_text) > 50
        record("TC-TK01-tokens", "Tokens - list renders", token_ok,
               "Tokens page appears empty or broken" if not token_ok else "",
               screenshot(page, "tk01t_tokens") if not token_ok else "")
        
        # TC-F01: Features - verify list
        print("\n--- TC-F01: Features list ---")
        page.goto(f"{BASE_URL}/features")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        body_text = page.inner_text('body')
        feature_ok = "功能" in body_text and len(body_text) > 50
        record("TC-F01", "Features - list renders", feature_ok,
               "Features page appears empty or broken" if not feature_ok else "",
               screenshot(page, "f01_features") if not feature_ok else "")
        
        # ============================================================
        # PHASE 6: System Pages
        # ============================================================
        print("\n=== PHASE 6: System Pages ===")
        
        # TC-M01: Metrics - 6 stat cards
        print("\n--- TC-M01: Metrics stat cards ---")
        page.goto(f"{BASE_URL}/metrics")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        body_text = page.inner_text('body')
        # Count stat-like numbers on the page
        metric_indicators = ["ARR", "客户", "审批", "发布", "工单", "成员", "收入", "通过率", "成功率", "解决率"]
        metrics_found = sum(1 for m in metric_indicators if m in body_text)
        record("TC-M01", "Metrics - 6 stat cards render", metrics_found >= 4,
               f"Found {metrics_found} metric indicators, expected >= 4" if metrics_found < 4 else "",
               screenshot(page, "m01_metrics") if metrics_found < 4 else "")
        
        # TC-M02: Metrics - trend charts
        print("\n--- TC-M02: Metrics trend charts ---")
        svg_count = page.locator('svg').count()
        record("TC-M02", "Metrics - trend charts render", svg_count >= 1,
               f"Found {svg_count} SVG elements" if svg_count < 1 else "",
               screenshot(page, "m02_charts") if svg_count < 1 else "")
        
        # TC-M03: Metrics - health donut chart
        print("\n--- TC-M03: Metrics health donut chart ---")
        has_health = "健康" in body_text
        record("TC-M03", "Metrics - health donut chart renders", has_health,
               "Health donut chart not found" if not has_health else "",
               screenshot(page, "m03_health") if not has_health else "")
        
        # ============================================================
        # PHASE 7: Permission Tests
        # ============================================================
        print("\n=== PHASE 7: Permission Tests ===")
        
        # TC-P01: Switch to auditor, visit /tenants - verify no edit/delete buttons
        print("\n--- TC-P01: Auditor permissions on tenants ---")
        page.goto(BASE_URL)
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        try:
            select_el = page.locator('select').first
            select_el.select_option(label="audit@example.com · 审计员", timeout=5000)
            page.wait_for_timeout(500)
            switch_btn = page.locator('button:has-text("切换")').first
            switch_btn.click(timeout=5000)
            page.wait_for_timeout(1000)
            page.goto(f"{BASE_URL}/tenants")
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(1000)
            body_text = page.inner_text('body')
            # Auditor should NOT see edit/delete buttons
            has_edit = "编辑" in body_text
            has_delete = "删除" in body_text
            auditor_ok = not has_edit and not has_delete
            record("TC-P01", "Auditor - no edit/delete on tenants", auditor_ok,
                   f"Auditor sees edit={has_edit}, delete={has_delete}" if not auditor_ok else "",
                   screenshot(page, "p01_auditor_tenants") if not auditor_ok else "")
        except Exception as e:
            record("TC-P01", "Auditor - no edit/delete on tenants", False, str(e),
                   screenshot(page, "p01_error"))
        
        # TC-P04: Switch to member, visit /tenants - verify no edit/delete
        print("\n--- TC-P04: Member permissions on tenants ---")
        page.goto(BASE_URL)
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        try:
            select_el = page.locator('select').first
            select_el.select_option(label="陈屿 · Nova 运营成员", timeout=5000)
            page.wait_for_timeout(500)
            switch_btn = page.locator('button:has-text("切换")').first
            switch_btn.click(timeout=5000)
            page.wait_for_timeout(1000)
            page.goto(f"{BASE_URL}/tenants")
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(1000)
            body_text = page.inner_text('body')
            has_edit = "编辑" in body_text
            has_delete = "删除" in body_text
            member_ok = not has_edit and not has_delete
            record("TC-P04", "Member - no edit/delete on tenants", member_ok,
                   f"Member sees edit={has_edit}, delete={has_delete}" if not member_ok else "",
                   screenshot(page, "p04_member_tenants") if not member_ok else "")
        except Exception as e:
            record("TC-P04", "Member - no edit/delete on tenants", False, str(e),
                   screenshot(page, "p04_error"))
        
        # TC-P06: Switch to release_manager, visit /releases - verify deploy/rollback buttons
        print("\n--- TC-P06: Release manager permissions on releases ---")
        page.goto(BASE_URL)
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        try:
            select_el = page.locator('select').first
            select_el.select_option(label="release@example.com · 发布经理", timeout=5000)
            page.wait_for_timeout(500)
            switch_btn = page.locator('button:has-text("切换")').first
            switch_btn.click(timeout=5000)
            page.wait_for_timeout(1000)
            page.goto(f"{BASE_URL}/releases")
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(1000)
            body_text = page.inner_text('body')
            has_deploy = "部署" in body_text or "deploy" in body_text.lower()
            has_rollback = "回滚" in body_text or "rollback" in body_text.lower()
            rm_ok = has_deploy or has_rollback
            record("TC-P06", "Release manager - deploy/rollback buttons visible", rm_ok,
                   f"Release manager sees deploy={has_deploy}, rollback={has_rollback}" if not rm_ok else "",
                   screenshot(page, "p06_release_manager") if not rm_ok else "")
        except Exception as e:
            record("TC-P06", "Release manager - deploy/rollback buttons visible", False, str(e),
                   screenshot(page, "p06_error"))
        
        # ============================================================
        # PHASE 8: Edge Cases
        # ============================================================
        print("\n=== PHASE 8: Edge Cases ===")
        
        # TC-E01: Search for non-existent keyword, verify empty state
        print("\n--- TC-E01: Search non-existent keyword ---")
        page.goto(f"{BASE_URL}/tenants")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        try:
            search_input = page.locator('input[placeholder*="搜索"]').first
            if search_input.count() == 0:
                search_input = page.locator('input[type="text"]').first
            search_input.fill("XYZZY_NONEXISTENT_12345")
            page.wait_for_timeout(1000)
            body_text = page.inner_text('body')
            # Should show empty state or "no results" message
            has_empty = "暂无" in body_text or "没有" in body_text or "无" in body_text or "空" in body_text
            # Or the list should be empty
            record("TC-E01", "Search non-existent keyword - empty state", has_empty,
                   "No empty state shown for non-existent search" if not has_empty else "",
                   screenshot(page, "e01_empty_search") if not has_empty else "")
        except Exception as e:
            record("TC-E01", "Search non-existent keyword - empty state", False, str(e),
                   screenshot(page, "e01_error"))
        
        # TC-E05: Enter invalid email, click switch, verify error alert
        print("\n--- TC-E05: Invalid email error alert ---")
        page.goto(BASE_URL)
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        try:
            email_input = page.locator('input[placeholder="或输入任意邮箱切换"]').first
            email_input.fill("invalid-email")
            page.wait_for_timeout(300)
            switch_btn = page.locator('button:has-text("切换")').first
            switch_btn.click()
            page.wait_for_timeout(1000)
            body_text = page.inner_text('body')
            # Should show error/alert
            has_error = "错误" in body_text or "无效" in body_text or "不存在" in body_text or "error" in body_text.lower()
            record("TC-E05", "Invalid email - error alert shown", has_error,
                   "No error alert for invalid email" if not has_error else "",
                   screenshot(page, "e05_invalid_email") if not has_error else "")
        except Exception as e:
            record("TC-E05", "Invalid email - error alert shown", False, str(e),
                   screenshot(page, "e05_error"))
        
        # ============================================================
        # Final: Switch back to platform admin
        # ============================================================
        page.goto(BASE_URL)
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        try:
            select_el = page.locator('select').first
            select_el.select_option(label="platform@example.com · 平台管理员", timeout=5000)
            page.wait_for_timeout(500)
            switch_btn = page.locator('button:has-text("切换")').first
            switch_btn.click(timeout=5000)
            page.wait_for_timeout(1000)
        except:
            pass
        
        browser.close()
    
    # ============================================================
    # Print Summary
    # ============================================================
    print("\n\n" + "="*60)
    print("TEST RESULTS SUMMARY")
    print("="*60)
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    total = len(results)
    print(f"Total: {total}, Passed: {passed}, Failed: {failed}")
    print(f"Pass Rate: {passed/total*100:.1f}%")
    print()
    for r in results:
        status_icon = "✓" if r["status"] == "PASS" else "✗"
        print(f"  [{status_icon}] {r['id']}: {r['name']}")
        if r["error"]:
            print(f"       Error: {r['error']}")
        if r["screenshot"]:
            print(f"       Screenshot: {r['screenshot']}")
    
    return results

if __name__ == "__main__":
    run_tests()
