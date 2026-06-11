#!/usr/bin/env python3
"""Check API responses via Playwright"""
from playwright.sync_api import sync_playwright
import json

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})
        page.set_default_timeout(10000)

        # Collect network responses
        responses = []
        def on_response(response):
            if '/api/' in response.url:
                try:
                    body = response.text()
                    responses.append({"url": response.url, "status": response.status, "body": body[:500]})
                except:
                    responses.append({"url": response.url, "status": response.status, "body": "N/A"})

        page.on('response', on_response)

        # Navigate to tenants
        print("=== Tenants API ===")
        page.goto("http://localhost:5173/tenants", timeout=10000)
        page.wait_for_load_state('networkidle', timeout=10000)
        page.wait_for_timeout(2000)

        for r in responses:
            print(f"  {r['url']} -> {r['status']}: {r['body'][:300]}")

        # Clear and try users
        responses.clear()
        print("\n=== Users API ===")
        page.goto("http://localhost:5173/users", timeout=10000)
        page.wait_for_load_state('networkidle', timeout=10000)
        page.wait_for_timeout(2000)

        for r in responses:
            print(f"  {r['url']} -> {r['status']}: {r['body'][:300]}")

        browser.close()

if __name__ == "__main__":
    run()
