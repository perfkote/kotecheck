import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function initAdmin() {
  try {
    console.log("Checking for local admin account...");
    
    if (!process.env.LOCAL_ADMIN_PASSWORD) {
      console.error("Error: LOCAL_ADMIN_PASSWORD environment variable is required");
      process.exit(1);
    }
    
    // Check if local admin exists
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.isLocalAdmin, 1));
    
    if (existingAdmin) {
      // Update password hash if it doesn't exist (migration from old system)
      if (!existingAdmin.passwordHash) {
        console.log("Updating local admin password hash...");
        const passwordHash = await bcrypt.hash(process.env.LOCAL_ADMIN_PASSWORD, 10);
        await db
          .update(users)
          .set({ passwordHash })
          .where(eq(users.id, existingAdmin.id));
        console.log("✓ Password hash updated");
      }
      console.log("✓ Local admin account already exists");
      console.log(`  Email: ${existingAdmin.email}`);
      console.log(`  Name: ${existingAdmin.firstName} ${existingAdmin.lastName}`);
      return;
    }
    
    // Hash the password
    const passwordHash = await bcrypt.hash(process.env.LOCAL_ADMIN_PASSWORD, 10);
    
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
        passwordHash,
      })
      .returning();
    
    console.log("✓ Local admin account created successfully!");
    console.log(`  Email: ${admin.email}`);
    console.log(`  Name: ${admin.firstName} ${admin.lastName}`);
    console.log(`  Login with: username='admin', password='<from LOCAL_ADMIN_PASSWORD>'`);
  } catch (error) {
    console.error("Failed to initialize admin:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

initAdmin();
