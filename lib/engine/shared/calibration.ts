/**
 * 排盘口径（Calibration）统一层：
 * 把「真太阳时、晚子时流派」等影响排盘结果的口径选择收敛到一处，
 * 供档案 UI、引擎与 AI 事实清单共用。每个口径附依据说明，学 ziwei-doushu 的可配置思路。
 */

export interface CalibrationOptions {
  /** 真太阳时校正：true = 启用（默认），false = 按钟表时间排盘 */
  useTrueSolar: boolean;
  /** 晚子时（23:00-23:59）日柱流派：1 = 算次日（子初换日派），2 = 算当天（子正换日派，默认） */
  ziSect: 1 | 2;
}

export const DEFAULT_CALIBRATION: CalibrationOptions = {
  useTrueSolar: true,
  ziSect: 2,
};

export function normalizeCalibration(input?: Partial<CalibrationOptions> | null): CalibrationOptions {
  return {
    useTrueSolar: input?.useTrueSolar !== false,
    ziSect: input?.ziSect === 1 ? 1 : 2,
  };
}

/** 口径选项的展示与依据（供档案页 UI 与报告口径说明共用） */
export const CALIBRATION_FIELDS: Array<{
  key: keyof CalibrationOptions;
  name: string;
  options: Array<{ value: boolean | 1 | 2; label: string; basis: string }>;
}> = [
  {
    key: "useTrueSolar",
    name: "真太阳时校正",
    options: [
      {
        value: true,
        label: "启用（推荐）",
        basis: "按出生地经度差 + 均时差（EoT）把钟表时间换算为真太阳时再定时辰；时辰差一刻，盘面差之千里",
      },
      {
        value: false,
        label: "按钟表时间",
        basis: "不校正，直接按北京时间钟面定时辰；适合出生地恰在东经 120° 附近或原始记录已是真太阳时",
      },
    ],
  },
  {
    key: "ziSect",
    name: "晚子时日柱流派",
    options: [
      { value: 2, label: "算当天（子正换日派，通行）", basis: "23:00-23:59 出生日柱取当日，夜子时不换日柱，为多数排盘软件通行口径" },
      { value: 1, label: "算次日（子初换日派）", basis: "子时初刻即换日，23 点后日柱取次日，部分古法持此说" },
    ],
  },
];

/** 供 AI 事实清单与报告使用的口径一句话摘要 */
export function calibrationSummary(opts: CalibrationOptions, longitude?: number | null): string {
  const parts: string[] = [];
  if (opts.useTrueSolar) {
    parts.push(longitude != null ? `真太阳时校正开（出生地经度 ${longitude}°，经度差+均时差）` : "真太阳时校正开（未填经度，实际未生效）");
  } else {
    parts.push(longitude != null ? "真太阳时校正关（用户选择钟表时间口径）" : "真太阳时校正关（未填经度）");
  }
  parts.push(opts.ziSect === 1 ? "晚子时日柱算次日（子初换日派）" : "晚子时日柱算当天（子正换日派）");
  return `排盘口径：${parts.join("；")}`;
}
