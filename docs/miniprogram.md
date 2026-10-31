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
- **米大师后台必须**：「道具管理」按上表建道具、单价与 `lib/billing/recharge.ts` 的 `priceFen` 完全一致
- **发货回调走「消息推送」通道**：小程序后台 → 开发 → 开发管理 → 消息推送 → 启用并填 `URL=<你的域名>/api/pay/wechat/notify`、`Token=WX_MINI_CALLBACK_TOKEN`（.env 同步配置）、数据格式 **JSON**、加密方式 **明文模式**；服务端实现 GET echostr 校验（SHA1 of Token）
- 服务端 `.env`：`WX_MINI_OFFER_ID` / `WX_MINI_APPKEY`（现网）、可选 `WX_MINI_SANDBOX_APPKEY` + `WX_MINI_PAY_ENV=1`（沙箱联调）
- **发货安全模型**：回调只作触发信号，服务端向微信 `/xpay/query_order` 实单确认（pay_sig 签名）支付成功且 `paid_fee` 与订单金额一致才入账——伪造回调无法触发发货；订单 `pending → paid` 幂等入账 `point_ledger`（reason=recharge），微信内部单号回填 `external_trade_no`
- 联调注意：`signData` 由服务端序列化，小程序端**原样上送**（不得重新 JSON.stringify）；session_key 过期报 15007 时重新微信登录即可

### 质量抽查

- `npx tsx --tsconfig tsconfig.json scripts/ai-spotcheck.mts [bazi|liuyao|ziwei|name|almanac]`：用真实 Key 跑解读并自动质检「去套话铁律」，供 prompt 迭代复查

## 支付宝网页支付（Web 端充值，2026-11 新增）

- 通道：支付宝「电脑网站支付」（`alipay.trade.page.pay`），档位与小程序充值共用（`RECHARGE_PACKAGES`）
- 流程：Web 充值页选档 → `POST /api/pay/alipay/prepare`（建单+RSA2 签名，返回收银台 URL）→ 跳转支付宝付款 → 异步通知 `/api/pay/alipay/notify` 验签+金额校验+幂等发货 → 同步回跳 `/api/pay/alipay/return` 到充值页
- **资质要求**：电脑网站支付需企业/个体工商户签约（个人身份无法签约）；境外用户用支付宝钱包可付（人民币结算），境外本地币收单需另签蚂蚁国际 Antom/Alipay+
- 服务端 `.env`：`ALIPAY_APP_ID` / `ALIPAY_PRIVATE_KEY`（PKCS8 应用私钥）/ `ALIPAY_ALIPAY_PUBLIC_KEY`（支付宝公钥）；沙箱再加 `ALIPAY_GATEWAY_URL=https://openapi-sandbox.dl.alipaydev.com/gateway.do`
- 安全设计：通知 RSA2 验签（支付宝公钥）+ `app_id` 比对 + `total_amount` 与订单金额比对 + 订单状态机幂等（pending→paid 单向），验签失败一律 400 拒绝
- 测试：`tests/billing/alipay.test.ts`（6 用例：签名串构造/RSA 往返/收银台 URL/幂等发货/金额篡改拒绝/等待态忽略）
