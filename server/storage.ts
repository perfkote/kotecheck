import { eq } from "drizzle-orm";
import { db } from "./db";
import { 
  customers,
  jobs,
  estimates,
  notes,
  type Customer, 
  type InsertCustomer, 
  type Job, 
  type InsertJob, 
  type Estimate, 
  type InsertEstimate, 
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

  getEstimate(id: string): Promise<Estimate | undefined>;
  getAllEstimates(): Promise<Estimate[]>;
  createEstimate(estimate: InsertEstimate): Promise<Estimate>;
  updateEstimate(id: string, estimate: Partial<InsertEstimate>): Promise<Estimate | undefined>;
  deleteEstimate(id: string): Promise<boolean>;

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
    // Generate tracking ID based on job count
    const allJobs = await db.select().from(jobs);
    const jobNumber = allJobs.length + 1;
    const trackingId = `JOB-${jobNumber.toString().padStart(4, '0')}`;
    
    const [job] = await db
      .insert(jobs)
      .values({
        ...insertJob,
        trackingId,
      })
      .returning();
    return job;
  }

  async updateJob(id: string, updates: Partial<InsertJob>): Promise<Job | undefined> {
    const [job] = await db
      .update(jobs)
      .set(updates)
      .where(eq(jobs.id, id))
      .returning();
    return job || undefined;
  }

  async deleteJob(id: string): Promise<boolean> {
    const result = await db.delete(jobs).where(eq(jobs.id, id));
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
