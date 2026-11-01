import { chromium } from "playwright";
const BASE = "http://127.0.0.1:9111";
const email = `p2${Date.now() % 100000}@test.local`;
const reg = await fetch(`${BASE}/api/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "audit123" }) }).then((r) => r.json());
const token = reg.token;
await fetch(`${BASE}/api/profiles`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: "审计档案", gender: "女", calendarType: "solar", birthYear: 1990, birthMonth: 5, birthDay: 15, birthHour: 15 }) });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await ctx.addCookies([{ name: "user_token", value: token, domain: "127.0.0.1", path: "/" }]);
await page.goto(`${BASE}/bazi`, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(3000);
const info = await page.evaluate(() => {
  const pc = document.querySelector(".page-container");
  const footer = document.querySelector(".site-footer");
  const btn = document.querySelector(".form-sticky-actions .btn-primary");
  const r = (el) => el ? { top: Math.round(el.getBoundingClientRect().top), bottom: Math.round(el.getBoundingClientRect().bottom) } : null;
  return {
    pcClass: pc?.className,
    pcPaddingBottom: pc ? getComputedStyle(pc).paddingBottom : null,
    rects: { container: r(pc), footer: r(footer), btn: r(btn), hint: r(document.querySelector(".active-profile-hint")) },
    cssLoaded: [...document.styleSheets].length,
  };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
