import { getModuleDefinition, MODULE_DEFINITIONS } from "@/lib/hub/module-registry";

export const PRIORITY_LABELS: Record<string, string> = {
  P0: "核心",
  P1: "重要",
  P2: "增强",
  P3: "扩展",
};

export const ACTION_LABELS: Record<string, string> = {
  module_calc: "模块测算",
  login: "登录",
  logout: "退出登录",
  register: "注册",
  create_profile: "创建档案",
  switch_profile: "切换档案",
  upload_reading_image: "上传识图",
  ai_interpret: "AI 解读",
  ai_enhance: "AI 增强解读",
  ai_vision: "AI 识图",
};

/** 测算类操作（含测算与 AI 解读） */
export const CALC_ACTIONS = new Set([
  "module_calc",
  "ai_enhance",
  "ai_interpret",
  "ai_vision",
  "upload_reading_image",
]);

export function moduleNameZh(moduleId: string | null | undefined): string {
  if (!moduleId) return "—";
  return getModuleDefinition(moduleId)?.name ?? moduleId;
}

export function priorityLabel(priority: string): string {
  return PRIORITY_LABELS[priority] ?? priority;
}

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export function isCalcAction(action: string): boolean {
  return CALC_ACTIONS.has(action);
}

export function allModuleNameMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const m of MODULE_DEFINITIONS) map[m.id] = m.name;
  return map;
}
