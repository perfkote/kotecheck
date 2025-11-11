import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { customers, jobs, services, estimates, estimateServices, notes } from "../shared/schema";
import ws from "ws";
import * as fs from "fs";
import * as path from "path";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.error("❌ Error: DATABASE_URL environment variable is not set!");
  console.log("Please set DATABASE_URL to your production database connection string.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

async function importData() {
  console.log("🔄 Importing data to production database...\n");

  try {
    const exportPath = path.join(process.cwd(), "database-export.json");
    
    if (!fs.existsSync(exportPath)) {
      console.error("❌ Error: database-export.json not found!");
      console.log("Please run 'npx tsx scripts/export-data.ts' first.");
      process.exit(1);
    }

    const fileContent = fs.readFileSync(exportPath, "utf-8");
    const data = JSON.parse(fileContent);

    console.log("📊 Importing data:");
    console.log(`   - ${data.customers.length} customers`);
    console.log(`   - ${data.jobs.length} jobs`);
    console.log(`   - ${data.services.length} services`);
    console.log(`   - ${data.estimates.length} estimates`);
    console.log(`   - ${data.estimateServices.length} estimate services`);
    console.log(`   - ${data.notes.length} notes\n`);

    console.log("⚠️  Warning: This will add data to your production database.");
    console.log("Starting import in 3 seconds... (Ctrl+C to cancel)\n");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Wrap all inserts in a transaction for atomic import
    await db.transaction(async (tx) => {
      // Import in order to respect foreign key constraints
      if (data.customers.length > 0) {
        console.log("Importing customers...");
        await tx.insert(customers).values(data.customers);
      }

      if (data.jobs.length > 0) {
        console.log("Importing jobs...");
        await tx.insert(jobs).values(data.jobs);
      }

      if (data.services.length > 0) {
        console.log("Importing services...");
        await tx.insert(services).values(data.services);
      }

      if (data.estimates.length > 0) {
        console.log("Importing estimates...");
        await tx.insert(estimates).values(data.estimates);
      }

      if (data.estimateServices.length > 0) {
        console.log("Importing estimate services...");
        await tx.insert(estimateServices).values(data.estimateServices);
      }

      if (data.notes.length > 0) {
        console.log("Importing notes...");
        await tx.insert(notes).values(data.notes);
      }
    });

    console.log("\n✅ Import complete!");
    console.log("🎉 Your production database now has all your data!");
  } catch (error) {
    console.error("❌ Import failed:", error);
    console.log("\n💡 All changes have been rolled back - your production database is unchanged.");
    console.log("\n💡 Common issues:");
    console.log("   - Duplicate key error: Data may already exist in production");
    console.log("   - Connection error: Check your DATABASE_URL is correct");
    process.exit(1);
  } finally {
    await pool.end();
  }
}

importData();
