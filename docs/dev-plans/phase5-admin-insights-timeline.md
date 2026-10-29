# Development Plan: 流年事件倾向 + 六亲时间线（仅后台）+ 行业倾向

## Project Purpose and Goals

在八字/大运流年基础上生成结构化「人生推演」供**管理员内部参考**：

1. **流年事件倾向**：按大运/流年给出事件类别（婚恋、事业、财运、迁移、健康、父母、子女、破耗、贵人等）  
2. **六亲时间线**：按年龄段给出父母/兄弟/配偶/子女主题倾向  
3. **行业倾向**：按日主五行、喜用、格局给出**适合/常见行业方向**（明确无法探测现职）  
4. **权限**：写入 `facts.adminInsights` 并入库；客户报告与客户 API **不展示**；管理后台可查看  

## Context and Background

- 客户 UI 只渲染 `templateReport` / `aiReport`；但 API 仍返回完整 `facts`，需主动剥离 `adminInsights`  
- 现实中“算过去未来大事”多为象征规则 + 话术；产品定位为文化娱乐内部辅助，不作事实断言  

## Development Tasks

### Phase A — 规则引擎

- [x] `lib/engine/bazi/admin-insights.ts`：timeline / liuqin / careerHint  
- [x] 从大运流年喜用分与十神推导事件类别  
- [x] 行业映射表（五行×喜用 → 行业列表）+「非现职探测」说明  

### Phase B — 挂载与脱敏

- [x] `runModule` 在 enrich 后对 `bazi` / `bazi-dayun`（及有大运数据时）附加 `adminInsights`  
- [x] 不写入 `sections`（避免进客户模板）  
- [x] 客户 API / `getUserReport` 剥离 `adminInsights`；管理员测算可保留  

### Phase C — 管理后台

- [x] `GET /api/admin/reports/[id]`  
- [x] `/admin/reports/[id]` 页面展示 adminInsights  
- [x] 操作记录「查看」链到后台报告页  

### Phase D — 验收

- [x] 单测 + 文档勾选  
- [x] `npm test`  

## Technical Decisions

| 议题 | 决策 |
|------|------|
| 现行业 | 只输出「行业倾向」，不声称探测当前职业 |
| 存储 | `facts.adminInsights`，无新表 |
| 客户可见性 | 剥离 API + 不进 sections/AI digest |

## QA Checklist

- [ ] 客户报告无 adminInsights 字样  
- [ ] 后台可打开报告洞察  
- [ ] 免责声明保留  
