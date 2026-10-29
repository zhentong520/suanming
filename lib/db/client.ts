import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";
import { assertDialectReady } from "./dialect";

export type DbDialect = "sqlite" | "postgres" | "mysql";

function resolveSqlitePath(url: string): string {
  if (url.startsWith("file:")) {
    return url.replace("file:", "");
  }
  return url;
}

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqliteInstance: Database.Database | null = null;

export function getDialect(): DbDialect {
  const dialect = process.env.DATABASE_DIALECT ?? "sqlite";
  if (dialect === "postgres" || dialect === "mysql") return dialect;
  return "sqlite";
}

export function getDb() {
  if (dbInstance) return dbInstance;

  const dialect = getDialect();
  assertDialectReady(dialect);

  const dbUrl = process.env.DATABASE_URL ?? "file:./data/suanming.db";
  const dbPath = path.resolve(process.cwd(), resolveSqlitePath(dbUrl));
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqliteInstance = sqlite;
  dbInstance = drizzle(sqlite, { schema });
  return dbInstance;
}

/** Raw better-sqlite3 handle for atomic transactions. */
export function getSqlite(): Database.Database {
  getDb();
  if (!sqliteInstance) throw new Error("SQLite 未初始化");
  return sqliteInstance;
}

export function resetDbInstance() {
  if (sqliteInstance) {
    sqliteInstance.close();
    sqliteInstance = null;
  }
  dbInstance = null;
}
