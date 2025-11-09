import { sql } from "drizzle-orm";
import { pgTable, text, varchar, numeric, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackingId: text("tracking_id").notNull(),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  phoneNumber: text("phone_number").notNull(),
  receivedDate: timestamp("received_date").notNull().defaultNow(),
  coatingType: text("coating_type").notNull(),
  detailedNotes: text("detailed_notes"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const estimates = pgTable("estimates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").references(() => jobs.id),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  title: text("title").notNull(),
  description: text("description"),
  items: text("items").notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: numeric("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").references(() => jobs.id),
  customerId: varchar("customer_id").references(() => customers.id),
  content: text("content").notNull(),
  author: text("author").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  trackingId: true,
  createdAt: true,
}).extend({
  receivedDate: z.coerce.date().optional(),
  coatingType: z.enum(["powder", "ceramic", "both"]),
  price: z.union([z.string(), z.number()]).pipe(z.coerce.number().min(0, "Price must be 0 or greater")),
});

export const insertEstimateSchema = createInsertSchema(estimates).omit({
  id: true,
  createdAt: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
});

// Extended schema for creating jobs with optional new customer
export const createJobWithCustomerSchema = insertJobSchema
  .omit({ customerId: true })
  .extend({
    // Make customerId optional for new customer creation
    customerId: z.string().optional(),
    // Allow creating a new customer inline
    customerName: z.string().optional(),
    customerEmail: z.string().email().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
  // Trim string fields
  if (data.customerName) {
    data.customerName = data.customerName.trim();
  }
  if (data.customerEmail) {
    data.customerEmail = data.customerEmail.trim();
  }
  
  // Enforce XOR: either customerId OR customerName, not both
  const hasCustomerId = Boolean(data.customerId);
  const hasCustomerName = Boolean(data.customerName && data.customerName.length > 0);
  
  if (!hasCustomerId && !hasCustomerName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Either select an existing customer or provide a new customer name",
      path: ["customerId"],
    });
  }
  
  if (hasCustomerId && hasCustomerName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Cannot provide both an existing customer ID and a new customer name",
      path: ["customerId"],
    });
  }
  
  // If creating a new customer, require a non-empty name
  if (hasCustomerName && data.customerName!.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Customer name cannot be empty",
      path: ["customerName"],
    });
  }
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;
export type CreateJobWithCustomer = z.infer<typeof createJobWithCustomerSchema>;

export type InsertEstimate = z.infer<typeof insertEstimateSchema>;
export type Estimate = typeof estimates.$inferSelect;

export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;
