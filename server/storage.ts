import { eq, desc, sql, inArray } from "drizzle-orm";
import { db } from "./db";
import { 
  customers,
  jobs,
  services,
  estimates,
  estimateServices,
  jobServices,
  notes,
  inventory,
  jobInventory,
  users,
  sessions,
  type Customer, 
  type InsertCustomer, 
  type Job,
  type JobWithServices,
  type InsertJob,
  type Service,
  type InsertService,
  type Estimate, 
  type InsertEstimate,
  type EstimateService,
  type InsertEstimateService,
  type JobService,
  type InsertJobService,
  type JobInventory,
  type InsertJobInventory,
  type Note, 
  type InsertNote,
  type InventoryItem,
  type InsertInventory,
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
  getJobWithServices(id: string): Promise<JobWithServices | undefined>;
  getAllJobs(): Promise<JobWithServices[]>;
  getJobsByCustomerId(customerId: string): Promise<JobWithServices[]>;
  createJob(job: InsertJob): Promise<Job>;
  createJobWithServices(payload: { 
    job: InsertJob; 
    services: Array<Omit<InsertJobService, "jobId" | "id" | "createdAt">>; 
    inventory?: Array<{ inventoryId: string; inventoryName: string; quantity: number; unit: string }>; 
    newCustomer?: InsertCustomer 
  }): Promise<Job>;
  updateJob(id: string, job: Partial<InsertJob>): Promise<Job | undefined>;
  updateJobWithServices(id: string, updates: Partial<InsertJob>, services: { toAdd: Array<Omit<InsertJobService, "jobId" | "id" | "createdAt">>; toRemove: string[] }, inventoryChanges?: { toAdd: Array<{ inventoryId: string; inventoryName: string; quantity: number; unit: string }>; toRemove: string[] }): Promise<Job | undefined>;
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

  getJobServices(jobId: string): Promise<JobService[]>;
  addJobService(jobService: InsertJobService): Promise<JobService>;
  removeJobService(id: string): Promise<boolean>;

  getJobInventory(jobId: string): Promise<JobInventory[]>;
  addJobInventory(jobInventory: InsertJobInventory): Promise<JobInventory>;
  removeJobInventory(id: string): Promise<boolean>;
  deductInventoryForJob(jobId: string): Promise<void>;

  getNote(id: string): Promise<Note | undefined>;
  getAllNotes(): Promise<Note[]>;
  getNotesByJobId(jobId: string): Promise<Note[]>;
  getNotesByCustomerId(customerId: string): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  deleteNote(id: string): Promise<boolean>;

  getInventoryItem(id: string): Promise<InventoryItem | undefined>;
  getAllInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItemsByCategory(category: string): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventory): Promise<InventoryItem>;
  updateInventoryItem(id: string, item: Partial<InsertInventory>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: string): Promise<boolean>;

  // User operations - Simple username/password authentication
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: NewUserInsert): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  invalidateUserSessions(userId: string): Promise<void>;
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

  async getJobWithServices(id: string): Promise<JobWithServices | undefined> {
    const job = await this.getJob(id);
    if (!job) return undefined;
    
    const enriched = await this.enrichJobsWithServices([job]);
    return enriched[0];
  }

  // Helper to efficiently enrich jobs with their services and inventory (avoids N+1)
  private async enrichJobsWithServices(jobsList: Job[]): Promise<JobWithServices[]> {
    if (jobsList.length === 0) return [];
    
    const jobIds = jobsList.map(j => j.id);
    
    // Fetch all job services
    const allJobServices = await db
      .select()
      .from(jobServices)
      .where(inArray(jobServices.jobId, jobIds));
    
    // Fetch all job inventory
    const allJobInventory = await db
      .select()
      .from(jobInventory)
      .where(inArray(jobInventory.jobId, jobIds));
    
    // Group services by jobId
    const servicesByJobId = new Map<string, JobService[]>();
    for (const svc of allJobServices) {
      if (!servicesByJobId.has(svc.jobId)) {
        servicesByJobId.set(svc.jobId, []);
      }
      servicesByJobId.get(svc.jobId)!.push(svc);
    }
    
    // Group inventory by jobId
    const inventoryByJobId = new Map<string, JobInventory[]>();
    for (const inv of allJobInventory) {
      if (!inventoryByJobId.has(inv.jobId)) {
        inventoryByJobId.set(inv.jobId, []);
      }
      inventoryByJobId.get(inv.jobId)!.push(inv);
    }
    
    // Enrich each job with its services and inventory
    return jobsList.map(job => {
      const jobInv = inventoryByJobId.get(job.id) || [];
      return {
        ...job,
        services: servicesByJobId.get(job.id) || [],
        serviceIds: (servicesByJobId.get(job.id) || []).map(s => s.serviceId),
        inventory: jobInv,
        inventoryItems: jobInv.map(inv => ({
          inventoryId: inv.inventoryId,
          inventoryName: inv.inventoryName,
          quantity: Number(inv.quantity),
          unit: inv.unit,
        })),
      };
    });
  }

  async getAllJobs(): Promise<JobWithServices[]> {
    const jobsList = await db.select().from(jobs);
    return this.enrichJobsWithServices(jobsList);
  }

  async getJobsByCustomerId(customerId: string): Promise<JobWithServices[]> {
    const jobsList = await db.select().from(jobs).where(eq(jobs.customerId, customerId));
    return this.enrichJobsWithServices(jobsList);
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

  async createJobWithServices(payload: { 
    job: InsertJob; 
    services: Array<Omit<InsertJobService, "jobId" | "id" | "createdAt">>; 
    inventory?: Array<{ inventoryId: string; inventoryName: string; quantity: number; unit: string }>; 
    newCustomer?: InsertCustomer 
  }): Promise<Job> {
    // Transaction: optionally create customer, create job, then create job_services and job_inventory
    return await db.transaction(async (tx) => {
      let customerId = payload.job.customerId;

      // Create new customer if provided
      if (payload.newCustomer) {
        const [customer] = await tx.insert(customers).values(payload.newCustomer).returning();
        customerId = customer.id;
      }

      // Generate tracking ID
      const allJobs = await tx.select().from(jobs);
      let maxNumber = 0;
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

      // Create job
      const [job] = await tx
        .insert(jobs)
        .values({
          ...payload.job,
          customerId,
          trackingId,
          price: payload.job.price.toString(),
        })
        .returning();

      // Create job_services entries
      if (payload.services.length > 0) {
        await tx.insert(jobServices).values(
          payload.services.map(svc => ({
            ...svc,
            jobId: job.id,
            servicePrice: svc.servicePrice.toString(),
          }))
        );
      }

      // Create job_inventory entries
      if (payload.inventory && payload.inventory.length > 0) {
        await tx.insert(jobInventory).values(
          payload.inventory.map(inv => ({
            jobId: job.id,
            inventoryId: inv.inventoryId,
            inventoryName: inv.inventoryName,
            quantity: inv.quantity.toString(),
            unit: inv.unit,
          }))
        );
      }

      return job;
    });
  }

  async updateJobWithServices(id: string, updates: Partial<InsertJob>, services: { toAdd: Array<Omit<InsertJobService, "jobId" | "id" | "createdAt">>; toRemove: string[] }, inventoryChanges?: { toAdd: Array<{ inventoryId: string; inventoryName: string; quantity: number; unit: string }>; toRemove: string[] }): Promise<Job | undefined> {
    return await db.transaction(async (tx) => {
      // Get current job to check status transition
      const [currentJob] = await tx.select().from(jobs).where(eq(jobs.id, id));
      if (!currentJob) return undefined;

      // Update job
      const { price, ...rest } = updates;
      const dbUpdates: any = {
        ...rest,
        ...(price !== undefined && { price: price.toString() }),
      };

      // Only update completedAt when status actually changes
      if (updates.status) {
        if (updates.status === "paid" && currentJob.status !== "paid") {
          dbUpdates.completedAt = new Date();
        } else if (updates.status !== "paid" && currentJob.status === "paid") {
          dbUpdates.completedAt = null;
        }
      }

      const [job] = await tx
        .update(jobs)
        .set(dbUpdates)
        .where(eq(jobs.id, id))
        .returning();

      if (!job) return undefined;

      // IMPORTANT: Deduct inventory when status changes to "finished"
      if (updates.status === "finished" && currentJob.status !== "finished") {
        const jobInvItems = await tx.select().from(jobInventory).where(eq(jobInventory.jobId, id));
        
        // Aggregate required quantities by inventoryId (in case same item appears multiple times)
        const requiredByInventoryId = new Map<string, { name: string; totalRequired: number; unit: string }>();
        for (const item of jobInvItems) {
          const existing = requiredByInventoryId.get(item.inventoryId);
          const qty = parseFloat(item.quantity);
          if (existing) {
            existing.totalRequired += qty;
          } else {
            requiredByInventoryId.set(item.inventoryId, {
              name: item.inventoryName,
              totalRequired: qty,
              unit: item.unit,
            });
          }
        }
        
        // Validate that all inventory items have sufficient quantities
        for (const [invId, required] of Array.from(requiredByInventoryId.entries())) {
          const [invItem] = await tx.select().from(inventory).where(eq(inventory.id, invId));
          if (!invItem) {
            throw new Error(`Inventory item ${required.name} not found`);
          }
          const available = parseFloat(invItem.quantity);
          if (available < required.totalRequired) {
            throw new Error(`Insufficient inventory: ${required.name} (available: ${available} ${required.unit}, required: ${required.totalRequired} ${required.unit})`);
          }
        }
        
        // If all validations pass, perform the deductions
        for (const item of jobInvItems) {
          await tx
            .update(inventory)
            .set({
              quantity: sql`${inventory.quantity} - ${item.quantity}`,
            })
            .where(eq(inventory.id, item.inventoryId));
        }
      }

      // Remove specified services
      if (services.toRemove.length > 0) {
        for (const serviceId of services.toRemove) {
          await tx.delete(jobServices).where(eq(jobServices.id, serviceId));
        }
      }

      // Add new services
      if (services.toAdd.length > 0) {
        await tx.insert(jobServices).values(
          services.toAdd.map(svc => ({
            ...svc,
            jobId: job.id,
            servicePrice: svc.servicePrice.toString(),
          }))
        );
      }

      // Remove specified inventory items
      if (inventoryChanges && inventoryChanges.toRemove.length > 0) {
        for (const invId of inventoryChanges.toRemove) {
          await tx.delete(jobInventory).where(eq(jobInventory.id, invId));
        }
      }

      // Add new inventory items
      if (inventoryChanges && inventoryChanges.toAdd.length > 0) {
        await tx.insert(jobInventory).values(
          inventoryChanges.toAdd.map(inv => ({
            jobId: job.id,
            inventoryId: inv.inventoryId,
            inventoryName: inv.inventoryName,
            quantity: inv.quantity.toString(),
            unit: inv.unit,
          }))
        );
      }

      return job;
    });
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

  async getJobServices(jobId: string): Promise<JobService[]> {
    return await db.select().from(jobServices).where(eq(jobServices.jobId, jobId));
  }

  async addJobService(insertJobService: InsertJobService): Promise<JobService> {
    const [jobService] = await db
      .insert(jobServices)
      .values({
        ...insertJobService,
        servicePrice: insertJobService.servicePrice.toString(),
      })
      .returning();
    return jobService;
  }

  async removeJobService(id: string): Promise<boolean> {
    const result = await db.delete(jobServices).where(eq(jobServices.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getJobInventory(jobId: string): Promise<JobInventory[]> {
    return await db.select().from(jobInventory).where(eq(jobInventory.jobId, jobId));
  }

  async addJobInventory(insertJobInventory: InsertJobInventory): Promise<JobInventory> {
    const [jobInv] = await db
      .insert(jobInventory)
      .values({
        ...insertJobInventory,
        quantity: insertJobInventory.quantity.toString(),
      })
      .returning();
    return jobInv;
  }

  async removeJobInventory(id: string): Promise<boolean> {
    const result = await db.delete(jobInventory).where(eq(jobInventory.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async deductInventoryForJob(jobId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Get all inventory items assigned to this job
      const jobInvItems = await tx.select().from(jobInventory).where(eq(jobInventory.jobId, jobId));

      // Deduct quantity from each inventory item
      for (const item of jobInvItems) {
        await tx
          .update(inventory)
          .set({
            quantity: sql`${inventory.quantity} - ${item.quantity}`,
          })
          .where(eq(inventory.id, item.inventoryId));
      }
    });
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
    const [user] = await db.select().from(users).where(sql`LOWER(${users.username}) = LOWER(${username})`);
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

  async invalidateUserSessions(userId: string): Promise<void> {
    // Delete all sessions for the given user by querying the session data
    // The sess column contains passport.user.id in the session object
    await db.execute(
      sql`DELETE FROM ${sessions} WHERE sess->'passport'->'user'->>'id' = ${userId}`
    );
  }

  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventory).where(eq(inventory.id, id));
    return item || undefined;
  }

  async getAllInventoryItems(): Promise<InventoryItem[]> {
    return await db.select().from(inventory).orderBy(desc(inventory.createdAt));
  }

  async getInventoryItemsByCategory(category: string): Promise<InventoryItem[]> {
    return await db.select().from(inventory).where(eq(inventory.category, category)).orderBy(desc(inventory.createdAt));
  }

  async createInventoryItem(insertItem: InsertInventory): Promise<InventoryItem> {
    const [item] = await db
      .insert(inventory)
      .values({
        ...insertItem,
        quantity: insertItem.quantity.toString(),
        price: insertItem.price.toString(),
      })
      .returning();
    return item;
  }

  async updateInventoryItem(id: string, updates: Partial<InsertInventory>): Promise<InventoryItem | undefined> {
    const updateData: any = { ...updates };
    if (updates.quantity !== undefined) {
      updateData.quantity = updates.quantity.toString();
    }
    if (updates.price !== undefined) {
      updateData.price = updates.price.toString();
    }
    
    const [item] = await db
      .update(inventory)
      .set(updateData)
      .where(eq(inventory.id, id))
      .returning();
    return item || undefined;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    const result = await db.delete(inventory).where(eq(inventory.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
