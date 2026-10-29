
import { describe, it, expect } from 'vitest';
import { computeWuxingRen, dressColorForDayZhi } from '@/lib/engine/wuxing-ren';
import { dayJiuXing } from '@/lib/engine/almanac/jiuxing';
import { computeMeihua } from '@/lib/engine/yijing';
import { computeFaceReading } from '@/lib/engine/face-palm';
import { computeAlmanac } from '@/lib/engine/almanac';

describe('wuxing-ren', () => {
  it('classifies body type and dress color', () => {
    const r = computeWuxingRen({ bodyType: '木', date: '2026-03-15' });
    expect(r.element).toBe('木');
    expect(r.dress.color).toBeTruthy();
    expect(r.sections.some((s) => s.title.includes('穿衣'))).toBe(true);
  });

  it('uses day master from birth', () => {
    const r = computeWuxingRen({
      birth: { calendarType: 'solar', year: 1990, month: 5, day: 15, hour: 15, gender: '男' },
      date: '2026-03-15',
    });
    expect(['木', '火', '土', '金', '水']).toContain(r.element);
    expect(r.source).toBe('dayMaster');
  });

  it('maps yin day to red (木生火)', () => {
    // 寅卯日木→火红
    const d = dressColorForDayZhi('寅');
    expect(d.bestWuXing).toBe('火');
  });
});

describe('day jiu xing', () => {
  it('maps lunar day to star', () => {
    const j = dayJiuXing(9);
    expect(j.id).toBe(9);
    expect(j.name).toContain('九紫');
  });
});

describe('meihua waiying', () => {
  it('includes outer response guide', () => {
    const r = computeMeihua('今日运势');
    expect(r.waiYingGuide).toContain('外应');
    expect(r.sections.some((s) => s.title === '外应心法')).toBe(true);
  });
});

describe('jiugong face', () => {
  it('attaches jiugong section data', () => {
    const r = computeFaceReading(['额头饱满']);
    expect(r.jiugongFace).toContain('九宫');
  });
});

describe('almanac jiuxing', () => {
  it('returns jiuXing on almanac', () => {
    const a = computeAlmanac('2026-03-15');
    expect(a.jiuXing?.name).toBeTruthy();
    expect(['吉', '平', '凶']).toContain(a.jiuXing.nature);
  });
});
