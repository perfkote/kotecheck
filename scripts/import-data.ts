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

    // Convert date strings back to Date objects for each table
    const customersData = data.customers.map((r: any) => ({
      ...r,
      createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
    }));

    const jobsData = data.jobs.map((r: any) => ({
      ...r,
      receivedDate: r.receivedDate ? new Date(r.receivedDate) : undefined,
      completedAt: r.completedAt ? new Date(r.completedAt) : undefined,
      createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
    }));

    const servicesData = data.services.map((r: any) => ({
      ...r,
      createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
    }));

    const estimatesData = data.estimates.map((r: any) => ({
      ...r,
      date: r.date ? new Date(r.date) : undefined,
      desiredFinishDate: r.desiredFinishDate ? new Date(r.desiredFinishDate) : undefined,
      createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
    }));

    const estimateServicesData = data.estimateServices.map((r: any) => ({
      ...r,
      createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
    }));

    const notesData = data.notes.map((r: any) => ({
      ...r,
      createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
    }));

    console.log("📊 Importing data:");
    console.log(`   - ${customersData.length} customers`);
    console.log(`   - ${jobsData.length} jobs`);
    console.log(`   - ${servicesData.length} services`);
    console.log(`   - ${estimatesData.length} estimates`);
    console.log(`   - ${estimateServicesData.length} estimate services`);
    console.log(`   - ${notesData.length} notes\n`);

    console.log("⚠️  Warning: This will add data to your production database.");
    console.log("Starting import in 3 seconds... (Ctrl+C to cancel)\n");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Wrap all inserts in a transaction for atomic import
    await db.transaction(async (tx) => {
      // Import in order to respect foreign key constraints
      if (customersData.length > 0) {
        console.log("Importing customers...");
        await tx.insert(customers).values(customersData);
      }

      if (jobsData.length > 0) {
        console.log("Importing jobs...");
        await tx.insert(jobs).values(jobsData);
      }

      if (servicesData.length > 0) {
        console.log("Importing services...");
        await tx.insert(services).values(servicesData);
      }

      if (estimatesData.length > 0) {
        console.log("Importing estimates...");
        await tx.insert(estimates).values(estimatesData);
      }

      if (estimateServicesData.length > 0) {
        console.log("Importing estimate services...");
        await tx.insert(estimateServices).values(estimateServicesData);
      }

      if (notesData.length > 0) {
        console.log("Importing notes...");
        await tx.insert(notes).values(notesData);
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
