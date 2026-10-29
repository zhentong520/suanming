const base = "http://localhost:9111";

function parseCookie(setCookie: string | null): string {
  if (!setCookie) throw new Error("missing Set-Cookie");
  return setCookie.split(";")[0];
}

async function main() {
  const suffix = Date.now();
  const email = `smoke${suffix}@test.com`;
  const password = "test123456";

  const registerRes = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, displayName: "冒烟测试" }),
  });
  if (!registerRes.ok) throw new Error(`register failed: ${await registerRes.text()}`);
  const cookie = parseCookie(registerRes.headers.get("set-cookie"));
  console.log("register ok:", email);

  const profileRes = await fetch(`${base}/api/profiles`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      name: "测试",
      gender: "男",
      calendarType: "solar",
      birthYear: 1990,
      birthMonth: 5,
      birthDay: 15,
      birthHour: 15,
      setAsActive: true,
    }),
  });
  const profile = await profileRes.json();
  if (!profileRes.ok) throw new Error(`profile failed: ${JSON.stringify(profile)}`);
  console.log("profile:", profile.id);

  const meRes = await fetch(`${base}/api/auth/me`, { headers: { Cookie: cookie } });
  const me = await meRes.json();
  console.log("active profile:", me.user.activeProfileId);

  const baziRes = await fetch(`${base}/api/v1/bazi`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ params: {} }),
  });
  const bazi = await baziRes.json();
  if (!baziRes.ok) throw new Error(`bazi failed: ${JSON.stringify(bazi)}`);
  console.log("bazi ok:", !!bazi.templateReport, "reportId:", bazi.reportId);
  console.log(bazi.templateReport.slice(0, 200));

  const reportsRes = await fetch(`${base}/api/reports`, { headers: { Cookie: cookie } });
  const reports = await reportsRes.json();
  if (!reportsRes.ok) throw new Error(`reports failed: ${JSON.stringify(reports)}`);
  console.log("reports count:", reports.reports?.length ?? 0);

  const loginRes = await fetch(`${base}/api/admin/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" }),
  });
  const login = await loginRes.json();
  const setCookie = loginRes.headers.get("set-cookie") ?? "";
  console.log("admin login:", loginRes.ok && (login.ok || setCookie.includes("admin_token")));
}

main().catch(console.error);

export {};
