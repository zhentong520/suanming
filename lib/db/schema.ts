import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  phone: text("phone").unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  activeProfileId: text("active_profile_id"),
  role: text("role").notNull().default("user"),
  status: text("status").notNull().default("active"),
  pointsBalance: integer("points_balance").notNull().default(0),
  aiQuotaUsed: integer("ai_quota_used").notNull().default(0),
  /** 是否允许积分解锁「人生洞察」（流年/六亲等） */
  allowLifeInsights: integer("allow_life_insights", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const pointLedger = sqliteTable("point_ledger", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  delta: integer("delta").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  reason: text("reason").notNull(),
  refType: text("ref_type"),
  refId: text("ref_id"),
  metaJson: text("meta_json"),
  createdAt: text("created_at").notNull(),
});

export const paymentOrders = sqliteTable("payment_orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  channel: text("channel").notNull(),
  amountYuan: real("amount_yuan").notNull(),
  points: integer("points").notNull(),
  status: text("status").notNull().default("pending"),
  externalTradeNo: text("external_trade_no"),
  metaJson: text("meta_json"),
  createdAt: text("created_at").notNull(),
  paidAt: text("paid_at"),
});

export const userOperations = sqliteTable("user_operations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  action: text("action").notNull(),
  moduleId: text("module_id"),
  profileId: text("profile_id"),
  metadataJson: text("metadata_json"),
  createdAt: text("created_at").notNull(),
});

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  name: text("name"),
  gender: text("gender").notNull().default("unknown"),
  calendarType: text("calendar_type").notNull().default("solar"),
  birthYear: integer("birth_year").notNull(),
  birthMonth: integer("birth_month").notNull(),
  birthDay: integer("birth_day").notNull(),
  birthHour: integer("birth_hour"),
  birthMinute: integer("birth_minute").default(0),
  timezone: text("timezone").default("Asia/Shanghai"),
  birthLongitude: real("birth_longitude"),
  birthLatitude: real("birth_latitude"),
  birthLocation: text("birth_location"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  profileId: text("profile_id"),
  moduleId: text("module_id").notNull(),
  factsJson: text("facts_json").notNull(),
  templateReport: text("template_report").notNull(),
  aiReport: text("ai_report"),
  pointsSpent: integer("points_spent").notNull().default(0),
  /** 客户是否已积分解锁本报告人生洞察 */
  lifeInsightsUnlocked: integer("life_insights_unlocked", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const matches = sqliteTable("matches", {
  id: text("id").primaryKey(),
  profileIdA: text("profile_id_a").notNull(),
  profileIdB: text("profile_id_b").notNull(),
  score: integer("score").notNull(),
  detailsJson: text("details_json").notNull(),
  createdAt: text("created_at").notNull(),
});

export const modules = sqliteTable("modules", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("P2"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  showOnHome: integer("show_on_home", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  implemented: integer("implemented", { mode: "boolean" }).notNull().default(false),
});

export const aiProviders = sqliteTable("ai_providers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  providerType: text("provider_type").notNull(),
  baseUrl: text("base_url").notNull(),
  apiKeyEncrypted: text("api_key_encrypted").notNull(),
  modelName: text("model_name").notNull(),
  maxTokens: integer("max_tokens").default(2048),
  temperature: real("temperature").default(0.7),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  priority: integer("priority").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const aiModuleSwitches = sqliteTable("ai_module_switches", {
  moduleId: text("module_id").primaryKey(),
  aiEnabled: integer("ai_enabled", { mode: "boolean" }).notNull().default(false),
  fallbackToTemplate: integer("fallback_to_template", { mode: "boolean" }).notNull().default(true),
});

export const aiGlobalSettings = sqliteTable("ai_global_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const contentItems = sqliteTable("content_items", {
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  key: text("key").notNull(),
  title: text("title"),
  body: text("body").notNull(),
  metadataJson: text("metadata_json"),
  updatedAt: text("updated_at").notNull(),
});

export const adminUsers = sqliteTable("admin_users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: text("created_at").notNull(),
});

export const moduleStats = sqliteTable("module_stats", {
  moduleId: text("module_id").primaryKey(),
  callCount: integer("call_count").notNull().default(0),
  todayCount: integer("today_count").notNull().default(0),
  lastCalledAt: text("last_called_at"),
});

export type Profile = typeof profiles.$inferSelect;
export type User = typeof users.$inferSelect;
export type UserOperation = typeof userOperations.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type AiProvider = typeof aiProviders.$inferSelect;
