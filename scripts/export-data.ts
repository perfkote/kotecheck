import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { customers, jobs, services, estimates, estimateServices, notes } from "../shared/schema";
import ws from "ws";
import * as fs from "fs";
import * as path from "path";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.error("❌ Error: DATABASE_URL environment variable is not set!");
  console.log("Please ensure DATABASE_URL is configured.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

async function exportData() {
  console.log("🔄 Exporting data from development database...\n");

  try {
    const allCustomers = await db.select().from(customers);
    const allJobs = await db.select().from(jobs);
    const allServices = await db.select().from(services);
    const allEstimates = await db.select().from(estimates);
    const allEstimateServices = await db.select().from(estimateServices);
    const allNotes = await db.select().from(notes);

    const data = {
      customers: allCustomers,
      jobs: allJobs,
      services: allServices,
      estimates: allEstimates,
      estimateServices: allEstimateServices,
      notes: allNotes,
    };

    const exportPath = path.join(process.cwd(), "database-export.json");
    fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));

    console.log("✅ Export complete!\n");
    console.log("📊 Exported data:");
    console.log(`   - ${allCustomers.length} customers`);
    console.log(`   - ${allJobs.length} jobs`);
    console.log(`   - ${allServices.length} services`);
    console.log(`   - ${allEstimates.length} estimates`);
    console.log(`   - ${allEstimateServices.length} estimate services`);
    console.log(`   - ${allNotes.length} notes`);
    console.log(`\n📁 Saved to: ${exportPath}`);
    console.log("\n📝 Next steps:");
    console.log("   1. Get your production DATABASE_URL from Replit's database pane");
    console.log("   2. Run: DATABASE_URL='your-prod-url' npx tsx scripts/import-data.ts");
    console.log("\n⚠️  Important: Make sure you use your PRODUCTION database URL, not development!");
  } catch (error) {
    console.error("❌ Export failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

exportData();
