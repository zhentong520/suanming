/** Shared admin API fetch helpers — rely on HttpOnly admin_token cookie. */

export function adminHeaders(json = true): HeadersInit {
  return json ? { "Content-Type": "application/json" } : {};
}

export async function adminFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });
}
