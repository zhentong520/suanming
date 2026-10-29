---
name: suanming-divination
description: 调用易道命理 DivinationHub（八字/紫微/易经等 31 门术数）。优先通过本仓库 MCP（npm run mcp）的 list_modules / run_divination；无 MCP 时可直接阅读 lib/hub 与 docs/mcp.md。
---

# 易道命理测算 Skill

## When to use

- 用户要求排盘、起卦、合婚、黄历、姓名五格等命理测算
- 需要列出可用术数模块或解释某模块输入

## How to call

1. 确认已配置 MCP `suanming`（见 `docs/mcp.md`）
2. `list_modules` 了解模块 id
3. `run_divination`：
   - `requiresProfile=true` → 必须传 `birth`
   - 否则传 `params`（如 `question`、`name`、`keyword`）
4. 默认不要开 `enableAi`，除非用户明确要 AI 解读

## Birth shape

```json
{
  "calendarType": "solar",
  "year": 1990,
  "month": 5,
  "day": 15,
  "hour": 14,
  "gender": "男"
}
```

## Caveats

结果仅供文化娱乐参考；不得当作医疗/法律/投资建议。
