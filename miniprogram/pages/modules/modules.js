const api = require("../../utils/api");
const modules = require("../../utils/modules");

Page({
  data: { modules, authed: false },
  onShow() {
    this.setData({ authed: !!api.getToken() });
  },
  goLogin() {
    wx.navigateTo({ url: "/pages/login/login" });
  },
});
