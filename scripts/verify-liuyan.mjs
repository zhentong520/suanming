// 留言墙端到端验证：API 层（发帖/限频/回复/删除/权限）+ Playwright UI 层（登录发帖/游客视图/导航入口）
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:9112";
const stamp = Date.now().toString().slice(-6);

async function registerAndLogin(n) {
  const email = `liuyan${stamp}${n}@test.com`;
  const password = "secret12";
  const reg = await fetch(BASE + "/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, displayName: `验证员${n}` }),
  });
  if (!reg.ok) throw new Error(`注册失败: ${await reg.text()}`);
  const login = await fetch(BASE + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account: email, password }),
  });
  if (!login.ok) throw new Error(`登录失败`);
  const token = (login.headers.get("set-cookie") ?? "").match(/user_token=([^;]+)/)?.[1];
  if (!token) throw new Error("未拿到 user_token");
  return { email, cookie: `user_token=${token}` };
}

async function api(path, opts = {}, cookie) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}), ...(opts.headers ?? {}) },
  });
  return { res, data: await res.json().catch(() => null) };
}

const assert = (cond, label) => {
  if (!cond) throw new Error(`FAIL: ${label}`);
  console.log(`✓ ${label}`);
};

// --- API 层 ---
const A = await registerAndLogin("a");
const B = await registerAndLogin("b");
const C = await registerAndLogin("c");

const baseline = (await api("/api/comments?limit=1")).data.total;

const post1 = await api("/api/comments", { method: "POST", body: JSON.stringify({ content: `初来乍到，留言墙真不错！${stamp}` }) }, A.cookie);
assert(post1.res.ok, `A 发留言（nickname=${post1.data?.item?.nickname}）`);

const postDup = await api("/api/comments", { method: "POST", body: JSON.stringify({ content: "马上再来一条" }) }, A.cookie);
assert(postDup.res.status === 400 && /频繁/.test(postDup.data?.error ?? ""), "频率限制生效（60 秒一条）");

const reply = await api("/api/comments", { method: "POST", body: JSON.stringify({ content: "欢迎欢迎，楼上帖子精神！", parentId: post1.data.item.id }) }, B.cookie);
assert(reply.res.ok && reply.data.item.parentId === post1.data.item.id && reply.data.item.replyTo === "验证员a", `B 回复成功（replyTo=${reply.data?.item?.replyTo}）`);

const guestList = await api("/api/comments?limit=20");
assert(guestList.res.ok && guestList.data.total === baseline + 2, `游客可见 ${guestList.data.total} 条（基线 ${baseline}+2）`);
assert(guestList.data.items.every((i) => i.canDelete === false), "游客视角无删除按钮标记");

const delForbidden = await api(`/api/comments/${post1.data.item.id}`, { method: "DELETE" }, B.cookie);
assert(delForbidden.res.status === 404, "B 不能删 A 的留言（404）");

const delOwn = await api(`/api/comments/${reply.data.item.id}`, { method: "DELETE" }, B.cookie);
assert(delOwn.res.ok, "B 删除自己的回复成功");
const afterDel = await api("/api/comments?limit=20");
assert(afterDel.data.total === baseline + 1, `删除后剩 ${afterDel.data.total} 条（基线+1）`);

// --- Playwright UI 层（用 C，未发过帖不撞限频） ---
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto(`${BASE}/liuyan`);
await page.evaluate((t) => {
  document.cookie = `user_token=${t}; domain=127.0.0.1; path=/`;
}, C.cookie.replace("user_token=", ""));

await page.goto(`${BASE}/liuyan`);
await page.waitForSelector(".liuyan-form textarea", { timeout: 10000 });
await page.fill(".liuyan-input", "从罗盘页逛过来的，黄历今日宜祈福，来讨个彩头~");
await page.click(".liuyan-form-actions .btn-primary");
await page.waitForTimeout(1500);
const count1 = await page.locator(".liuyan-item").count();
assert(count1 >= 2, `登录态 UI 发留言后墙上有 ${count1} 条`);
await page.screenshot({ path: "screenshots/liuyan-logged-in.png", fullPage: true });

const navLink = await page.locator('nav.site-nav a[href="/liuyan"]').count();
assert(navLink === 1, "顶部导航有「留言墙」入口");

// 游客视图
const page2 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page2.goto(`${BASE}/liuyan`);
await page2.waitForSelector(".liuyan-login-hint", { timeout: 10000 });
const hintText = await page2.locator(".liuyan-login-hint").innerText();
assert(/登录/.test(hintText), "游客看到登录引导");
const items2 = await page2.locator(".liuyan-item").count();
assert(items2 >= 2, `游客能看到 ${items2} 条留言（只读）`);
await page2.screenshot({ path: "screenshots/liuyan-guest.png", fullPage: true });

await browser.close();
console.log("\nALL PASS ✓");
process.exit(0);
