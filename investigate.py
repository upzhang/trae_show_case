#!/usr/bin/env python3
"""Investigate Phase 2 failures - check actual page structure"""
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})
        page.set_default_timeout(10000)

        # Check tenants page structure
        print("=== TENANTS PAGE ===")
        page.goto("http://localhost:5173/tenants", timeout=10000)
        page.wait_for_load_state('networkidle', timeout=10000)
        page.wait_for_timeout(1000)
        text = page.inner_text('body')
        print(text[:1500])
        print("\n--- Tables found:", page.locator('table').count())
        print("--- Table rows:", page.locator('tr').count())
        print("--- All buttons:", page.locator('button').all_inner_texts())
        print("--- All inputs:", page.locator('input').all())
        for inp in page.locator('input').all():
            print(f"    placeholder={inp.get_attribute('placeholder')}, type={inp.get_attribute('type')}")

        # Check users page structure
        print("\n=== USERS PAGE ===")
        page.goto("http://localhost:5173/users", timeout=10000)
        page.wait_for_load_state('networkidle', timeout=10000)
        page.wait_for_timeout(1000)
        text = page.inner_text('body')
        print(text[:1500])
        print("\n--- Tables found:", page.locator('table').count())
        print("--- All buttons:", page.locator('button').all_inner_texts())
        print("--- All links:", page.locator('a').all_inner_texts()[:20])

        browser.close()

if __name__ == "__main__":
    run()
