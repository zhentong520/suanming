import { describe, expect, it } from "vitest";
import { getDictionary, t, localizeSectionTitle, translateKey } from "@/lib/i18n/get-dictionary";
import { parseLocale } from "@/lib/i18n/config";
import { getModuleName, getModuleDescription } from "@/lib/hub/module-i18n";

describe("i18n", () => {
  it("parses locale", () => {
    expect(parseLocale("en")).toBe("en");
    expect(parseLocale("zh")).toBe("zh");
    expect(parseLocale("fr")).toBe("zh");
  });

  it("translates nav keys", () => {
    expect(t(getDictionary("zh"), "nav.home")).toBe("首页");
    expect(t(getDictionary("en"), "nav.home")).toBe("Home");
    expect(translateKey("en", "home.subtitle", { count: 31 })).toContain("31");
  });

  it("localizes section titles", () => {
    expect(localizeSectionTitle("zh", "事业运势")).toBe("事业运势");
    expect(localizeSectionTitle("en", "事业运势")).toBe("Career");
  });

  it("resolves module labels", () => {
    expect(getModuleName("bazi", "zh", "八字排盘")).toBe("八字排盘");
    expect(getModuleName("bazi", "en", "八字排盘")).toBe("BaZi Chart");
    expect(getModuleDescription("naming", "en", "x")).toMatch(/BaZi|name/i);
  });
});
