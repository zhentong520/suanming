# Development Plan: 人生洞察客户解锁 + 面相手相交叉

## Goals

1. 管理员可按用户开关「是否允许看人生洞察」
2. 积分配置增加「人生洞察解锁」费用；用户在报告页扣分解锁
3. 面相/手相也可生成同类洞察；有出生年月日时辰时与八字合并以提高主题一致性
4. 明确：更准 = 主题交叉更一致，**不是**事实预言 / 现职探测

## Rules

| 项 | 规则 |
|----|------|
| 权限 | `users.allow_life_insights` 默认关；管理员在用户管理开启 |
| 计费 | `billing_cost_life_insights`（默认 30）；`POST /api/reports/[id]/unlock-insights` |
| 存储 | `reports.life_insights_unlocked`；洞察仍在 `facts.adminInsights` |
| 模块 | `bazi` / `bazi-dayun` / `face` / `palm` |
| 脱敏 | 未解锁不返回 `lifeInsights`；`facts` 始终剥离 `adminInsights` |

## Tasks

- [x] Schema + migrate
- [x] Billing settings / admin UI
- [x] Users allow flag / admin UI
- [x] Unlock API + getUserReport meta
- [x] Customer report UI
- [x] Face/palm admin-insights + birth merge
- [x] Tests + docs

## QA

- [x] 未开权限：解锁返回 forbidden
- [x] 已开权限：扣分后可见；重复解锁 spent=0
- [x] 面相+档案：显式传 profileId + 文案提示
- [x] 结果页链到 `/reports/[id]#insights`
- [x] 管理员后台仍可免费看全部洞察
