App({
  globalData: {
    apiBase: "",
    user: null,
  },
  onLaunch() {
    const conf = require("./config");
    this.globalData.apiBase = conf.apiBase.replace(/\/$/, "");
    try {
      const token = wx.getStorageSync("token");
      const user = wx.getStorageSync("user");
      if (token && user) {
        this.globalData.user = user;
      }
    } catch (e) {
      /* ignore */
    }
  },
});
