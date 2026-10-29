# 易道命理 MCP（DivinationHub）

通过 Model Context Protocol 把本站测算引擎暴露给 Cursor / Claude Desktop 等 Agent。

## 启动

```bash
npm run mcp
```

默认走 stdio，会先 `seedDatabase()` 确保本地 SQLite 可用。测算默认 **不调用 AI**（`skipAi`），避免消耗火山额度。

## Cursor 配置

在 Cursor MCP 设置中新增（路径按本机修改）：

```json
{
  "mcpServers": {
    "suanming": {
      "command": "npx",
      "args": ["tsx", "mcp/server.ts"],
      "cwd": "E:/suanming"
    }
  }
}
```

或使用仓库内示例：复制 `.cursor/mcp.json.example` 为本地 MCP 配置。

## 工具

| Tool | 作用 |
|------|------|
| `list_modules` | 列出模块（可按命/卜/相/术筛选） |
| `get_module` | 单个模块元数据 |
| `run_divination` | 执行测算；需档案的模块传 `birth` |

### run_divination 示例

```json
{
  "module": "bazi",
  "birth": {
    "calendarType": "solar",
    "year": 1990,
    "month": 5,
    "day": 15,
    "hour": 14,
    "gender": "男"
  }
}
```

无需档案的模块：

```json
{
  "module": "yijing",
  "params": { "question": "近期事业方向" }
}
```

开启 AI（可选）：

```json
{
  "module": "bazi",
  "birth": { "calendarType": "solar", "year": 1990, "month": 5, "day": 15, "hour": 14, "gender": "男" },
  "enableAi": true,
  "userId": "可选-计配额的用户id"
}
```
