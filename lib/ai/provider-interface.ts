export type AIProviderType =
  | "openai"
  | "deepseek"
  | "qwen"
  | "zhipu"
  | "moonshot"
  | "volcengine"
  | "custom";

export interface CompletionOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
  /** 请求超时毫秒数，默认文本 30s / 识图 60s */
  timeoutMs?: number;
}

export type VisionContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface VisionMessage {
  role: "user";
  content: VisionContentPart[];
}

export interface AIProviderConfig {
  id: string;
  type: AIProviderType;
  name: string;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIProvider {
  id: string;
  type: AIProviderType;
  complete(prompt: string, options?: CompletionOptions): Promise<string>;
  completeVision(messages: VisionMessage[], options?: CompletionOptions): Promise<string>;
}

export class StubAIProvider implements AIProvider {
  id: string;
  type: AIProviderType = "custom";

  constructor(id: string) {
    this.id = id;
  }

  async complete(_prompt: string): Promise<string> {
    throw new Error("AI 功能尚未启用，请先在管理后台开启全局 AI 开关并配置模型。");
  }

  async completeVision(_messages: VisionMessage[]): Promise<string> {
    throw new Error("AI 识图功能尚未启用，请先在管理后台开启全局 AI 并配置支持识图的模型。");
  }
}

export function createProvider(config: AIProviderConfig): AIProvider {
  async function requestCompletion(body: Record<string, unknown>, timeoutMs: number) {
    // 方舟 deepseek 系默认开启思考且不支持在响应外单独计费，
    // 思考 token 会挤占 max_tokens 导致输出截断；对报告生成类调用统一关闭
    if (/deepseek/i.test(String(body.model ?? config.modelName))) {
      body.thinking = { type: "disabled" };
    }
    const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      // 防止上游挂起导致请求无限等待；超时后由调用方走模板回退
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      if (/UnsupportedModel/i.test(errText) || /does not support the agent plan/i.test(errText)) {
        throw new Error(
          `当前模型「${String(body.model ?? config.modelName)}」不在火山 Agent Plan（api/plan）支持列表中。` +
            `面相/手请将 VOLC_ARK_VISION_MODEL 改为 doubao-seed-2.0-lite（或 mini/pro），` +
            `勿使用 doubao-1.5-vision-pro。详见 https://www.volcengine.com/docs/82379/2366394`
        );
      }
      throw new Error(`AI 请求失败: ${response.status}${errText ? ` — ${errText.slice(0, 200)}` : ""}`);
    }
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? "";
  }

  return {
    id: config.id,
    type: config.type,
    async complete(prompt: string, options?: CompletionOptions) {
      return requestCompletion({
        model: options?.model ?? config.modelName,
        messages: [{ role: "user", content: prompt }],
        max_tokens: options?.maxTokens ?? config.maxTokens ?? 2048,
        temperature: options?.temperature ?? config.temperature ?? 0.7,
      }, options?.timeoutMs ?? 30_000);
    },
    async completeVision(messages: VisionMessage[], options?: CompletionOptions) {
      return requestCompletion({
        model: options?.model ?? config.modelName,
        messages,
        max_tokens: options?.maxTokens ?? config.maxTokens ?? 2048,
        temperature: options?.temperature ?? config.temperature ?? 0.4,
      }, options?.timeoutMs ?? 60_000);
    },
  };
}
