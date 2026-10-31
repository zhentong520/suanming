import { describe, it, expect } from 'vitest';
import { computeTiaoyun } from '@/lib/engine/tiaoyun';

describe('tiaoyun', () => {
  it('builds general overview', () => {
    const r = computeTiaoyun({ concern: 'general' });
    expect(r.concern).toBe('general');
    expect(r.sections.some((s) => s.title.includes('象数'))).toBe(true);
    expect(r.sections.some((s) => s.title.includes('调整的几个层面'))).toBe(true);
    expect(r.caveat).toContain('非医疗');
  });

  it('body concern includes body map', () => {
    const r = computeTiaoyun({ concern: 'body', focus: '想了解象数部位' });
    expect(r.sections.some((s) => s.title.includes('部位'))).toBe(true);
    expect(r.summary).toContain('医疗');
  });

  it('links birth profile dress tip on luck', () => {
    const r = computeTiaoyun({
      concern: 'luck',
      birth: { calendarType: 'solar', year: 1990, month: 5, day: 15, hour: 15, gender: '男' },
    });
    expect(r.dayMaster).toBeTruthy();
    expect(r.sections.some((s) => s.title.includes('穿衣'))).toBe(true);
  });
});
