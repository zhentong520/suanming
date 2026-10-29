export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { seedDatabase } = await import("./lib/db/seed");
    await seedDatabase();
  }
}
