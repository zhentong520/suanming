# 微信小程序壳

`miniprogram/` 是对接本站 REST API 的原生小程序壳（登录、档案、术数列表、测算、历史）。

## 前置

1. 本机或服务器已运行 `npm run dev` / `npm run start`（默认端口 **9111**）
2. 修改 `miniprogram/config.js` 的 `apiBase`
3. 用[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)打开 `miniprogram/` 目录
4. 开发阶段可关「校验合法域名」（`project.config.json` 已设 `urlCheck: false`）
5. 正式上线：小程序后台配置 request 合法域名 = 你的 HTTPS API 域名；替换 `appid`

## 鉴权

登录/注册接口返回 `token`，小程序用 `Authorization: Bearer <token>` 调用受保护 API（与 Web Cookie 并存）。

## 页面

| 页面 | 功能 |
|------|------|
| 首页 | 入口与登录状态 |
| 术数 | 模块列表 → 测算页 |
| 测算 | 按模块提交 `/api/v1/:module` |
| 档案 | 列表 / 新建 |
| 历史 | `/api/reports` 与详情 |

面相/手相上传、合婚双档案等复杂交互仍以 H5 为准；壳内优先覆盖常用文本测算。

## 与「微信分享」区别

- **小程序壳**：独立 AppID、上架审核、原生页面调 API  
- **H5 微信分享**：公众号 JSSDK（`WECHAT_APP_ID`），可留到最后联调  

## 微信登录与虚拟支付（2026-11 新增）

### 微信一键登录

- 登录页新增「微信一键登录」：`wx.login` 取 code → `POST /api/auth/wechat` → code2session 换 openid
- 首次登录自动建号（送注册积分，与邮箱/手机注册口径一致）；`session_key` 存库仅服务端使用
- 服务端需配 `.env`：`WX_MINI_APPID` / `WX_MINI_SECRET`（未配置时接口返回明确中文报错，不影响其他功能）

### 积分充值（虚拟支付 2.0 · 道具直购）

- 充值页 `pages/recharge`：档位 → `POST /api/pay/wechat/prepare`（建单+签名）→ `wx.requestVirtualPayment` → 服务端回调发货
- 三档道具 productId：`points_60`（600 分）/ `points_300`（3000 分+赠 30）/ `points_980`（9800 分+赠 130）
- **米大师后台必须**：①「道具管理」按上表建道具、单价与 `lib/billing/recharge.ts` 的 `priceFen` 完全一致；②开启「道具发货推送」，回调地址填 `<你的域名>/api/pay/wechat/notify`
- 服务端 `.env`：`WX_MINI_OFFER_ID` / `WX_MINI_APPKEY`（现网）、可选 `WX_MINI_SANDBOX_APPKEY` + `WX_MINI_PAY_ENV=1`（沙箱联调）；上线建议 `WX_MINI_NOTIFY_STRICT=1` 开启回调验签
- 发货一律以服务端回调为准：回调把订单 `pending → paid` 并幂等入账 `point_ledger`（reason=recharge）；前端 success 仅做余额刷新提示
- 联调注意：`signData` 由服务端序列化，小程序端**原样上送**（不得重新 JSON.stringify）；session_key 过期报 15007 时重新微信登录即可

### 质量抽查

- `npx tsx --tsconfig tsconfig.json scripts/ai-spotcheck.mts [bazi|liuyao|ziwei|name|almanac]`：用真实 Key 跑解读并自动质检「去套话铁律」，供 prompt 迭代复查
