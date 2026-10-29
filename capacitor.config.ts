import type { CapacitorConfig } from "@capacitor/cli";

/**
 * App 壳：WebView 加载线上/本机 H5（Next.js），业务与 API 仍在服务端。
 * - 生产：设 CAPACITOR_SERVER_URL 或 NEXT_PUBLIC_SITE_URL 为 https 域名
 * - 模拟器访问本机：默认 http://10.0.2.2:9111（Android 模拟器指向宿主机）
 * - 真机调试：改成电脑局域网 IP，如 http://192.168.1.8:9111
 */
const serverUrl =
  process.env.CAPACITOR_SERVER_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://10.0.2.2:9111";

const isHttp = serverUrl.startsWith("http://");

const config: CapacitorConfig = {
  appId: "com.yidao.suanming",
  appName: "易道命理",
  webDir: "capacitor/www",
  server: {
    url: serverUrl.replace(/\/$/, ""),
    cleartext: isHttp,
  },
  android: {
    allowMixedContent: isHttp,
  },
};

export default config;
