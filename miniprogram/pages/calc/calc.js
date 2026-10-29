const api = require("../../utils/api");
const MODULES = require("../../utils/modules");

Page({
  data: {
    mod: null,
    form: {},
    loading: false,
    error: "",
    report: "",
    reportId: "",
  },
  onLoad(query) {
    const mod = MODULES.find((m) => m.id === query.id);
    if (!mod) {
      this.setData({ error: "未知模块" });
      return;
    }
    const form = {};
    (mod.fields || []).forEach((f) => {
      form[f.key] = "";
    });
    this.setData({ mod, form });
    wx.setNavigationBarTitle({ title: mod.name });
  },
  onField(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [`form.${key}`]: e.detail.value });
  },
  async submit() {
    const { mod, form } = this.data;
    if (!mod) return;
    if (!api.getToken()) {
      wx.navigateTo({ url: "/pages/login/login" });
      return;
    }
    this.setData({ loading: true, error: "", report: "", reportId: "" });
    try {
      const params = { ...form };
      if (params.surnameLen) params.surnameLen = Number(params.surnameLen) || 1;
      const data = await api.request({
        url: `/api/v1/${mod.id}`,
        method: "POST",
        data: { params },
      });
      this.setData({
        report: data.templateReport || "",
        reportId: data.reportId || "",
      });
    } catch (err) {
      this.setData({ error: err.message || "测算失败" });
    } finally {
      this.setData({ loading: false });
    }
  },
});
