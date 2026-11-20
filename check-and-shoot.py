"""Dev check + screenshots for the Leonida Trophy Guide.
Serves app/ with serve.ts, drives it in headless Chromium (Playwright),
asserts the tracker works (55 rows, toggle persists, filters, spoiler,
export/import, no off-origin requests), then takes 4 JPEG screenshots.
Run: python3 check-and-shoot.py  (from the repo root)
"""
import json
import os
import subprocess
import sys
import time
import urllib.request

from playwright.sync_api import sync_playwright

REPO = os.path.dirname(os.path.abspath(__file__))
PORT = 8080
BASE = f"http://localhost:{PORT}"
SEED_EARNED = [
    "Just Like Paradise", "Paradise Lost", "T**s Ass Drug Money",
    "Vice City, Baby!", "Top Of The World, Ma", "Baited My Tackle",
    "Stick Fiddler", "Hot Together", "Retail Therapy", "Whip It Good",
    "In The Beginning…", "Ten Pin", "Treat Yo Self",
]

failures = []


def check(name, ok, detail=""):
    print(("PASS " if ok else "FAIL ") + name + (f" — {detail}" if detail else ""))
    if not ok:
        failures.append(name)


def wait_server():
    for _ in range(50):
        try:
            urllib.request.urlopen(BASE, timeout=2)
            return True
        except Exception:
            time.sleep(0.2)
    return False


