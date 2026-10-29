const api = require("../../utils/api");

Page({
  data: { report: null, error: "" },
  onLoad(query) {
    if (!query.id) {
      this.setData({ error: "缺少报告 id" });
      return;
    }
    this.load(query.id);
  },
  async load(id) {
    try {
      const data = await api.request({ url: `/api/reports/${id}` });
      this.setData({ report: data, error: "" });
    } catch (err) {
      this.setData({ error: err.message });
    }
  },
});
