const api = require("../../utils/api");

Page({
  data: {
    authed: false,
    balance: 0,
    billingEnabled: true,
    xpayConfigured: false,
    packages: [],
    buyingId: "",
    error: "",
    notice: "",
  },
  onShow() {
    const authed = !!api.getToken();
    this.setData({ authed });
    if (authed) this.load();
    else this.setData({ error: "请先登录后再充值" });
  },
  goLogin() {
    wx.navigateTo({ url: "/pages/login/login" });
  },
  async load() {
    this.setData({ error: "" });
    try {
      const me = await api.request({ url: "/api/auth/me" });
      this.setData({
        balance: me.points?.balance ?? me.user?.pointsBalance ?? 0,
        billingEnabled: me.points?.billingEnabled ?? true,
      });
    } catch (err) {
      this.setData({ error: err.message || "读取余额失败" });
    }
    try {
      const conf = await api.request({ url: "/api/pay/wechat/prepare", auth: false });
      this.setData({
        packages: conf.packages || [],
        xpayConfigured: !!conf.xpayConfigured,
        notice: conf.xpayConfigured ? "" : "充值渠道暂未开通，敬请期待",
      });
    } catch (err) {
      this.setData({ error: err.message || "读取档位失败" });
    }
  },
  async buy(e) {
    const id = e.currentTarget.dataset.id;
    if (!id || this.data.buyingId) return;
    if (!api.getToken()) {
      wx.navigateTo({ url: "/pages/login/login" });
      return;
    }
    const pkg = this.data.packages.find((p) => p.id === id);
    if (!pkg) return;

    this.setData({ buyingId: id, error: "" });
    try {
      // 1) 服务端创建订单并签名
      const pay = await api.request({
        url: "/api/pay/wechat/prepare",
        method: "POST",
        data: { packageId: id },
      });
      // 2) 拉起虚拟支付（signData 必须原样上送，不得重新序列化）
      await new Promise((resolve, reject) => {
        wx.requestVirtualPayment({
          mode: pay.mode,
          signData: pay.signData,
          paySig: pay.paySig,
          signature: pay.signature,
          success: resolve,
          fail: (err) => reject(new Error(err.errMsg || "支付未完成")),
        });
      });
      // 3) 发货以服务端回调为准，这里轮询余额刷新（回调有秒级延迟，多刷一次兜底）
      wx.showToast({ title: "支付成功，积分到账中", icon: "success" });
      await new Promise((r) => setTimeout(r, 1200));
      await this.load();
      await new Promise((r) => setTimeout(r, 2000));
      await this.load();
    } catch (err) {
      this.setData({ error: err.message || "支付失败" });
    } finally {
      this.setData({ buyingId: "" });
    }
  },
});
