import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

function resolveSqlitePath(url: string): string {
  if (url.startsWith("file:")) return url.replace("file:", "");
  return url;
}

export function runMigrations() {
  const dbUrl = process.env.DATABASE_URL ?? "file:./data/suanming.db";
  const dbPath = path.resolve(process.cwd(), resolveSqlitePath(dbUrl));
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT,
      gender TEXT NOT NULL DEFAULT 'unknown',
      calendar_type TEXT NOT NULL DEFAULT 'solar',
      birth_year INTEGER NOT NULL,
      birth_month INTEGER NOT NULL,
      birth_day INTEGER NOT NULL,
      birth_hour INTEGER,
      birth_minute INTEGER DEFAULT 0,
      timezone TEXT DEFAULT 'Asia/Shanghai',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      profile_id TEXT,
      module_id TEXT NOT NULL,
      facts_json TEXT NOT NULL,
      template_report TEXT NOT NULL,
      ai_report TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      profile_id_a TEXT NOT NULL,
      profile_id_b TEXT NOT NULL,
      score INTEGER NOT NULL,
      details_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS modules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      priority TEXT NOT NULL DEFAULT 'P2',
      enabled INTEGER NOT NULL DEFAULT 0,
      show_on_home INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      implemented INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS ai_providers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      provider_type TEXT NOT NULL,
      base_url TEXT NOT NULL,
      api_key_encrypted TEXT NOT NULL,
      model_name TEXT NOT NULL,
      max_tokens INTEGER DEFAULT 2048,
      temperature REAL DEFAULT 0.7,
      is_active INTEGER NOT NULL DEFAULT 1,
      priority INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_module_switches (
      module_id TEXT PRIMARY KEY,
      ai_enabled INTEGER NOT NULL DEFAULT 0,
      fallback_to_template INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS ai_global_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS content_items (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      key TEXT NOT NULL,
      title TEXT,
      body TEXT NOT NULL,
      metadata_json TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS module_stats (
      module_id TEXT PRIMARY KEY,
      call_count INTEGER NOT NULL DEFAULT 0,
      today_count INTEGER NOT NULL DEFAULT 0,
      last_called_at TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      active_profile_id TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'active',
      points_balance INTEGER NOT NULL DEFAULT 0,
      ai_quota_used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_operations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      module_id TEXT,
      profile_id TEXT,
      metadata_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS point_ledger (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      delta INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      reason TEXT NOT NULL,
      ref_type TEXT,
      ref_id TEXT,
      meta_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payment_orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      amount_yuan REAL NOT NULL,
      points INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      external_trade_no TEXT,
      meta_json TEXT,
      created_at TEXT NOT NULL,
      paid_at TEXT
    );
  `);

  runColumnMigrations(db);
  db.close();
}

function runColumnMigrations(db: Database.Database) {
  const profileCols = db.prepare("PRAGMA table_info(profiles)").all() as Array<{ name: string }>;
  if (!profileCols.some((c) => c.name === "user_id")) {
    db.exec("ALTER TABLE profiles ADD COLUMN user_id TEXT");
  }
  const reportCols = db.prepare("PRAGMA table_info(reports)").all() as Array<{ name: string }>;
  if (!reportCols.some((c) => c.name === "user_id")) {
    db.exec("ALTER TABLE reports ADD COLUMN user_id TEXT");
  }
  const userCols = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
  if (!userCols.some((c) => c.name === "role")) {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
  }
  if (!userCols.some((c) => c.name === "ai_quota_used")) {
    db.exec("ALTER TABLE users ADD COLUMN ai_quota_used INTEGER NOT NULL DEFAULT 0");
  }
  if (!userCols.some((c) => c.name === "status")) {
    db.exec("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active'");
  }
  if (!userCols.some((c) => c.name === "points_balance")) {
    db.exec("ALTER TABLE users ADD COLUMN points_balance INTEGER NOT NULL DEFAULT 0");
  }
  if (!reportCols.some((c) => c.name === "points_spent")) {
    db.exec("ALTER TABLE reports ADD COLUMN points_spent INTEGER NOT NULL DEFAULT 0");
  }
  if (!profileCols.some((c) => c.name === "birth_longitude")) {
    db.exec("ALTER TABLE profiles ADD COLUMN birth_longitude REAL");
  }
  if (!profileCols.some((c) => c.name === "birth_latitude")) {
    db.exec("ALTER TABLE profiles ADD COLUMN birth_latitude REAL");
  }
  if (!profileCols.some((c) => c.name === "birth_location")) {
    db.exec("ALTER TABLE profiles ADD COLUMN birth_location TEXT");
  }

  const userCols2 = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
  if (!userCols2.some((c) => c.name === "allow_life_insights")) {
    db.exec("ALTER TABLE users ADD COLUMN allow_life_insights INTEGER NOT NULL DEFAULT 0");
  }
  const reportCols2 = db.prepare("PRAGMA table_info(reports)").all() as Array<{ name: string }>;
  if (!reportCols2.some((c) => c.name === "life_insights_unlocked")) {
    db.exec("ALTER TABLE reports ADD COLUMN life_insights_unlocked INTEGER NOT NULL DEFAULT 0");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS point_ledger (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      delta INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      reason TEXT NOT NULL,
      ref_type TEXT,
      ref_id TEXT,
      meta_json TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS payment_orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      amount_yuan REAL NOT NULL,
      points INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      external_trade_no TEXT,
      meta_json TEXT,
      created_at TEXT NOT NULL,
      paid_at TEXT
    );
  `);
}
