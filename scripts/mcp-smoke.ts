import { seedDatabase } from "../lib/db/seed";
import { runModule } from "../lib/hub/divination-router";

async function main() {
  await seedDatabase();
  const r = await runModule({
    module: "bazi",
    birth: {
      calendarType: "solar",
      year: 1990,
      month: 5,
      day: 15,
      hour: 14,
      gender: "男",
    },
    skipAi: true,
  });
  console.log("ok", r.templateReport.slice(0, 200));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
