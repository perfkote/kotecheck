import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function initializeAdmin() {
  try {
    if (!process.env.LOCAL_ADMIN_PASSWORD) {
      console.error("Warning: LOCAL_ADMIN_PASSWORD environment variable is not set");
      return;
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
        console.log("✓ Local admin password hash updated");
      } else {
        console.log("✓ Local admin account configured");
      }
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
  } catch (error) {
    console.error("Failed to initialize admin:", error);
  }
}
