import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated, isManagerOrAbove, isAdmin } from "./auth";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { 
  insertCustomerSchema, 
  insertJobSchema, 
  insertServiceSchema,
  insertEstimateSchema,
  insertEstimateServiceSchema,
  insertNoteSchema,
  insertUserSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Rate limiter for password reset - 5 attempts per 15 minutes per IP
  const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: { error: "Too many password reset attempts. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // User info endpoint - for checking current user
  app.get("/api/user", isAuthenticated, async (req, res) => {
    try {
      const sessionUser = req.user as any;
      const dbUser = await storage.getUser(sessionUser.id);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      // Return user without passwordHash
      const { passwordHash, ...userWithoutPassword } = dbUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // User management routes (admin only)
  app.get("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove password hashes from response
      const sanitizedUsers = users.map(({ passwordHash, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id/role", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { role } = req.body;
      if (!["admin", "manager"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      const user = await storage.updateUserRole(req.params.id, role);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Remove password hash from response
      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  // Create user endpoint (admin only)
  app.post("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Validate input using insertUserSchema
      const validationResult = insertUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        // Sanitize validation errors to remove sensitive field values
        const sanitizedErrors = validationResult.error.errors.map(err => ({
          path: err.path,
          message: err.message,
        }));
        return res.status(400).json({ 
          error: "Validation failed", 
          details: sanitizedErrors
        });
      }
      
      const { username, password, role } = validationResult.data;

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      const user = await storage.createUser({
        username,
        passwordHash,
        role,
      });
      
      // Return user without passwordHash
      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Delete user endpoint (admin only)
  app.delete("/api/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Customer routes (read requires manager+, write requires manager+)
  app.get("/api/customers", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/metrics", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const customers = await storage.getCustomersWithMetrics();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer metrics" });
    }
  });

  app.get("/api/customers/:id", isAuthenticated, isAdmin, async (req, res) => {
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

  app.post("/api/customers", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validated = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validated);
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ error: "Invalid customer data" });
    }
  });

  app.patch("/api/customers/:id", isAuthenticated, isAdmin, async (req, res) => {
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

  app.delete("/api/customers/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteCustomer(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete customer" });
    }
  });

  // Job routes (read: manager+, write: manager+)
  app.get("/api/jobs", isAuthenticated, isAdmin, async (req, res) => {
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

  app.get("/api/jobs/:id", isAuthenticated, isAdmin, async (req, res) => {
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

  app.post("/api/jobs", isAuthenticated, isAdmin, async (req, res) => {
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
        items: validated.items,
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

  app.patch("/api/jobs/:id", isAuthenticated, isAdmin, async (req, res) => {
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

  app.delete("/api/jobs/:id", isAuthenticated, isAdmin, async (req, res) => {
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

  // Service routes (read: manager+, write: manager+)
  app.get("/api/services", isAuthenticated, isManagerOrAbove, async (req, res) => {
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

  app.get("/api/services/:id", isAuthenticated, isManagerOrAbove, async (req, res) => {
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

  app.post("/api/services", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validated = insertServiceSchema.parse(req.body);
      
      // Check for duplicate service name
      const allServices = await storage.getAllServices();
      const duplicate = allServices.find(
        s => s.name.toLowerCase().trim() === validated.name.toLowerCase().trim()
      );
      if (duplicate) {
        return res.status(400).json({ error: "A service with this name already exists" });
      }
      
      const service = await storage.createService(validated);
      res.status(201).json(service);
    } catch (error) {
      console.error("Failed to create service:", error);
      res.status(400).json({ error: "Invalid service data" });
    }
  });

  app.patch("/api/services/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validated = insertServiceSchema.partial().parse(req.body);
      
      // Check for duplicate service name (excluding current service)
      if (validated.name) {
        const serviceName = validated.name;
        const allServices = await storage.getAllServices();
        const duplicate = allServices.find(
          s => s.id !== req.params.id && 
          s.name.toLowerCase().trim() === serviceName.toLowerCase().trim()
        );
        if (duplicate) {
          return res.status(400).json({ error: "A service with this name already exists" });
        }
      }
      
      const service = await storage.updateService(req.params.id, validated);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      res.status(400).json({ error: "Invalid service data" });
    }
  });

  app.delete("/api/services/:id", isAuthenticated, isAdmin, async (req, res) => {
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

  app.get("/api/analytics/most-popular-service", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const service = await storage.getMostPopularService();
      if (!service) {
        return res.status(204).send();
      }
      res.json(service);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service analytics" });
    }
  });

  // Estimate routes (read: all auth, write: manager+)
  app.get("/api/estimates", isAuthenticated, async (req, res) => {
    try {
      const estimates = await storage.getAllEstimates();
      res.json(estimates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch estimates" });
    }
  });

  app.get("/api/estimates/:id", isAuthenticated, async (req, res) => {
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

  app.post("/api/estimates", isAuthenticated, isManagerOrAbove, async (req, res) => {
    try {
      // Extract serviceId from request (not part of estimate schema)
      const { serviceId, ...estimateData } = req.body;
      
      if (!serviceId) {
        return res.status(400).json({ error: "Service selection is required" });
      }
      
      // Get the service to derive serviceType and price
      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(400).json({ error: "Selected service not found" });
      }
      
      // Derive serviceType from service category
      const serviceType = service.category === "prep" ? "misc" : service.category;
      
      // Create estimate with derived serviceType and total from service price
      const validated = insertEstimateSchema.parse({
        ...estimateData,
        serviceType,
        total: String(service.price),
      });
      
      const estimate = await storage.createEstimate(validated);
      
      // Link the service to the estimate
      await storage.addEstimateService({
        estimateId: estimate.id,
        serviceId: service.id,
        serviceName: service.name,
        servicePrice: String(service.price),
        quantity: 1,
      });
      
      res.status(201).json(estimate);
    } catch (error) {
      console.error("Error creating estimate:", error);
      res.status(400).json({ error: "Invalid estimate data" });
    }
  });

  app.patch("/api/estimates/:id", isAuthenticated, isManagerOrAbove, async (req, res) => {
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

  app.delete("/api/estimates/:id", isAuthenticated, isManagerOrAbove, async (req, res) => {
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

  // Estimate Services routes (read: all auth, write: manager+)
  app.get("/api/estimates/:estimateId/services", isAuthenticated, async (req, res) => {
    try {
      const services = await storage.getEstimateServices(req.params.estimateId);
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch estimate services" });
    }
  });

  app.post("/api/estimates/:estimateId/services", isAuthenticated, isManagerOrAbove, async (req, res) => {
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

  app.delete("/api/estimates/:estimateId/services/:serviceId", isAuthenticated, isManagerOrAbove, async (req, res) => {
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

  // Convert estimate to job (manager+)
  app.post("/api/estimates/:id/convert-to-job", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const estimateId = req.params.id;
      
      // Get the estimate
      const estimate = await storage.getEstimate(estimateId);
      if (!estimate) {
        return res.status(404).json({ error: "Estimate not found" });
      }
      
      // Check if already converted
      if (estimate.status === "converted") {
        return res.status(400).json({ error: "Estimate has already been converted to a job" });
      }
      
      // Get estimate services to include in job details
      const estimateServices = await storage.getEstimateServices(estimateId);
      const servicesText = estimateServices
        .map(s => `${s.serviceName} - $${parseFloat(s.servicePrice).toFixed(2)}`)
        .join('\n');
      
      // Find or create customer
      let customerId: string;
      const existingCustomer = await storage.findCustomerByName(estimate.customerName);
      
      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const newCustomer = await storage.createCustomer({
          name: estimate.customerName,
          phone: estimate.phone,
        });
        customerId = newCustomer.id;
      }
      
      // Determine coating type based on services
      let coatingType: "powder" | "ceramic" | "misc" = "powder";
      const serviceCategories = new Set(estimateServices.map(s => {
        // Try to infer category from service name if not available
        const serviceName = s.serviceName.toLowerCase();
        if (serviceName.includes("ceramic")) return "ceramic";
        if (serviceName.includes("powder")) return "powder";
        return "powder"; // default
      }));
      
      if (serviceCategories.has("powder") && serviceCategories.has("ceramic")) {
        coatingType = "misc";
      } else if (serviceCategories.has("ceramic")) {
        coatingType = "ceramic";
      }
      
      // Create the job
      const job = await storage.createJob({
        customerId,
        phoneNumber: estimate.phone,
        receivedDate: new Date(estimate.date),
        coatingType,
        items: servicesText,
        detailedNotes: `Converted from estimate on ${new Date().toLocaleDateString()}`,
        price: parseFloat(estimate.total),
        status: "received",
      });
      
      // Update estimate status to "converted"
      await storage.updateEstimate(estimateId, { status: "converted" });
      
      res.status(201).json(job);
    } catch (error) {
      console.error("Failed to convert estimate to job:", error);
      res.status(500).json({ error: "Failed to convert estimate to job" });
    }
  });

  // Note routes (read: manager+, create: manager+, delete: manager+)
  app.get("/api/notes", isAuthenticated, isAdmin, async (req, res) => {
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

  app.post("/api/notes", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validated = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(validated);
      res.status(201).json(note);
    } catch (error) {
      res.status(400).json({ error: "Invalid note data" });
    }
  });

  app.delete("/api/notes/:id", isAuthenticated, isAdmin, async (req, res) => {
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