def main():
    server = subprocess.Popen(
        ["node", "serve.ts", "--port", str(PORT)], cwd=REPO,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        if not wait_server():
            print("FAIL server did not start")
            return 1
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            page = browser.new_page(viewport={"width": 1280, "height": 800})
            errors, requests = [], []
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on("request", lambda r: requests.append(r.url))
            page.on("requestfailed", lambda r: errors.append("request failed: " + r.url))

            page.goto(BASE, wait_until="networkidle")
            page.wait_for_selector("#list .row", timeout=10000)
            rows = page.query_selector_all("#list .row")
            check("55 trophy rows render", len(rows) == 55, f"got {len(rows)}")
            check("no console/page errors on load", not errors, "; ".join(errors[:3]))
            off_origin = [u for u in requests if not u.startswith(BASE) and not u.startswith("data:")]
            check("no off-origin requests", not off_origin, "; ".join(off_origin[:3]))
            check("progress starts 0/55", "0 of 55 earned" in page.inner_text("#progressLine"))

            # Toggle persists across reload.
            page.query_selector_all("#list .row input[type=checkbox]")[1].click()
            page.wait_for_timeout(200)
            page.reload(wait_until="networkidle")
            page.wait_for_selector("#list .row")
            check("checkbox toggle persists after reload",
                  "1 of 55 earned" in page.inner_text("#progressLine"))
            # Clear it again for a clean slate.
            page.query_selector_all("#list .row input[type=checkbox]")[1].click()
            page.wait_for_timeout(200)

            # Kind filter: missable watch-list has 11.
            page.select_option("#kind", "missable")
            page.wait_for_timeout(200)
            check("missable filter shows 11", len(page.query_selector_all("#list .row")) == 11,
                  f"got {len(page.query_selector_all('#list .row'))}")
            page.select_option("#kind", "all")

            # Grade filter: silver has 6.
            page.select_option("#grade", "silver")
            page.wait_for_timeout(200)
            check("silver filter shows 6", len(page.query_selector_all("#list .row")) == 6)
            page.select_option("#grade", "all")

            # Search.
            page.fill("#search", "shooting range")
            page.wait_for_timeout(200)
            names = page.eval_on_selector_all("#list .row .name", "els => els.map(e => e.textContent)")
            check("search finds shooting-range trophies", names == ["Master of None", "The Shootist"], str(names))
            page.fill("#search", "")

            # Spoiler setting hides un-earned story trophies.
            page.check("#spoiler")
            page.wait_for_timeout(200)
            hidden = page.eval_on_selector_all(
                "#list .row .hidden-name", "els => els.map(e => e.textContent)")
            check("spoiler hides story names", len(hidden) > 0 and all("Hidden story trophy" in h for h in hidden),
                  f"{len(hidden)} hidden")
            page.uncheck("#spoiler")

            # Export / import round-trip.
            page.query_selector_all("#list .row input[type=checkbox]")[0].click()
            page.query_selector_all("#list .row input[type=checkbox]")[2].click()
            page.wait_for_timeout(200)
            with page.expect_download() as dl:
                page.click("#export")
            download = dl.value
            path = "/tmp/gta6-export-check.json"
            download.save_as(path)
            exported = json.load(open(path))
            check("export contains earned names",
                  exported.get("earned") == ["Vice Got a Price!", "Paradise Lost"], str(exported.get("earned")))
            page.set_input_files("#import", path)
            page.wait_for_timeout(300)
            check("import restores progress",
                  "2 of 55 earned" in page.inner_text("#progressLine"))

            # Roadmap + missables views render.
            page.goto(BASE + "/#/roadmap", wait_until="networkidle")
            check("roadmap shows 4 stages", len(page.query_selector_all(".stage")) == 4)
            page.goto(BASE + "/#/missables", wait_until="networkidle")
            check("missables view shows 11", len(page.query_selector_all("#missableList .row")) == 11)

            # ---- Screenshots with seeded progress (13 of 55 earned) ----
            for f in ["1-checklist.jpg", "2-silver.jpg", "3-bronze.jpg"]:
                p = os.path.join(REPO, "screenshots", f)
                if os.path.exists(p):
                    os.remove(p)
            page.evaluate(
                "(names) => { localStorage.setItem('gta6-trophy-progress-v1', JSON.stringify(names));"
                " localStorage.setItem('gta6-trophy-settings-v1', JSON.stringify({spoiler:false})); }",
                SEED_EARNED)
            page.reload(wait_until="networkidle")
            page.goto(BASE + "/#/tracker", wait_until="networkidle")
            page.wait_for_selector("#list .row")
            check("seeded progress shows 13/55",
                  "13 of 55 earned" in page.inner_text("#progressLine"))
            # Cover: checklist + guide pane open on a missable story trophy.
            page.eval_on_selector_all(
                "#list .row", "els => { const el = els.find(e => e.textContent.includes('Trust')); el.click(); }")
            page.wait_for_timeout(300)
            page.evaluate("window.scrollTo(0, 0)")
            page.wait_for_timeout(200)
            page.screenshot(path="screenshots/1-cover.jpg", type="jpeg", quality=82)
            page.goto(BASE + "/#/roadmap", wait_until="networkidle")
            page.evaluate("window.scrollTo(0, 0)")
            page.wait_for_timeout(200)
            page.screenshot(path="screenshots/2-roadmap.jpg", type="jpeg", quality=82)
            page.goto(BASE + "/#/missables", wait_until="networkidle")
            page.evaluate("window.scrollTo(0, 0)")
            page.wait_for_timeout(200)
            page.screenshot(path="screenshots/3-missables.jpg", type="jpeg", quality=82)
            page.goto(BASE + "/#/tracker", wait_until="networkidle")
            page.select_option("#kind", "story")
            page.check("#spoiler")
            page.wait_for_timeout(300)
            page.evaluate("window.scrollTo(0, 0)")
            page.wait_for_timeout(200)
            page.screenshot(path="screenshots/4-spoiler.jpg", type="jpeg", quality=82)
            browser.close()

        # Screenshot gate limits: <=256 KiB, long side <=1280, short side >=480.
        from PIL import Image
        for f in sorted(os.listdir(os.path.join(REPO, "screenshots"))):
            p = os.path.join(REPO, "screenshots", f)
            size = os.path.getsize(p)
            with Image.open(p) as im:
                w, h = im.size
            check(f"screenshot {f} within limits",
                  size <= 262144 and max(w, h) <= 1280 and min(w, h) >= 480,
                  f"{size} bytes, {w}x{h}")
    finally:
        server.terminate()
        server.wait(timeout=5)
    print("FAILURES: " + ", ".join(failures) if failures else "ALL CHECKS PASSED")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
