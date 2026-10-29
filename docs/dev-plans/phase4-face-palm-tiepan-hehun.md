# Development Plan: 面相手相加深 + 报告贴盘 + 合婚四化对照

## Project Purpose and Goals

在纯 JS、文化娱乐免责声明前提下，完成一期「用户体感」加深：

1. **面相 / 手相**：规则库扩容、特征组合断、Vision 特征对齐规则 ID  
2. **报告文案贴盘**：合婚 / 八字 / 奇门 / 六壬关键段落引用盘面事实，减少空泛套话  
3. **合婚双方四化对照**：双方紫微生年四化交叉解读（尤重夫妻宫）

## Context and Background

- 面相手相现约 28/27 条规则；识图以 Vision 自由文案为主，规则库仅兜底  
- 合婚已双盘排紫微夫妻宫与单方四化，**缺少 A↔B 四化对照**  
- 合婚 enrich 事业/财运/感情多为总分阈值套话；八字事业财运偏五行模板；奇门六壬域段落未充分引用用神/初传

## Development Tasks

### Phase A — 面相手相规则与组合

- [x] 扩容 `content/face-rules.json`、`content/palm-rules.json`（目标各 ≥80 条，覆盖十二宫/五官气色、主辅线九丘掌型）
- [x] 新增 `lib/engine/face-palm/combos.ts`：多特征组合断语
- [x] `face-palm/index.ts`：匹配后附加 `combos`；导出特征目录供 Vision 对齐
- [x] Perform self-review of Phase A
- [x] Continue (user requested full implementation without mid-stop)

### Phase B — Vision 结构化对齐

- [x] `vision-reading.ts`：prompt 要求 `observedFeatures` 尽量使用规则库标准名；解析后 `normalizeObservedFeatures`
- [x] 图片路径：优先用规则库 meaning 覆盖/补齐 analysis
- [x] Perform self-review of Phase B
- [x] Continue

### Phase C — 合婚双方四化对照

- [x] `matchmaking/index.ts`：双方 `computeZiwei` 生年四化对照（禄权科忌入对方关键宫、夫妻宫交叉）
- [x] 输出 `sihuaCompare` + 分数微调；`enrichMatch` 增加「双方四化对照」节，事业/感情贴盘
- [x] Perform self-review of Phase C
- [x] Continue

### Phase D — 核心报告贴盘

- [x] 八字：事业/财运段落绑定格局名、喜用、通根摘要
- [x] 奇门：财运/感情/健康引用用神宫门星神、门迫击刑
- [x] 六壬：断语域引用取传法、初传神将
- [x] Perform self-review of Phase D
- [x] Continue

### Phase E — 验收

- [x] 单测：规则数量、组合命中、合婚 sihuaCompare、贴盘关键词
- [x] 更新 `docs/使用文档.md` 精度表与 `DEVELOPMENT_PLAN.md` 勾选
- [x] `npm test` 全绿
- [x] Perform self-review of Phase E

## Important Considerations & Requirements

- [ ] 不引入本地 CV / 瑞士星历 / 原生依赖
- [ ] 只增 facts/sections 字段，API 兼容
- [ ] 面相手相保持「非医学诊断」免责
- [ ] 不编辑 Cursor plan 附件（若有）

## Technical Decisions

| 议题 | 决策 |
|------|------|
| Vision vs 规则 | Vision 提特征，规则库定 meaning；组合断本地计算 |
| 合婚四化 | 生年四化交叉，不引入大限流年四化对照（控制复杂度） |
| 贴盘范围 | 合婚 + 八字 + 奇门 + 六壬；紫微 enrich 已较贴盘，仅必要时微调 |

## Testing Strategy

- Vitest 无外网依赖  
- 面相：规则 ≥80、组合非空  
- 合婚：固定双盘 `sihuaCompare.notes.length > 0`  
- 贴盘：sections 含格局名 / 用神宫 / 取传法 等关键字  

## QA Checklist

- [ ] 需求三项均落地  
- [ ] `npm test` 通过  
- [ ] 文档精度表已更新  
- [ ] 免责声明保留  
- [ ] 无密钥写入仓库  
