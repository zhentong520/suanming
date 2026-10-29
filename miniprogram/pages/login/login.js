const api = require("../../utils/api");

Page({
  data: {
    mode: "login",
    account: "",
    password: "",
    displayName: "",
    loading: false,
    error: "",
  },
  switchMode(e) {
    this.setData({ mode: e.currentTarget.dataset.mode, error: "" });
  },
  onAccount(e) {
    this.setData({ account: e.detail.value });
  },
  onPassword(e) {
    this.setData({ password: e.detail.value });
  },
  onName(e) {
    this.setData({ displayName: e.detail.value });
  },
  async submit() {
    const { mode, account, password, displayName } = this.data;
    this.setData({ loading: true, error: "" });
    try {
      if (mode === "login") {
        const data = await api.request({
          url: "/api/auth/login",
          method: "POST",
          auth: false,
          data: { account, password },
        });
        if (!data.token) throw new Error("登录未返回 token，请升级后端");
        api.setAuth(data.token, data.user);
      } else {
        const isEmail = account.includes("@");
        const data = await api.request({
          url: "/api/auth/register",
          method: "POST",
          auth: false,
          data: {
            email: isEmail ? account : undefined,
            phone: isEmail ? undefined : account,
            password,
            displayName: displayName || undefined,
          },
        });
        if (!data.token) throw new Error("注册未返回 token，请升级后端");
        api.setAuth(data.token, data.user);
      }
      wx.switchTab({ url: "/pages/index/index" });
    } catch (err) {
      this.setData({ error: err.message || "失败" });
    } finally {
      this.setData({ loading: false });
    }
  },
});
