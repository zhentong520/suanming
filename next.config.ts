import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // 服务器（1.8G 内存）build 期 TS 检查 worker 反复 OOM（SIGKILL）。
  // 类型安全由本地/CI 的 `npx tsc --noEmit` 全量兜底，此处跳过仅为部署可行性。
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
