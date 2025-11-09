import { randomUUID } from "crypto";
import type { 
  Customer, 
  InsertCustomer, 
  Job, 
  InsertJob, 
  Estimate, 
  InsertEstimate, 
  Note, 
  InsertNote 
} from "@shared/schema";

export interface IStorage {
  getCustomer(id: string): Promise<Customer | undefined>;
  getAllCustomers(): Promise<Customer[]>;
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

export class MemStorage implements IStorage {
  private customers: Map<string, Customer>;
  private jobs: Map<string, Job>;
  private estimates: Map<string, Estimate>;
  private notes: Map<string, Note>;

  constructor() {
    this.customers = new Map();
    this.jobs = new Map();
    this.estimates = new Map();
    this.notes = new Map();
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const customer: Customer = { 
      id, 
      name: insertCustomer.name,
      email: insertCustomer.email ?? null,
      phone: insertCustomer.phone ?? null,
      address: insertCustomer.address ?? null,
      createdAt: new Date() 
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;
    const updated = { ...customer, ...updates };
    this.customers.set(id, updated);
    return updated;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    return this.customers.delete(id);
  }

  async getJob(id: string): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async getAllJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async getJobsByCustomerId(customerId: string): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => job.customerId === customerId);
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = randomUUID();
    const now = new Date();
    const job: Job = { 
      id, 
      customerId: insertJob.customerId,
      title: insertJob.title,
      description: insertJob.description ?? null,
      status: insertJob.status ?? "pending",
      priority: insertJob.priority ?? "medium",
      createdAt: now,
      updatedAt: now
    };
    this.jobs.set(id, job);
    return job;
  }

  async updateJob(id: string, updates: Partial<InsertJob>): Promise<Job | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    const updated = { ...job, ...updates, updatedAt: new Date() };
    this.jobs.set(id, updated);
    return updated;
  }

  async deleteJob(id: string): Promise<boolean> {
    return this.jobs.delete(id);
  }

  async getEstimate(id: string): Promise<Estimate | undefined> {
    return this.estimates.get(id);
  }

  async getAllEstimates(): Promise<Estimate[]> {
    return Array.from(this.estimates.values());
  }

  async createEstimate(insertEstimate: InsertEstimate): Promise<Estimate> {
    const id = randomUUID();
    const estimate: Estimate = { 
      id,
      customerId: insertEstimate.customerId,
      jobId: insertEstimate.jobId ?? null,
      title: insertEstimate.title,
      description: insertEstimate.description ?? null,
      items: insertEstimate.items,
      subtotal: insertEstimate.subtotal,
      tax: insertEstimate.tax ?? "0",
      total: insertEstimate.total,
      status: insertEstimate.status ?? "draft",
      createdAt: new Date() 
    };
    this.estimates.set(id, estimate);
    return estimate;
  }

  async updateEstimate(id: string, updates: Partial<InsertEstimate>): Promise<Estimate | undefined> {
    const estimate = this.estimates.get(id);
    if (!estimate) return undefined;
    const updated = { ...estimate, ...updates };
    this.estimates.set(id, updated);
    return updated;
  }

  async deleteEstimate(id: string): Promise<boolean> {
    return this.estimates.delete(id);
  }

  async getNote(id: string): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async getAllNotes(): Promise<Note[]> {
    return Array.from(this.notes.values());
  }

  async getNotesByJobId(jobId: string): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(note => note.jobId === jobId);
  }

  async getNotesByCustomerId(customerId: string): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(note => note.customerId === customerId);
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = randomUUID();
    const note: Note = { 
      id,
      customerId: insertNote.customerId ?? null,
      jobId: insertNote.jobId ?? null,
      content: insertNote.content,
      author: insertNote.author,
      createdAt: new Date() 
    };
    this.notes.set(id, note);
    return note;
  }

  async deleteNote(id: string): Promise<boolean> {
    return this.notes.delete(id);
  }
}

export const storage = new MemStorage();
