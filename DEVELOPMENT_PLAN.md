# Development Plan for 易道命理

> 最后更新：2026-08-16  
> **项目知识（架构/需求/功能/SQL/待办）只写 Agent Hub**：  
> [`E:/agent-hub/projects/suanming/INDEX.md`](file:///E:/agent-hub/projects/suanming/INDEX.md)  
> **下一主线建议：支付对接（微信/支付宝）** — 见 Hub [`docs/backlog.md`](file:///E:/agent-hub/projects/suanming/docs/backlog.md)

## 产品优先级

1. 算法更准 · 2. 回答更贴盘 · 3. 积分计费 / 用户运营 · 4. **支付对接** · 5. 微信分享按需  

---

## 积分计费专项（已完成一期）

- [x] 积分账本 + 测算/AI/视觉扣费；关收费全员扣 0；admin 特权
- [x] 游客可浏览不可测算；注册送 10 分；后台用户/计费
- [x] 充值页占位 + `payment_orders`（真实支付见 Hub backlog P0）

PRD / 计划：[billing-requirements.md](file:///E:/agent-hub/projects/suanming/docs/billing-requirements.md) · [billing-dev-plan.md](file:///E:/agent-hub/projects/suanming/docs/billing-dev-plan.md)

---

## 测算引擎深度完善专项（2026-08）

- [x] Phase 1：合婚对方真太阳时坐标；塔罗/灵签种子可复现；六爻手动爻
- [x] Phase 2：紫微流月流日 + 红鸾天喜等辅星
- [x] Phase 3：八字神煞 / 月令格局 / 调候加深
- [x] Phase 4：奇门值符值使与日空；大六壬涉害/遥克
- [x] Phase 5：`astronomy-engine` 地心黄经（吠陀/七政）
- [x] Phase 6：面相手相规则扩容、灵签 100 签、`birth-chart` 统一入口

### 引擎「最完善」二期（纯 JS，不上瑞士星历）

- [x] A：紫微四化飞星串宫 + 十二宫干 + 大限/流年四化
- [x] B：八字成格/破格细则 + 天德/月德/华盖
- [x] C：奇门天地盘干、中宫寄坤、马星
- [x] D：大六壬完整取传链（贼克→比用→涉害→遥克→昴星/别责）
- [x] E：卦爻动爻细读；上升黄经公式改进
- [x] F：二期单测 + 使用文档精度表更新

### 引擎「最完善」三期（贴盘断语加深）

- [x] A：紫微流月/流日四化 + 禄忌提示 + 天哭虚龙凤三台八座
- [x] B：六爻京房世应、伏神、六冲合、日辰生克
- [x] C：八字通根透干明细 + 大运/流年格局成破交叉
- [x] D：奇门八神断/门迫击刑；六壬十二神将断语
- [x] E：行星逆行标注 + 三期单测与文档

### 四期：面相手相 + 报告贴盘 + 合婚四化

计划全文：[`docs/dev-plans/phase4-face-palm-tiepan-hehun.md`](docs/dev-plans/phase4-face-palm-tiepan-hehun.md)

- [x] A：面相手相规则扩容 + 组合断
- [x] B：Vision 特征对齐规则库
- [x] C：合婚双方生年四化对照
- [x] D：八字/奇门/六壬报告贴盘
- [x] E：单测与使用文档

### 五期：后台人生洞察（客户不可见）

计划：[`docs/dev-plans/phase5-admin-insights-timeline.md`](docs/dev-plans/phase5-admin-insights-timeline.md)

- [x] 流年/大运事件倾向 + 六亲时间线 + 行业倾向 → `facts.adminInsights`
- [x] 客户 API / 用户报告剥离；模板与 AI 不引用
- [x] 管理后台 `/admin/reports/[id]` 查看；操作记录链入

### 六期：客户积分解锁人生洞察 + 面相手相交叉

计划：[`docs/dev-plans/phase6-life-insights-unlock.md`](docs/dev-plans/phase6-life-insights-unlock.md)

- [x] 用户管理：`allowLifeInsights`；计费：`costLifeInsights`
- [x] 报告页积分解锁流年倾向 + 六亲时间线
- [x] 面相/手相也可生成洞察；绑定出生档案时与八字交叉更准
- [x] 仍无法探测现职；声明为文化象征

---

## 测算精度专项

已完成（详见 Hub INDEX「已完成」）：八字/紫微/六爻/奇门/大六壬/合婚/姓名起名/黄历/风水/七政吠陀等加深。

---

## 基建备查

- 大脑：Next.js · 薄壳：小程序 / Capacitor Android（`docs/android-app.md`）
- [ ] iOS 壳 · [ ] 正式签名 APK · [ ] 微信/支付宝真实支付

## Testing

`npm test`（引擎 + 鉴权 + 积分等）
