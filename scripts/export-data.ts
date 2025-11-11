import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { customers, jobs, services, estimates, estimateServices, notes } from "../shared/schema";
import * as fs from "fs";
import * as path from "path";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

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
    console.log("   1. Download the database-export.json file");
    console.log("   2. Switch DATABASE_URL to your production database");
    console.log("   3. Run: npm run import-data");
  } catch (error) {
    console.error("❌ Export failed:", error);
    process.exit(1);
  }
}

exportData();
