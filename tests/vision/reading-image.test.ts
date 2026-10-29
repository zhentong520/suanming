import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { validateImageFile, saveReadingImage, getReadingImage } from "@/lib/media/reading-image";

const testDir = path.resolve(process.cwd(), "data/uploads/test-user-vision");

function mockFile(name: string, type: string, size: number) {
  const buffer = Buffer.alloc(size, 1);
  return new File([buffer], name, { type });
}

beforeAll(() => {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
});

afterAll(() => {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
});

describe("reading image upload", () => {
  it("rejects invalid mime type", () => {
    const file = mockFile("a.gif", "image/gif", 2048);
    expect(() => validateImageFile(file, "face")).toThrow("仅支持 JPG");
  });

  it("rejects oversized file", () => {
    const file = mockFile("big.jpg", "image/jpeg", 6 * 1024 * 1024);
    expect(() => validateImageFile(file, "palm")).toThrow("不能超过 5MB");
  });

  it("saves and loads image metadata", async () => {
    const userId = "test-user-vision";
    const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(4092, 1)]);
    const file = new File([jpeg], "face.jpg", { type: "image/jpeg" });
    const saved = await saveReadingImage(userId, "face", file);
    expect(saved.module).toBe("face");
    expect(saved.mimeType).toBe("image/jpeg");
    const loaded = await getReadingImage(userId, saved.id);
    expect(loaded?.id).toBe(saved.id);
    expect(loaded?.module).toBe("face");
  });

  it("rejects non-image content disguised as jpeg", async () => {
    const userId = "test-user-vision";
    const file = mockFile("fake.jpg", "image/jpeg", 4096);
    await expect(saveReadingImage(userId, "face", file)).rejects.toThrow("不是有效的");
  });

  it("rejects path traversal image id", async () => {
    const loaded = await getReadingImage("test-user-vision", "../etc/passwd");
    expect(loaded).toBeNull();
  });
});

describe("vision json parsing", () => {
  it("parses deep face analysis fields", async () => {
    const { parseVisionJsonForTest } = await import("@/lib/ai/vision-reading");
    const raw = JSON.stringify({
      valid: true,
      observedFeatures: ["额头饱满"],
      analysis: [{ feature: "额头饱满", category: "三停", meaning: "测试".repeat(40) }],
      summary: "综合总论",
      lifeDomains: {
        personality: "性格",
        career: "事业",
        wealth: "财运",
        love: "感情",
        health: "健康",
      },
      timeline: { earlyLife: "早年", midLife: "中年", lateLife: "晚年" },
      strengths: ["优势1"],
      cautions: ["注意1"],
      advice: "建议",
      detailSections: [{ title: "三停", content: "内容" }],
    });
    const r = parseVisionJsonForTest(raw);
    expect(r.lifeDomains?.career).toBe("事业");
    expect(r.timeline?.midLife).toBe("中年");
    expect(r.strengths).toHaveLength(1);
  });
});

describe("face/palm reading compute", () => {
  it("manual face reading still works", async () => {
    const { computeFaceReading } = await import("@/lib/engine/face-palm");
    const r = computeFaceReading(["额头饱满"]);
    expect(r.features).toContain("额头饱满");
    expect(r.analysis.length).toBeGreaterThan(0);
  });

  it("manual palm reading still works", async () => {
    const { computePalmReading } = await import("@/lib/engine/face-palm");
    const r = computePalmReading(["生命线长"]);
    expect(r.features.some((f) => f.includes("生命线"))).toBe(true);
    expect(r.analysis.length).toBeGreaterThan(0);
  });

  it("face rules expanded and combos fire", async () => {
    const { computeFaceReading, listFaceFeatureNames } = await import("@/lib/engine/face-palm");
    expect(listFaceFeatureNames().length).toBeGreaterThanOrEqual(80);
    const r = computeFaceReading(["额头饱满", "印堂开阔", "鼻梁高挺"]);
    expect(r.combos.length).toBeGreaterThan(0);
    expect(r.summary).toContain("组合");
  });

  it("palm rules expanded and combos fire", async () => {
    const { computePalmReading, listPalmFeatureNames } = await import("@/lib/engine/face-palm");
    expect(listPalmFeatureNames().length).toBeGreaterThanOrEqual(80);
    const r = computePalmReading(["生命线较长", "智慧线清晰", "事业线明显"]);
    expect(r.combos.length).toBeGreaterThan(0);
  });
});
