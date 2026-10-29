# 易道命理 — 国风命理融合平台

Web 版命理测算平台，融合八字、紫微、测字、黄历、合婚、五行人助运、医·灵治调运等 33 个术数模块。

📖 **完整使用文档：[docs/使用文档.md](docs/使用文档.md)**  
📄 **PDF 版：[docs/易道命理使用文档.pdf](docs/易道命理使用文档.pdf)**  
🗂️ **架构 / 需求 / 功能 / SQL / 待办（Agent Hub）**：[`E:/agent-hub/projects/suanming/INDEX.md`](file:///E:/agent-hub/projects/suanming/INDEX.md)  
（业务仓仅运维文档 + [docs/文档索引.md](docs/文档索引.md) 短指针）

## 功能

- **用户端（国风 UI）**：建档、八字、称骨、生肖、姓名、测字、黄历、合婚、紫微、六爻、梅花、小六壬、灵签、解梦、星座、塔罗、五行人助运、医·灵治调运等
- **管理后台**：模块开关、AI 模型配置、AI 分模块开关、仪表盘
- **确定性引擎**：`lunar-typescript` 历法计算 + 规则模板报告（默认不接 AI）
- **数据库**：SQLite（Postgres/MySQL 方言预留，见 `lib/db/dialect.ts`）
- **MCP**：`npm run mcp` 暴露 DivinationHub（见 `docs/mcp.md`）
- **微信小程序壳**：`miniprogram/`（见 `docs/miniprogram.md`）
- **Android App 壳**：Capacitor WebView 加载同一套 H5（见 `docs/android-app.md`）
- **积分计费**：测算扣积分；后台可开关收费、管用户与档位（见 `docs/积分计费需求.md`）

## 快速开始

### Windows 一键启动

双击项目根目录 **`start.bat`**（开发）或 **`start-prod.bat`**（生产构建后启动）。

### 命令行

```bash
npm install
cp .env.example .env.local
npm run db:seed
npm run dev
```

- 前台：http://localhost:9111
- **管理后台登录：http://localhost:9111/admin/login**
- 默认账号：`admin` / `admin123`

完整部署（PM2 / Nginx / Docker）见：**[docs/部署方案.md](docs/部署方案.md)**  
上线核对：**[docs/部署检查清单.md](docs/部署检查清单.md)**

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器 |
| `npm run build` | 生产构建 |
| `npm test` | 引擎单元测试 |
| `npm run smoke` | 冒烟测试（需服务已启动） |
| `npm run mcp` | 启动 DivinationHub MCP（stdio） |
| `npm run db:seed` | 初始化数据库与模块注册 |
| `npm run cap:sync` | 同步 Capacitor 配置到 `android/` |
| `npm run cap:android` | 用 Android Studio 打开工程 |
| `npm run cap:run:android` | 安装到已连接设备/模拟器 |
| 双击 `start.bat` | Windows 开发一键启动 |
| 双击 `start-prod.bat` | Windows 生产一键启动 |

## API

```
POST /api/v1/{module}
Body: { "profileId": "...", "params": { ... } }
```

## AI 预留

管理后台 `/admin/ai-providers` 与 `/admin/ai-switches` 已就绪。默认 `global_ai_enabled=false`，开启后才会调用配置的模型供应商。

## 免责声明

本系统仅供文化研习与娱乐参考，不构成医疗、法律、金融建议。
