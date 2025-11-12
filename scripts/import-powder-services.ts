import { db } from "../server/db";
import { services } from "../shared/schema";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

async function importPowderServices() {
  const csvPath = path.join(process.cwd(), "attached_assets", "performance_kote_pricing_1762916624711.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<{ "Item Description": string; "Price ($)": string }>;

  console.log(`Found ${records.length} services to import`);

  for (const record of records) {
    const name = record["Item Description"];
    const priceStr = record["Price ($)"];
    const price = parseFloat(priceStr);

    if (!name || isNaN(price)) {
      console.log(`Skipping invalid record: ${JSON.stringify(record)}`);
      continue;
    }

    try {
      await db.insert(services).values({
        name,
        category: "powder",
        price: price.toString(),
      });
      console.log(`✓ Imported: ${name} - $${price}`);
    } catch (error) {
      console.error(`✗ Failed to import ${name}:`, error);
    }
  }

  console.log("\nImport complete!");
  process.exit(0);
}

importPowderServices().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
