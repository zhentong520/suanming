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
