import { seedDatabase } from "../lib/db/seed";
import fs from "fs";
import path from "path";

function loadEnvFile(filename: string) {
  const full = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(full)) return;
  for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i <= 0) continue;
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

async function main() {
  await seedDatabase();
  console.log("Database seeded successfully.");
  if (process.env.VOLC_ARK_API_KEY) {
    console.log("Volc Ark provider synced from VOLC_ARK_* env.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
