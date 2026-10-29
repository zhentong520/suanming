const api = require("../../utils/api");

Page({
  data: {
    authed: false,
    profiles: [],
    activeId: "",
    genders: ["男", "女"],
    genderIndex: 0,
    form: {
      name: "",
      birthYear: "1990",
      birthMonth: "5",
      birthDay: "15",
      birthHour: "12",
    },
    creating: false,
    error: "",
  },
  onShow() {
    const authed = !!api.getToken();
    this.setData({ authed });
    if (authed) this.load();
  },
  goLogin() {
    wx.navigateTo({ url: "/pages/login/login" });
  },
  onForm(e) {
    this.setData({ [`form.${e.currentTarget.dataset.k}`]: e.detail.value });
  },
  onGender(e) {
    this.setData({ genderIndex: Number(e.detail.value) });
  },
  async load() {
    try {
      const me = await api.request({ url: "/api/auth/me" });
      this.setData({
        profiles: me.profiles || [],
        activeId: me.user?.activeProfileId || "",
      });
    } catch (err) {
      this.setData({ error: err.message, authed: !!api.getToken() });
    }
  },
  async create() {
    const { form, genders, genderIndex } = this.data;
    this.setData({ creating: true, error: "" });
    try {
      await api.request({
        url: "/api/profiles",
        method: "POST",
        data: {
          name: form.name || "本人",
          gender: genders[genderIndex],
          calendarType: "solar",
          birthYear: Number(form.birthYear),
          birthMonth: Number(form.birthMonth),
          birthDay: Number(form.birthDay),
          birthHour: form.birthHour === "" ? null : Number(form.birthHour),
          setAsActive: true,
        },
      });
      await this.load();
    } catch (err) {
      this.setData({ error: err.message });
    } finally {
      this.setData({ creating: false });
    }
  },
  async setActive(e) {
    const profileId = e.currentTarget.dataset.id;
    try {
      await api.request({
        url: "/api/auth/active-profile",
        method: "POST",
        data: { profileId },
      });
      await this.load();
    } catch (err) {
      this.setData({ error: err.message });
    }
  },
});
