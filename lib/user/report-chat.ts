import { and, desc, eq, gte, ne } from "drizzle-orm";
import crypto from "crypto";
import { getDb } from "@/lib/db/client";
import { reportMessages, reports } from "@/lib/db/schema";
import { getActiveProvider } from "@/lib/ai/interpret";
import { compliantAiText, sanitizeAiText } from "@/lib/ai/compliance";
import { buildKnowledgeContext } from "@/lib/db/knowledge";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export async function listReportMessages(userId: string, reportId: string, limit = 50): Promise<ChatMessage[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: reportMessages.id,
      role: reportMessages.role,
      content: reportMessages.content,
      createdAt: reportMessages.createdAt,
    })
    .from(reportMessages)
    .where(and(eq(reportMessages.reportId, reportId), eq(reportMessages.userId, userId)))
    .orderBy(desc(reportMessages.createdAt))
    .limit(limit);
  return rows.reverse().map((r) => ({
    id: r.id,
    role: r.role as "user" | "assistant",
    content: r.content,
    createdAt: r.createdAt,
  }));
}

/**
 * 跨会话长期记忆：该用户近 30 天其他报告的提问（去重，最新在前）。
 * 用于让追问回答「记得」用户之前关注过什么。
 */
export async function recentUserQuestions(userId: string, excludeReportId: string, limit = 5): Promise<string[]> {
  const db = getDb();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const rows = await db
    .select({ content: reportMessages.content })
    .from(reportMessages)
    .where(
      and(
        eq(reportMessages.userId, userId),
        eq(reportMessages.role, "user"),
        ne(reportMessages.reportId, excludeReportId),
        gte(reportMessages.createdAt, since)
      )
    )
    .orderBy(desc(reportMessages.createdAt))
    .limit(40);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of rows) {
    const c = r.content.trim().slice(0, 60);
    if (!c || seen.has(c)) continue;
    seen.add(c);
    out.push(c);
    if (out.length >= limit) break;
  }
  return out;
}

function clip(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export interface AskReportResult {
  ok: boolean;
  answer?: string;
  error?: string;
}

/** 报告追问：基于已落库报告 + 会话历史 + 跨会话记忆 + 知识库检索生成回答 */
export async function askReport(opts: {
  userId: string;
  reportId: string;
  question: string;
}): Promise<AskReportResult> {
  const question = opts.question.trim().slice(0, 500);
  if (!question) return { ok: false, error: "请输入问题" };

  const db = getDb();
  const [report] = await db
    .select({
      id: reports.id,
      moduleId: reports.moduleId,
      templateReport: reports.templateReport,
      aiReport: reports.aiReport,
      factsJson: reports.factsJson,
    })
    .from(reports)
    .where(and(eq(reports.id, opts.reportId), eq(reports.userId, opts.userId)))
    .limit(1);
  if (!report) return { ok: false, error: "报告不存在或无权访问" };

  const provider = await getActiveProvider("text");
  if (!provider) return { ok: false, error: "AI 功能未启用，请联系管理员" };

  const history = await listReportMessages(opts.userId, opts.reportId, 10);
  const memory = await recentUserQuestions(opts.userId, opts.reportId, 5);
  const knowledge = buildKnowledgeContext(
    `${report.moduleId} ${question}`,
    report.moduleId
  );

  const historyBlock = history.length
    ? history.map((m) => `${m.role === "user" ? "用户" : "助手"}：${clip(m.content, 300)}`).join("\n")
    : "（无）";
  const memoryBlock = memory.length ? memory.map((m, i) => `${i + 1}. ${m}`).join("\n") : "（无）";

  const prompt = `你是传统命理文化解读师。用户正在查看一份已生成的报告，并提出追问。请基于报告内容回答（300字以内，口语化、具体、可执行）。

硬性约束：
1. 只依据「报告内容」「对话历史」「知识库参考」回答；报告没提的信息不要臆造具体断言
2. 与报告结论冲突时，以报告结论为准并说明
3. 合规：不得出现「改运、改命、消灾、破灾、开光、法事、转运」等表述；不得使用「必定、注定、百分之百」等绝对化断语；用「倾向于、往往会、可留意」等趋势措辞
4. 涉及医疗、法律、财务等专业问题，提醒用户咨询专业人士
5. 末尾不要重复免责声明

【用户近期关注（跨报告记忆，供理解上下文，不要主动罗列）】
${memoryBlock}

【本报告对话历史】
${historyBlock}
用户：${question}
${knowledge ? `\n【知识库参考（仅供理论依据）】\n${knowledge}\n` : ""}
【报告内容】
${clip(report.templateReport, 2200)}
${report.aiReport ? `\n【AI 解读】\n${clip(report.aiReport, 1200)}` : ""}`;

  let answer: string;
  try {
    const raw = await provider.complete(prompt, { maxTokens: 800, temperature: 0.6 });
    answer = sanitizeAiText(raw ?? "").trim();
  } catch {
    return { ok: false, error: "AI 服务暂时不可用，请稍后再试" };
  }
  if (!answer) return { ok: false, error: "AI 未返回内容，请稍后再试" };
  // 追问回答为纯对话流，追加简短标识（区别于报告正文的完整标识）
  answer = answer + "\n\n——由 AI 生成，仅供文化娱乐参考";

  const now = new Date().toISOString();
  await db.insert(reportMessages).values([
    { id: crypto.randomUUID(), reportId: opts.reportId, userId: opts.userId, role: "user", content: question, createdAt: now },
    { id: crypto.randomUUID(), reportId: opts.reportId, userId: opts.userId, role: "assistant", content: compliantAiText(answer), createdAt: now },
  ]);

  return { ok: true, answer };
}
