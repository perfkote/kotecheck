import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCustomerSchema, insertJobSchema, insertEstimateSchema, insertNoteSchema } from "@shared/schema";

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
            phone: validated.customerPhone || undefined,
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
        title: validated.title,
        description: validated.description,
        status: validated.status,
        priority: validated.priority,
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
