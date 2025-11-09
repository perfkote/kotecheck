import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCustomerSchema, 
  insertJobSchema, 
  insertServiceSchema,
  insertEstimateSchema,
  insertEstimateServiceSchema,
  insertNoteSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Customer routes
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const validated = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validated);
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ error: "Invalid customer data" });
    }
  });

  app.patch("/api/customers/:id", async (req, res) => {
    try {
      const validated = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, validated);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(400).json({ error: "Invalid customer data" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      // Check if customer has any jobs
      const jobs = await storage.getJobsByCustomerId(req.params.id);
      if (jobs.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete customer with existing jobs. Please delete or reassign all jobs first." 
        });
      }

      const success = await storage.deleteCustomer(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete customer" });
    }
  });

  // Job routes
  app.get("/api/jobs", async (req, res) => {
    try {
      const customerId = req.query.customerId as string | undefined;
      const jobs = customerId
        ? await storage.getJobsByCustomerId(customerId)
        : await storage.getAllJobs();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job" });
    }
  });

  app.post("/api/jobs", async (req, res) => {
    try {
      const { createJobWithCustomerSchema } = await import("@shared/schema");
      const validated = createJobWithCustomerSchema.parse(req.body);
      
      let customerId = validated.customerId;
      
      // If creating a new customer
      if (validated.customerName) {
        // Check if a customer with this name already exists (case-insensitive)
        const existing = await storage.findCustomerByName(validated.customerName);
        
        if (existing) {
          // Use the existing customer
          customerId = existing.id;
        } else {
          // Create a new customer
          const newCustomer = await storage.createCustomer({
            name: validated.customerName,
            email: validated.customerEmail || undefined,
          });
          customerId = newCustomer.id;
        }
      }
      
      if (!customerId) {
        return res.status(400).json({ error: "Customer ID is required" });
      }
      
      // Create the job with the resolved customer ID
      const job = await storage.createJob({
        customerId,
        phoneNumber: validated.phoneNumber,
        receivedDate: validated.receivedDate || new Date(),
        coatingType: validated.coatingType,
        detailedNotes: validated.detailedNotes,
        price: validated.price,
        status: validated.status,
      });
      
      res.status(201).json(job);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid job data" });
      }
      res.status(500).json({ error: "Failed to create job" });
    }
  });

  app.patch("/api/jobs/:id", async (req, res) => {
    try {
      const validated = insertJobSchema.partial().parse(req.body);
      const job = await storage.updateJob(req.params.id, validated);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(400).json({ error: "Invalid job data" });
    }
  });

  app.delete("/api/jobs/:id", async (req, res) => {
    try {
      const success = await storage.deleteJob(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete job" });
    }
  });

  // Service routes
  app.get("/api/services", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const services = category
        ? await storage.getServicesByCategory(category)
        : await storage.getAllServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  app.get("/api/services/:id", async (req, res) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service" });
    }
  });

  app.post("/api/services", async (req, res) => {
    try {
      const validated = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validated);
      res.status(201).json(service);
    } catch (error) {
      res.status(400).json({ error: "Invalid service data" });
    }
  });

  app.patch("/api/services/:id", async (req, res) => {
    try {
      const validated = insertServiceSchema.partial().parse(req.body);
      const service = await storage.updateService(req.params.id, validated);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      res.status(400).json({ error: "Invalid service data" });
    }
  });

  app.delete("/api/services/:id", async (req, res) => {
    try {
      const success = await storage.deleteService(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete service" });
    }
  });

  // Estimate routes
  app.get("/api/estimates", async (req, res) => {
    try {
      const estimates = await storage.getAllEstimates();
      res.json(estimates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch estimates" });
    }
  });

  app.get("/api/estimates/:id", async (req, res) => {
    try {
      const estimate = await storage.getEstimate(req.params.id);
      if (!estimate) {
        return res.status(404).json({ error: "Estimate not found" });
      }
      res.json(estimate);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch estimate" });
    }
  });

  app.post("/api/estimates", async (req, res) => {
    try {
      const validated = insertEstimateSchema.parse(req.body);
      const estimate = await storage.createEstimate(validated);
      res.status(201).json(estimate);
    } catch (error) {
      res.status(400).json({ error: "Invalid estimate data" });
    }
  });

  app.patch("/api/estimates/:id", async (req, res) => {
    try {
      const validated = insertEstimateSchema.partial().parse(req.body);
      const estimate = await storage.updateEstimate(req.params.id, validated);
      if (!estimate) {
        return res.status(404).json({ error: "Estimate not found" });
      }
      res.json(estimate);
    } catch (error) {
      res.status(400).json({ error: "Invalid estimate data" });
    }
  });

  app.delete("/api/estimates/:id", async (req, res) => {
    try {
      const success = await storage.deleteEstimate(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Estimate not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete estimate" });
    }
  });

  // Estimate Services routes
  app.get("/api/estimates/:estimateId/services", async (req, res) => {
    try {
      const services = await storage.getEstimateServices(req.params.estimateId);
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch estimate services" });
    }
  });

  app.post("/api/estimates/:estimateId/services", async (req, res) => {
    try {
      const validated = insertEstimateServiceSchema.parse({
        ...req.body,
        estimateId: req.params.estimateId,
      });
      const estimateService = await storage.addEstimateService(validated);
      
      // Recalculate total for the estimate
      const allServices = await storage.getEstimateServices(req.params.estimateId);
      const total = allServices.reduce((sum, s) => sum + parseFloat(s.servicePrice), 0);
      // Update total directly via database query (bypass schema validation)
      const { db } = await import("./db");
      const { estimates } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      await db.update(estimates)
        .set({ total: total.toString() })
        .where(eq(estimates.id, req.params.estimateId));
      
      res.status(201).json(estimateService);
    } catch (error) {
      res.status(400).json({ error: "Invalid estimate service data" });
    }
  });

  app.delete("/api/estimates/:estimateId/services/:serviceId", async (req, res) => {
    try {
      const success = await storage.removeEstimateService(req.params.serviceId);
      if (!success) {
        return res.status(404).json({ error: "Estimate service not found" });
      }
      
      // Recalculate total for the estimate
      const allServices = await storage.getEstimateServices(req.params.estimateId);
      const total = allServices.reduce((sum, s) => sum + parseFloat(s.servicePrice), 0);
      // Update total directly via database query (bypass schema validation)
      const { db } = await import("./db");
      const { estimates } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      await db.update(estimates)
        .set({ total: total.toString() })
        .where(eq(estimates.id, req.params.estimateId));
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete estimate service" });
    }
  });

  // Note routes
  app.get("/api/notes", async (req, res) => {
    try {
      const jobId = req.query.jobId as string | undefined;
      const customerId = req.query.customerId as string | undefined;
      
      let notes;
      if (jobId) {
        notes = await storage.getNotesByJobId(jobId);
      } else if (customerId) {
        notes = await storage.getNotesByCustomerId(customerId);
      } else {
        notes = await storage.getAllNotes();
      }
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      const validated = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(validated);
      res.status(201).json(note);
    } catch (error) {
      res.status(400).json({ error: "Invalid note data" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      const success = await storage.deleteNote(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
