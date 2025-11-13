import { sql } from "drizzle-orm";
import { pgTable, text, varchar, numeric, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
// Reference: blueprint:javascript_log_in_with_replit
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with simple username/password authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").notNull().unique(),
  passwordHash: varchar("password_hash").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  projectList: text("project_list"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackingId: text("tracking_id").notNull(),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "set null" }),
  phoneNumber: text("phone_number").notNull(),
  receivedDate: timestamp("received_date").notNull().defaultNow(),
  coatingType: text("coating_type"),
  items: text("items"),
  detailedNotes: text("detailed_notes"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("received"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const estimates = pgTable("estimates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  serviceType: text("service_type").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  desiredFinishDate: timestamp("desired_finish_date"),
  notes: text("notes"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const estimateServices = pgTable("estimate_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  estimateId: varchar("estimate_id").notNull().references(() => estimates.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").notNull().references(() => services.id),
  serviceName: text("service_name").notNull(),
  servicePrice: numeric("service_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const jobServices = pgTable("job_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").notNull().references(() => services.id),
  serviceName: text("service_name").notNull(),
  servicePrice: numeric("service_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").references(() => jobs.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "set null" }),
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
  coatingType: z.enum(["powder", "ceramic", "misc"]).optional(),
  price: z.union([z.string(), z.number()]).pipe(z.coerce.number().min(0, "Price must be 0 or greater")),
});

// API schema for creating jobs with multiple services
export const createJobSchema = insertJobSchema.omit({ customerId: true, price: true }).extend({
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  serviceIds: z.array(z.string()).min(1, "At least one service is required"),
  price: z.union([z.string(), z.number()]).pipe(z.coerce.number().min(0)).optional(),
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
}).extend({
  category: z.enum(["powder", "ceramic", "prep"]),
  price: z.union([z.string(), z.number()]).pipe(z.coerce.number().min(0, "Price must be 0 or greater")),
});

export const insertEstimateSchema = createInsertSchema(estimates).omit({
  id: true,
  createdAt: true,
}).extend({
  serviceType: z.enum(["powder", "ceramic", "misc"]),
  date: z.coerce.date().optional(),
  desiredFinishDate: z.coerce.date().optional(),
});

export const insertEstimateServiceSchema = createInsertSchema(estimateServices).omit({
  id: true,
  createdAt: true,
});

export const insertJobServiceSchema = createInsertSchema(jobServices).omit({
  id: true,
  createdAt: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
});

// API schema for updating jobs with service mutations
export const updateJobSchema = insertJobSchema.partial().extend({
  serviceIds: z.array(z.string()).optional(),
  price: z.union([z.string(), z.number()]).pipe(z.coerce.number().min(0)).optional(),
});

// Add validation to createJobSchema for customer selection
export const createJobSchemaWithValidation = createJobSchema.superRefine((data, ctx) => {
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
export type CreateJobInput = z.infer<typeof createJobSchemaWithValidation>;

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

export type InsertEstimate = z.infer<typeof insertEstimateSchema>;
export type Estimate = typeof estimates.$inferSelect;

export type InsertEstimateService = z.infer<typeof insertEstimateServiceSchema>;
export type EstimateService = typeof estimateServices.$inferSelect;

export type InsertJobService = z.infer<typeof insertJobServiceSchema>;
export type JobService = typeof jobServices.$inferSelect;

export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;

// User types for simple username/password authentication
// API layer schema (for validating incoming requests with password)
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "manager"]).default("admin"),
}).omit({
  passwordHash: true,
});

// Storage layer schema (for creating users with hashed password)
export const newUserInsertSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const sessionUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  role: z.enum(["admin", "manager"]),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type NewUserInsert = z.infer<typeof newUserInsertSchema>;
export type User = typeof users.$inferSelect;
export type SessionUser = z.infer<typeof sessionUserSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
