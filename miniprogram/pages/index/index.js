const api = require("../../utils/api");

Page({
  data: {
    siteName: api.conf.siteName,
    user: null,
  },
  onShow() {
    const user = wx.getStorageSync("user") || null;
    this.setData({ user });
  },
  goLogin() {
    wx.navigateTo({ url: "/pages/login/login" });
  },
  goModules() {
    wx.switchTab({ url: "/pages/modules/modules" });
  },
  logout() {
    api.clearAuth();
    this.setData({ user: null });
  },
});
