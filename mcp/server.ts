/**
 * 易道命理 DivinationHub MCP Server（stdio）
 *
 * Cursor / Claude Desktop 配置示例见 docs/mcp.md
 * 启动：npm run mcp
 */
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { seedDatabase } from "../lib/db/seed";
import { MODULE_DEFINITIONS, getModuleDefinition } from "../lib/hub/module-registry";
import { runModule } from "../lib/hub/divination-router";
import type { BirthInput } from "../lib/engine/calendar";

const BirthSchema = z.object({
  calendarType: z.enum(["solar", "lunar"]).default("solar"),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  hour: z.number().int().min(0).max(23).nullable().optional(),
  minute: z.number().int().min(0).max(59).optional(),
  gender: z.string().optional(),
});

async function main() {
  await seedDatabase();

  const server = new McpServer({
    name: "suanming-divination-hub",
    version: "0.1.0",
  });

  server.registerTool(
    "list_modules",
    {
      title: "列出术数模块",
      description: "列出易道命理全部测算模块（id、名称、分类、是否需要出生档案）",
      inputSchema: {
        category: z.enum(["命", "卜", "相", "术"]).optional().describe("按分类筛选"),
        implementedOnly: z.boolean().optional().describe("仅已实现模块，默认 true"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ category, implementedOnly = true }) => {
      let list = MODULE_DEFINITIONS;
      if (implementedOnly) list = list.filter((m) => m.implemented);
      if (category) list = list.filter((m) => m.category === category);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              list.map((m) => ({
                id: m.id,
                name: m.name,
                category: m.category,
                description: m.description,
                requiresProfile: m.requiresProfile,
                path: m.path,
              })),
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.registerTool(
    "get_module",
    {
      title: "模块详情",
      description: "查看单个术数模块定义",
      inputSchema: {
        moduleId: z.string().describe("模块 id，如 bazi、ziwei、yijing"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ moduleId }) => {
      const def = getModuleDefinition(moduleId);
      if (!def) {
        return { content: [{ type: "text", text: `未知模块: ${moduleId}` }], isError: true };
      }
      return { content: [{ type: "text", text: JSON.stringify(def, null, 2) }] };
    }
  );

  server.registerTool(
    "run_divination",
    {
      title: "执行测算",
      description:
        "调用 DivinationHub 运行指定模块。需要档案的模块请传 birth（出生信息）；无需档案的可只传 module + params。结果含 templateReport，可选 AI（默认关闭以免消耗配额）。",
      inputSchema: {
        module: z.string().describe("模块 id"),
        birth: BirthSchema.optional().describe("出生信息（requiresProfile 模块必填）"),
        params: z.record(z.string(), z.unknown()).optional().describe("模块参数，如 name、question、keyword"),
        enableAi: z.boolean().optional().describe("是否调用 AI 解读，默认 false"),
        userId: z.string().optional().describe("可选用户 id（启用 AI 且要计配额时传入）"),
      },
    },
    async ({ module, birth, params, enableAi, userId }) => {
      const def = getModuleDefinition(module);
      if (!def) {
        return { content: [{ type: "text", text: `未知模块: ${module}` }], isError: true };
      }
      if (def.requiresProfile && !birth) {
        return {
          content: [
            {
              type: "text",
              text: `模块「${def.name}」需要 birth 出生信息（calendarType/year/month/day/hour/gender）`,
            },
          ],
          isError: true,
        };
      }

      try {
        const result = await runModule({
          module,
          birth: birth as BirthInput | undefined,
          params: params ?? {},
          skipAi: !enableAi,
          userId: enableAi ? userId : undefined,
        });

        const payload = {
          module: result.module,
          templateReport: result.templateReport,
          aiReport: result.aiReport ?? null,
          scores: result.scores ?? null,
          caveats: result.caveats,
          factsPreview: summarizeFacts(result.facts),
        };

        return {
          content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        };
      } catch (e) {
        return {
          content: [{ type: "text", text: e instanceof Error ? e.message : "测算失败" }],
          isError: true,
        };
      }
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function summarizeFacts(facts: Record<string, unknown>) {
  const keys = Object.keys(facts).slice(0, 24);
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    const v = facts[k];
    if (v == null) continue;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") out[k] = v;
    else if (Array.isArray(v)) out[k] = `array(${v.length})`;
    else out[k] = "object";
  }
  return out;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
