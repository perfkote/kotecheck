import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { customers, jobs, services, estimates, estimateServices, notes } from "../shared/schema";
import * as fs from "fs";
import * as path from "path";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function importData() {
  console.log("🔄 Importing data to production database...\n");

  try {
    const exportPath = path.join(process.cwd(), "database-export.json");
    
    if (!fs.existsSync(exportPath)) {
      console.error("❌ Error: database-export.json not found!");
      console.log("Please run 'npm run export-data' first.");
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

    // Import in order to respect foreign key constraints
    if (data.customers.length > 0) {
      console.log("Importing customers...");
      await db.insert(customers).values(data.customers);
    }

    if (data.jobs.length > 0) {
      console.log("Importing jobs...");
      await db.insert(jobs).values(data.jobs);
    }

    if (data.services.length > 0) {
      console.log("Importing services...");
      await db.insert(services).values(data.services);
    }

    if (data.estimates.length > 0) {
      console.log("Importing estimates...");
      await db.insert(estimates).values(data.estimates);
    }

    if (data.estimateServices.length > 0) {
      console.log("Importing estimate services...");
      await db.insert(estimateServices).values(data.estimateServices);
    }

    if (data.notes.length > 0) {
      console.log("Importing notes...");
      await db.insert(notes).values(data.notes);
    }

    console.log("\n✅ Import complete!");
    console.log("🎉 Your production database now has all your data!");
  } catch (error) {
    console.error("❌ Import failed:", error);
    console.log("\n💡 Tip: If you get a 'duplicate key' error, the data may already exist in production.");
    process.exit(1);
  }
}

importData();
