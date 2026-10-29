# Android App 壳（Capacitor）

策略：**Next.js 仍是大脑**（页面 + API + 数据库）；本目录相关配置把 **WebView 指向 H5 地址**，打出 APK。不是把 Next 编译进 App。

## 架构

```
[Android APK / Capacitor]
        │  WebView
        ▼
[ https://你的域名 或 本机:9111 ]  ← 现有 Next 服务
        │
        ▼
[ /api/* · SQLite · AI ]
```

微信小程序壳见 [miniprogram.md](./miniprogram.md)，同样是调 API，互不冲突。

## 前置

1. 安装 [Android Studio](https://developer.android.com/studio)（含 SDK、模拟器可选）
2. 本机 JDK 17+
3. 后端已跑：`npm run dev` 或 `npm run start`（端口 **9111**）
4. 配置站点地址（二选一）  
   - `.env.local`：`NEXT_PUBLIC_SITE_URL=https://你的域名.com`  
   - 或临时：`CAPACITOR_SERVER_URL=http://10.0.2.2:9111`（模拟器访问宿主机）

真机调试请把 URL 改成电脑局域网 IP，例如 `http://192.168.1.8:9111`，并保证手机与电脑同一 Wi‑Fi；HTTP 已在配置里允许 cleartext。

## 常用命令

```bash
# 同步配置到 android/（改 capacitor.config.ts 后执行）
npm run cap:sync

# 用 Android Studio 打开工程
npm run cap:android

# 命令行装到已连接设备 / 模拟器（需已配好 SDK）
npm run cap:run:android
```

仓库已包含 `android/`。若需重建：删除后执行 `npx cap add android`，再 `npm run cap:sync`。

## 打正式 APK / AAB

1. `CAPACITOR_SERVER_URL` / `NEXT_PUBLIC_SITE_URL` 设为 **HTTPS 生产域名**
2. `npm run cap:sync`
3. Android Studio → Build → Generate Signed Bundle / APK  
   或使用 `android/` 下 Gradle：`assembleRelease` / `bundleRelease`
4. 上架需：签名密钥、应用图标、隐私政策、目标 API 级别等（按应用商店要求）

## 与 PWA 的关系

- **PWA**：浏览器「添加到主屏幕」，无需上架  
- **本 App 壳**：可上架应用商店、桌面图标、部分原生能力扩展（推送等可后加）  
- **业务逻辑不重复写**：两端都打开同一套 H5

## iOS（二期）

同一 Capacitor 配置可再执行 `npx cap add ios`（需 macOS + Xcode）。当前优先 Android。
