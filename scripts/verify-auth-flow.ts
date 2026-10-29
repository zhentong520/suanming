/**
 * 完整认证与档案链路验证（需 dev server 运行在 9111）
 * 运行: npx tsx scripts/verify-auth-flow.ts
 */
const base = "http://localhost:9111";

function parseCookie(setCookie: string | null): string {
  if (!setCookie) throw new Error("missing Set-Cookie");
  return setCookie.split(";")[0];
}

function cookieHeader(cookie: string) {
  return { Cookie: cookie, "Content-Type": "application/json" };
}

async function assertStatus(res: Response, expected: number, label: string) {
  if (res.status !== expected) {
    const body = await res.text();
    throw new Error(`${label}: expected ${expected}, got ${res.status} — ${body}`);
  }
}

async function main() {
  const suffix = Date.now();
  const email = `verify${suffix}@test.com`;
  const password = "verify123456";
  let passed = 0;

  // 1. 未登录访问 API 应 401
  const unauth = await fetch(`${base}/api/profiles`);
  await assertStatus(unauth, 401, "未登录 profiles");
  console.log("✓ 未登录 API 返回 401");
  passed++;

  // 2. 注册
  const reg = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, displayName: "验证用户" }),
  });
  await assertStatus(reg, 200, "注册");
  const cookie = parseCookie(reg.headers.get("set-cookie"));
  const regData = await reg.json();
  if (!regData.user?.id) throw new Error("注册响应缺少 user.id");
  console.log("✓ 邮箱注册成功");
  passed++;

  // 3. 获取会话
  const me1 = await fetch(`${base}/api/auth/me`, { headers: { Cookie: cookie } });
  await assertStatus(me1, 200, "me");
  const meData1 = await me1.json();
  if (meData1.profiles?.length !== 0) throw new Error("新用户不应有档案");
  console.log("✓ /api/auth/me 返回用户信息");
  passed++;

  // 4. 创建第一个档案（自动设为当前）
  const p1Res = await fetch(`${base}/api/profiles`, {
    method: "POST",
    headers: cookieHeader(cookie),
    body: JSON.stringify({
      name: "档案一",
      gender: "男",
      calendarType: "solar",
      birthYear: 1990,
      birthMonth: 5,
      birthDay: 15,
      birthHour: 15,
      setAsActive: true,
    }),
  });
  await assertStatus(p1Res, 200, "create profile 1");
  const p1 = await p1Res.json();
  console.log("✓ 创建档案一:", p1.id);
  passed++;

  // 5. 创建第二个档案
  const p2Res = await fetch(`${base}/api/profiles`, {
    method: "POST",
    headers: cookieHeader(cookie),
    body: JSON.stringify({
      name: "档案二",
      gender: "女",
      calendarType: "solar",
      birthYear: 1995,
      birthMonth: 8,
      birthDay: 20,
      birthHour: 10,
      setAsActive: false,
    }),
  });
  await assertStatus(p2Res, 200, "create profile 2");
  const p2 = await p2Res.json();
  console.log("✓ 创建档案二:", p2.id);
  passed++;

  // 6. 列表应有 2 个档案
  const listRes = await fetch(`${base}/api/profiles`, { headers: { Cookie: cookie } });
  const list = await listRes.json();
  if (!Array.isArray(list) || list.length !== 2) throw new Error(`档案数应为 2，实际 ${list.length}`);
  console.log("✓ 用户拥有 2 个档案");
  passed++;

  // 7. 切换当前档案
  const switchRes = await fetch(`${base}/api/auth/active-profile`, {
    method: "POST",
    headers: cookieHeader(cookie),
    body: JSON.stringify({ profileId: p2.id }),
  });
  await assertStatus(switchRes, 200, "switch active");
  const me2 = await fetch(`${base}/api/auth/me`, { headers: { Cookie: cookie } });
  const meData2 = await me2.json();
  if (meData2.user.activeProfileId !== p2.id) {
    throw new Error(`当前档案应为 ${p2.id}，实际 ${meData2.user.activeProfileId}`);
  }
  console.log("✓ 切换当前档案为档案二");
  passed++;

  // 8. 八字测算（不传 profileId，用当前档案）
  const baziRes = await fetch(`${base}/api/v1/bazi`, {
    method: "POST",
    headers: cookieHeader(cookie),
    body: JSON.stringify({ params: {} }),
  });
  await assertStatus(baziRes, 200, "bazi calc");
  const bazi = await baziRes.json();
  if (!bazi.templateReport?.includes("八字")) throw new Error("八字报告异常");
  console.log("✓ 八字测算成功（自动使用当前档案）");
  passed++;

  // 9. 操作记录
  const me3 = await fetch(`${base}/api/auth/me`, { headers: { Cookie: cookie } });
  const meData3 = await me3.json();
  const ops = meData3.recentOperations ?? [];
  const hasRegister = ops.some((o: { action: string }) => o.action === "register");
  const hasCalc = ops.some((o: { action: string }) => o.action === "module_calc");
  if (!hasRegister || !hasCalc) throw new Error("操作记录不完整");
  console.log("✓ 操作记录含 register 与 module_calc");
  passed++;

  // 10. 手机号注册 + 登录
  const phone = `139${String(suffix).slice(-8)}`;
  const phoneReg = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, password: "phone123456" }),
  });
  await assertStatus(phoneReg, 200, "phone register");
  const phoneCookie = parseCookie(phoneReg.headers.get("set-cookie"));

  // 登出
  await fetch(`${base}/api/auth/logout`, { method: "POST", headers: { Cookie: phoneCookie } });

  const phoneLogin = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account: phone, password: "phone123456" }),
  });
  await assertStatus(phoneLogin, 200, "phone login");
  console.log("✓ 手机号注册与登录成功");
  passed++;

  // 11. 邮箱用户重新登录（验证持久化）
  await fetch(`${base}/api/auth/logout`, { method: "POST", headers: { Cookie: cookie } });
  const relogin = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account: email, password }),
  });
  await assertStatus(relogin, 200, "relogin");
  const reloginCookie = parseCookie(relogin.headers.get("set-cookie"));
  const me4 = await fetch(`${base}/api/auth/me`, { headers: { Cookie: reloginCookie } });
  const meData4 = await me4.json();
  if (meData4.profiles.length !== 2) throw new Error("重新登录后档案丢失");
  if (meData4.user.activeProfileId !== p2.id) throw new Error("重新登录后当前档案丢失");
  console.log("✓ 重新登录后档案与当前档持久化正常");
  passed++;

  console.log(`\n全部通过 ${passed}/11`);
}

main().catch((e) => {
  console.error("\n验证失败:", e.message);
  process.exit(1);
});

export {};
