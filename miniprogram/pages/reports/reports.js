const api = require("../../utils/api");

Page({
  data: { authed: false, reports: [], error: "" },
  onShow() {
    const authed = !!api.getToken();
    this.setData({ authed });
    if (authed) this.load();
  },
  goLogin() {
    wx.navigateTo({ url: "/pages/login/login" });
  },
  async load() {
    try {
      const data = await api.request({ url: "/api/reports" });
      this.setData({ reports: data.reports || [], error: "" });
    } catch (err) {
      this.setData({ error: err.message });
    }
  },
});
