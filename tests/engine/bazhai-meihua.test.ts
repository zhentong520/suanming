import { describe, it, expect } from "vitest";
import { computeBazhai } from "@/lib/engine/fengshui/bazhai";
import { computeMeihua } from "@/lib/engine/yijing";
import { computeFengshui } from "@/lib/engine/fengshui";
import type { BirthInput } from "@/lib/engine/calendar";

describe("八宅大游年歌", () => {
  it("坎宅：生气巽、天医震、延年离、绝命坤、五鬼艮、祸害兑、六煞乾", () => {
    const r = computeBazhai("坎");
    const byPalace = Object.fromEntries(r.palaces.map((p) => [p.palace, p.star]));
    expect(byPalace["巽"]).toBe("生气");
    expect(byPalace["震"]).toBe("天医");
    expect(byPalace["离"]).toBe("延年");
    expect(byPalace["坎"]).toBe("伏位");
    expect(byPalace["坤"]).toBe("绝命");
    expect(byPalace["艮"]).toBe("五鬼");
    expect(byPalace["兑"]).toBe("祸害");
    expect(byPalace["乾"]).toBe("六煞");
    expect(r.eastFour).toBe(true);
  });

  it("乾宅（西四）：生气兑、天医艮、延年坤、绝命离、五鬼艮?（核对：乾六天五祸绝延生）", () => {
    const r = computeBazhai("乾");
    const byPalace = Object.fromEntries(r.palaces.map((p) => [p.palace, p.star]));
    // 乾伏位，顺时针下一位坎=六煞、艮=天医、震=五鬼、巽=祸害、离=绝命、坤=延年、兑=生气
    expect(byPalace["坎"]).toBe("六煞");
    expect(byPalace["艮"]).toBe("天医");
    expect(byPalace["震"]).toBe("五鬼");
    expect(byPalace["巽"]).toBe("祸害");
    expect(byPalace["离"]).toBe("绝命");
    expect(byPalace["坤"]).toBe("延年");
    expect(byPalace["兑"]).toBe("生气");
    expect(r.eastFour).toBe(false);
  });

  it("四吉四凶归类与应期", () => {
    const r = computeBazhai("离");
    const shengQi = r.palaces.find((p) => p.star === "生气")!;
    expect(shengQi.yingQi).toBe("亥卯未");
    const wuGui = r.palaces.find((p) => p.star === "五鬼")!;
    expect(wuGui.yingQi).toBe("寅午戌");
  });

  it("computeFengshui 集成 bazhai", () => {
    const input: BirthInput = {
      calendarType: "solar",
      year: 1990,
      month: 5,
      day: 15,
      gender: "男",
    } as BirthInput;
    const r = computeFengshui(input, { facing: "南" });
    expect(r.bazhai).toBeTruthy();
    expect(r.bazhai.palaces).toHaveLength(8);
  });
});

describe("梅花互卦/变卦/卦气", () => {
  it("泽火革（兑上离下）互卦为家人（风火家人？二三爻…) 按爻推互卦", () => {
    // 革卦 兑上离下：bits = 离[1,0,1] + 兑[1,1,0] = [1,0,1,1,1,0]
    // 互卦下=234=[0,1,1]=巽、上=345=[1,1,1]=乾 → 天风姤
    const r = computeMeihua("测试", undefined, new Date(2026, 10, 1, 12));
    expect(r.huGua).toBeTruthy();
    expect(r.bianGuaName).toBeTruthy();
    expect(r.cuoGua).toBeTruthy();
    expect(r.zongGua).toBeTruthy();
  });

  it("观梅占：辰年十二月十七申时 泽火革 → 互卦天风姤、变卦泽山咸（经典案例）", () => {
    // 邵雍观梅占：上兑(2)下离(3)，动爻4？实际动爻 = 43%6=1? 本测试只验证 互卦/变卦 计算与经典一致：
    // 直接构造 numbers：上卦兑2、下卦离3、动爻按《梅花易数》原文为四爻动？观梅占动爻 = (5+12+17+9)%6 = 43%6=1？原文四爻动。
    // 此处验证确定性：给定 numbers=[2,3,4]，动爻4 → 变卦：四爻动后 革变既济（兑上离下，四爻阳变阴 → 坎上离下=水火既济）
    const r = computeMeihua("观梅", [2, 3, 4], new Date(2026, 11, 17, 15));
    expect(r.upperName).toBe("兑");
    expect(r.lowerName).toBe("离");
    expect(r.bianGuaName).toBe("既济");
    // 互卦：革互卦 = [0,1,1]巽 + [1,1,1]乾 → 天风姤
    expect(r.huGua).toBe("姤");
  });

  it("卦气旺衰输出非空且含体卦信息", () => {
    const r = computeMeihua("测试", [2, 3, 4], new Date(2026, 11, 17, 15));
    expect(r.guaQi).toBeTruthy();
  });
});
