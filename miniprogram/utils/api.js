const conf = require("../config");

function getToken() {
  try {
    return wx.getStorageSync("token") || "";
  } catch {
    return "";
  }
}

function setAuth(token, user) {
  wx.setStorageSync("token", token || "");
  if (user) wx.setStorageSync("user", user);
  const app = getApp();
  if (app) app.globalData.user = user || null;
}

function clearAuth() {
  wx.removeStorageSync("token");
  wx.removeStorageSync("user");
  const app = getApp();
  if (app) app.globalData.user = null;
}

function request({ url, method = "GET", data, auth = true }) {
  const base = (getApp()?.globalData?.apiBase || conf.apiBase).replace(/\/$/, "");
  const header = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) header.Authorization = `Bearer ${token}`;
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${base}${url}`,
      method,
      data,
      header,
      success(res) {
        if (res.statusCode === 401) {
          clearAuth();
          reject(new Error(res.data?.error || "请先登录"));
          return;
        }
        if (res.statusCode >= 400) {
          reject(new Error(res.data?.error || `请求失败(${res.statusCode})`));
          return;
        }
        resolve(res.data);
      },
      fail(err) {
        reject(new Error(err.errMsg || "网络错误"));
      },
    });
  });
}

module.exports = {
  getToken,
  setAuth,
  clearAuth,
  request,
  conf,
};
