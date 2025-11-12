import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function initAdmin() {
  try {
    console.log("Checking for local admin account...");
    
    // Check if local admin exists
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.isLocalAdmin, 1));
    
    if (existingAdmin) {
      console.log("✓ Local admin account already exists");
      console.log(`  Email: ${existingAdmin.email}`);
      console.log(`  Name: ${existingAdmin.firstName} ${existingAdmin.lastName}`);
      return;
    }
    
    // Create local admin account
    console.log("Creating local admin account...");
    const [admin] = await db
      .insert(users)
      .values({
        id: "local-admin",
        email: "admin@coatcheck.local",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        isLocalAdmin: 1,
      })
      .returning();
    
    console.log("✓ Local admin account created successfully!");
    console.log(`  Email: ${admin.email}`);
    console.log(`  Name: ${admin.firstName} ${admin.lastName}`);
    console.log(`  Login with: username='admin', password='${process.env.LOCAL_ADMIN_PASSWORD}'`);
  } catch (error) {
    console.error("Failed to initialize admin:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

initAdmin();
