import { getDialect } from "./client";

export interface DatabaseConfig {
  dialect: "sqlite" | "postgres" | "mysql";
  url: string;
}

export function getDatabaseConfig(): DatabaseConfig {
  return {
    dialect: getDialect(),
    url: process.env.DATABASE_URL ?? "file:./data/suanming.db",
  };
}

/**
 * Multi-dialect notes:
 * - SQLite is production-ready today via better-sqlite3.
 * - Postgres/MySQL: install `postgres` or `mysql2`, extend `getDb()` in client.ts,
 *   and map schema with drizzle dialect packages. Until then getDb() refuses non-sqlite.
 */
export function getSupportedDialects(): string[] {
  return ["sqlite", "postgres", "mysql"];
}

export function isDialectSupported(dialect: string): boolean {
  return getSupportedDialects().includes(dialect);
}

export function assertDialectReady(dialect: string): void {
  if (dialect !== "sqlite") {
    throw new Error(
      `数据库方言「${dialect}」尚未接入运行时。请保持 DATABASE_DIALECT=sqlite，或按 lib/db/client.ts 注释扩展 Postgres/MySQL。`
    );
  }
}
