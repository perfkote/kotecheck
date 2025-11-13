import { eq, desc, sql } from "drizzle-orm";
import { db } from "./db";
import { 
  customers,
  jobs,
  services,
  estimates,
  estimateServices,
  notes,
  users,
  type Customer, 
  type InsertCustomer, 
  type Job, 
  type InsertJob,
  type Service,
  type InsertService,
  type Estimate, 
  type InsertEstimate,
  type EstimateService,
  type InsertEstimateService,
  type Note, 
  type InsertNote,
  type User,
  type NewUserInsert
} from "@shared/schema";

export interface CustomerWithMetrics extends Customer {
  totalSpent: number;
  activeJobsCount: number;
  totalJobsCount: number;
}

export interface PopularService {
  serviceId: string | null;
  serviceName: string;
  usageCount: number;
}

export interface IStorage {
  getCustomer(id: string): Promise<Customer | undefined>;
  getAllCustomers(): Promise<Customer[]>;
  getCustomersWithMetrics(): Promise<CustomerWithMetrics[]>;
  findCustomerByName(name: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;

  getJob(id: string): Promise<Job | undefined>;
  getAllJobs(): Promise<Job[]>;
  getJobsByCustomerId(customerId: string): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, job: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: string): Promise<boolean>;

  getService(id: string): Promise<Service | undefined>;
  getAllServices(): Promise<Service[]>;
  getServicesByCategory(category: string): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string): Promise<boolean>;
  getMostPopularService(): Promise<PopularService | null>;

  getEstimate(id: string): Promise<Estimate | undefined>;
  getAllEstimates(): Promise<Estimate[]>;
  createEstimate(estimate: InsertEstimate): Promise<Estimate>;
  updateEstimate(id: string, estimate: Partial<InsertEstimate>): Promise<Estimate | undefined>;
  deleteEstimate(id: string): Promise<boolean>;

  getEstimateServices(estimateId: string): Promise<EstimateService[]>;
  addEstimateService(estimateService: InsertEstimateService): Promise<EstimateService>;
  removeEstimateService(id: string): Promise<boolean>;

  getNote(id: string): Promise<Note | undefined>;
  getAllNotes(): Promise<Note[]>;
  getNotesByJobId(jobId: string): Promise<Note[]>;
  getNotesByCustomerId(customerId: string): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  deleteNote(id: string): Promise<boolean>;

  // User operations - Simple username/password authentication
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: NewUserInsert): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  async getCustomersWithMetrics(): Promise<CustomerWithMetrics[]> {
    const rows = await db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        address: customers.address,
        projectList: customers.projectList,
        createdAt: customers.createdAt,
        totalSpent: sql<string>`coalesce(sum(${jobs.price}), '0')`,
        activeJobsCount: sql<number>`coalesce(sum(case when ${jobs.status} IN ('received', 'prepped', 'coated', 'finished') then 1 else 0 end), 0)`,
        totalJobsCount: sql<number>`count(${jobs.id})`,
      })
      .from(customers)
      .leftJoin(jobs, eq(jobs.customerId, customers.id))
      .groupBy(customers.id, customers.name, customers.email, customers.phone, customers.address, customers.projectList, customers.createdAt);

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      projectList: row.projectList,
      createdAt: row.createdAt,
      totalSpent: parseFloat(row.totalSpent) || 0,
      activeJobsCount: Number(row.activeJobsCount) || 0,
      totalJobsCount: Number(row.totalJobsCount) || 0,
    }));
  }

  async findCustomerByName(name: string): Promise<Customer | undefined> {
    const normalizedName = name.trim().toLowerCase();
    const allCustomers = await db.select().from(customers);
    const customer = allCustomers.find(c => c.name.toLowerCase() === normalizedName);
    return customer || undefined;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values(insertCustomer)
      .returning();
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db
      .update(customers)
      .set(updates)
      .where(eq(customers.id, id))
      .returning();
    return customer || undefined;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getJob(id: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || undefined;
  }

  async getAllJobs(): Promise<Job[]> {
    return await db.select().from(jobs);
  }

  async getJobsByCustomerId(customerId: string): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.customerId, customerId));
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    // Generate tracking ID based on MAX existing tracking ID to ensure uniqueness
    const allJobs = await db.select().from(jobs);
    let maxNumber = 0;
    
    // Find the highest tracking number
    for (const job of allJobs) {
      const match = job.trackingId.match(/JOB-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }
    
    const jobNumber = maxNumber + 1;
    const trackingId = `JOB-${jobNumber.toString().padStart(4, '0')}`;
    
    const [job] = await db
      .insert(jobs)
      .values({
        ...insertJob,
        trackingId,
        price: insertJob.price.toString(),
      })
      .returning();
    return job;
  }

  async updateJob(id: string, updates: Partial<InsertJob>): Promise<Job | undefined> {
    const { price, ...rest } = updates;
    const dbUpdates: any = {
      ...rest,
      ...(price !== undefined && { price: price.toString() }),
    };
    
    // Only update completedAt when status actually changes
    if (updates.status) {
      // Fetch current job to check for status transition
      const [currentJob] = await db.select().from(jobs).where(eq(jobs.id, id));
      
      if (currentJob) {
        // Transitioning TO paid: set completedAt if not already set
        if (updates.status === "paid" && currentJob.status !== "paid") {
          dbUpdates.completedAt = new Date();
        }
        // Transitioning AWAY FROM paid: clear completedAt
        else if (updates.status !== "paid" && currentJob.status === "paid") {
          dbUpdates.completedAt = null;
        }
      }
    }
    
    const [job] = await db
      .update(jobs)
      .set(dbUpdates)
      .where(eq(jobs.id, id))
      .returning();
    return job || undefined;
  }

  async deleteJob(id: string): Promise<boolean> {
    const result = await db.delete(jobs).where(eq(jobs.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async getAllServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async getServicesByCategory(category: string): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.category, category));
  }

  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db
      .insert(services)
      .values({
        ...insertService,
        price: insertService.price.toString(),
      })
      .returning();
    return service;
  }

  async updateService(id: string, updates: Partial<InsertService>): Promise<Service | undefined> {
    const { price, ...rest } = updates;
    const dbUpdates = {
      ...rest,
      ...(price !== undefined && { price: price.toString() }),
    };
    const [service] = await db
      .update(services)
      .set(dbUpdates)
      .where(eq(services.id, id))
      .returning();
    return service || undefined;
  }

  async deleteService(id: string): Promise<boolean> {
    const result = await db.delete(services).where(eq(services.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getMostPopularService(): Promise<PopularService | null> {
    const [row] = await db
      .select({
        serviceId: services.id,
        serviceName: sql<string>`coalesce(${services.name}, ${estimateServices.serviceName})`,
        usageCount: sql<number>`coalesce(sum(${estimateServices.quantity}), 0)`,
      })
      .from(estimateServices)
      .leftJoin(services, eq(estimateServices.serviceId, services.id))
      .groupBy(services.id, services.name, estimateServices.serviceName)
      .orderBy(desc(sql`coalesce(sum(${estimateServices.quantity}), 0)`))
      .limit(1);

    if (!row || row.usageCount === 0 || !row.serviceName) {
      return null;
    }

    return {
      serviceId: row.serviceId,
      serviceName: row.serviceName,
      usageCount: Number(row.usageCount),
    };
  }

  async getEstimate(id: string): Promise<Estimate | undefined> {
    const [estimate] = await db.select().from(estimates).where(eq(estimates.id, id));
    return estimate || undefined;
  }

  async getAllEstimates(): Promise<Estimate[]> {
    return await db.select().from(estimates);
  }

  async createEstimate(insertEstimate: InsertEstimate): Promise<Estimate> {
    const [estimate] = await db
      .insert(estimates)
      .values(insertEstimate)
      .returning();
    return estimate;
  }

  async updateEstimate(id: string, updates: Partial<InsertEstimate>): Promise<Estimate | undefined> {
    const [estimate] = await db
      .update(estimates)
      .set(updates)
      .where(eq(estimates.id, id))
      .returning();
    return estimate || undefined;
  }

  async deleteEstimate(id: string): Promise<boolean> {
    const result = await db.delete(estimates).where(eq(estimates.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getEstimateServices(estimateId: string): Promise<EstimateService[]> {
    return await db.select().from(estimateServices).where(eq(estimateServices.estimateId, estimateId));
  }

  async addEstimateService(insertEstimateService: InsertEstimateService): Promise<EstimateService> {
    const [estimateService] = await db
      .insert(estimateServices)
      .values({
        ...insertEstimateService,
        servicePrice: insertEstimateService.servicePrice.toString(),
      })
      .returning();
    return estimateService;
  }

  async removeEstimateService(id: string): Promise<boolean> {
    const result = await db.delete(estimateServices).where(eq(estimateServices.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getNote(id: string): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note || undefined;
  }

  async getAllNotes(): Promise<Note[]> {
    return await db.select().from(notes);
  }

  async getNotesByJobId(jobId: string): Promise<Note[]> {
    return await db.select().from(notes).where(eq(notes.jobId, jobId));
  }

  async getNotesByCustomerId(customerId: string): Promise<Note[]> {
    return await db.select().from(notes).where(eq(notes.customerId, customerId));
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const [note] = await db
      .insert(notes)
      .values(insertNote)
      .returning();
    return note;
  }

  async deleteNote(id: string): Promise<boolean> {
    const result = await db.delete(notes).where(eq(notes.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // User operations - Simple username/password authentication
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(userData: NewUserInsert): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        username: userData.username,
        passwordHash: userData.passwordHash,
        role: userData.role,
      })
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
