import { eq } from "drizzle-orm";
import { db } from "./db";
import { 
  customers,
  jobs,
  services,
  estimates,
  estimateServices,
  notes,
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
  type InsertNote 
} from "@shared/schema";

export interface IStorage {
  getCustomer(id: string): Promise<Customer | undefined>;
  getAllCustomers(): Promise<Customer[]>;
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
}

export class DatabaseStorage implements IStorage {
  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
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
    const dbUpdates = {
      ...rest,
      ...(price !== undefined && { price: price.toString() }),
    };
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
}

export const storage = new DatabaseStorage();
