import { chromium } from "playwright";
const BASE = "http://127.0.0.1:9111";
const email = `probe${Date.now() % 100000}@test.local`;
const reg = await fetch(`${BASE}/api/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "audit123" }) }).then((r) => r.json());
const token = reg.token;
await fetch(`${BASE}/api/profiles`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: "审计档案", gender: "女", calendarType: "solar", birthYear: 1990, birthMonth: 5, birthDay: 15, birthHour: 15 }) });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await ctx.addCookies([{ name: "user_token", value: token, domain: "127.0.0.1", path: "/" }]);
await page.goto(`${BASE}/bazi`, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(4000);
const probe = await page.evaluate(() => {
  const out = [];
  const btn = document.querySelector(".form-sticky-actions .btn-primary");
  const hint = document.querySelector(".active-profile-hint");
  const pick = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { rect: { t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height) }, cls: el.className.slice(0, 60), pos: cs.position, anim: cs.animationName, fill: cs.animationFillMode, op: cs.opacity };
  };
  out.push({ btn: pick(btn), hint: pick(hint) });
  // 按钮的祖先链里有没有带动画/绝对定位的包装
  let el = btn;
  const chain = [];
  while (el && el.tagName !== "BODY") {
    const cs = getComputedStyle(el);
    chain.push({ tag: el.tagName, cls: String(el.className).slice(0, 50), pos: cs.position, anim: cs.animationName, fill: cs.animationFillMode, transform: cs.transform !== "none" ? cs.transform.slice(0, 40) : "" });
    el = el.parentElement;
  }
  out.push(chain);
  // 白色渐变来源：找按钮兄弟/父级里 background 含 white 渐变的
  document.querySelectorAll("*").forEach((e2) => {
    const cs = getComputedStyle(e2);
    if (cs.background.includes("255, 255, 255") && cs.position === "absolute") {
      const r = e2.getBoundingClientRect();
      if (r.height > 30 && r.height < 400 && r.width > 100) {
        out.push({ whiteEl: { cls: String(e2.className).slice(0, 60), rect: { t: Math.round(r.top), h: Math.round(r.height) }, bg: cs.background.slice(0, 80) } });
      }
    }
  });
  return out;
});
console.log(JSON.stringify(probe, null, 1).slice(0, 3000));
await browser.close();
