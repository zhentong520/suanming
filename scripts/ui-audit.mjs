import { chromium } from "playwright";

const BASE = "http://127.0.0.1:9111";
// 1) 注册/登录拿 token
const email = `audit${Date.now() % 100000}@test.local`;
const reg = await fetch(`${BASE}/api/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password: "audit123" }),
}).then((r) => r.json());
const token = reg.token;
if (!token) { console.error("no token", reg); process.exit(1); }
// 建档案
await fetch(`${BASE}/api/profiles`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({ name: "审计档案", gender: "女", calendarType: "solar", birthYear: 1990, birthMonth: 5, birthDay: 15, birthHour: 15 }),
});
// 算一卦拿 reportId
const rep = await fetch(`${BASE}/api/v1/bazi`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({ params: {} }),
}).then((r) => r.json());
const reportId = rep.reportId ?? rep.id;
console.log("reportId:", reportId);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); // 手机视口（主流量场景）
const page = await ctx.newPage();
await ctx.addCookies([{ name: "user_token", value: token, domain: "127.0.0.1", path: "/" }]);

const shots = [
  ["/", "home"],
  ["/bazi", "bazi"],
  [reportId ? `/reports/${reportId}` : "/", "report"],
  ["/knowledge", "knowledge"],
];
for (const [path, name] of shots) {
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1800); // 等入场动效/星空
    await page.screenshot({ path: `E:/suanming/.workbuddy/tmp-audit-${name}.png`, fullPage: name === "report" });
    console.log("shot ok:", name);
  } catch (e) {
    console.error("shot fail:", name, e.message);
  }
}
await browser.close();
