## Overview

Coat Check is a coating job management application designed to streamline operations and enhance productivity for coating businesses. It provides a clean, productivity-focused interface for tracking customers, jobs, estimates, notes, and inventory. The system supports customer relationship management, detailed job tracking with various coating types (powder/ceramic/misc), efficient estimate creation with multi-service selection, internal note-taking, and comprehensive inventory tracking for office supplies, business consumables, powder, and ceramic materials.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with **React** and **TypeScript**, using **Vite** for tooling. **Wouter** handles client-side routing, and **TanStack Query** manages server state with aggressive caching. UI components are based on **shadcn/ui** and **Radix UI primitives**, styled with **Tailwind CSS**. Forms are managed with **React Hook Form** and validated using **Zod schemas** shared with the backend. The application features comprehensive mobile optimization, providing responsive layouts for all pages and components, transitioning to card-based views on smaller screens.

### Backend Architecture

The backend is built with **Express.js** and **TypeScript**, providing a **RESTful API** design. It includes custom middleware for logging and JSON parsing. API endpoints are resource-based and utilize **Zod schema validation** for request bodies. A `DatabaseStorage` implementation handles all CRUD operations, separating data access logic from routes. Authentication and role-based access control are implemented using **username/password authentication** with bcrypt hashing and a three-tier permission system:
- **Full Administrator**: Complete access including user management (create, edit, delete users, change roles) plus all admin features
- **Admin**: Full access to business features (customers, jobs, services, notes) but cannot manage users
- **Manager**: Access to estimates (full CRUD) and services (read-only view only)

Route protection is enforced via middleware (`isAuthenticated`, `isFullAdmin`, `isAdmin`, `isManagerOrAbove`) with frontend route guards showing an AccessDenied page for unauthorized access. Secure session management is handled via `connect-pg-simple`, with automatic session invalidation when user roles are changed or users are deleted to prevent privilege escalation from stale sessions.

### Database Architecture

The application uses **PostgreSQL** with **Drizzle ORM** for type-safe database operations. The schema includes tables for `customers`, `jobs`, `services`, `estimates`, `estimate_services`, `notes`, `inventory`, `users`, and `sessions`. Relationships include jobs linked to customers, many-to-many between estimates and services via `estimate_services`, and notes linked to jobs or customers. The `inventory` table tracks items across four categories (office_supplies, business_consumables, powder, ceramic) with flexible units (pieces, pounds, gallons, etc.), descriptions, and pricing. **Shared Zod schemas** generated from Drizzle ensure consistent data validation across the stack.

### UI/UX Decisions

The design follows principles similar to Linear and Material Design, using consistent spacing and typography with the Inter font family. The application supports both light and dark modes with theme-aware colors. Mobile optimization is a key focus, providing responsive layouts for dashboards and job listings, transitioning to card-based views on smaller screens. Key features include a dual temperature gauge, monthly revenue line graph, and a customer reviews widget.

## Recent Changes

### November 15, 2025 - Job-Inventory Integration
- Implemented job-inventory assignment system allowing multiple inventory items with quantities to be assigned to jobs
- Database: Created `job_inventory` junction table linking jobs to inventory items with denormalized data (inventoryId, inventoryName, quantity, unit)
- Backend deduction logic: Automatically deducts inventory quantities when job status transitions to "finished"
  - Validates sufficient inventory before deduction with aggregated quantity checks
  - Prevents negative inventory by checking total required quantities across duplicate items
  - Uses database transactions to ensure atomicity and rollback on errors
  - Provides clear error messages for insufficient inventory or missing items
- Backend routes: Updated POST /api/jobs and PATCH /api/jobs/:id to handle inventoryItems array
- Frontend JobForm: Added inventory selector with quantity inputs (similar to services pattern)
  - Multi-select dropdown for inventory items
  - Individual quantity inputs for each selected item
  - Displays item name, description, and unit
- Frontend Jobs page: Displays assigned inventory items in job details dialog
- Type safety: Updated JobWithServices type to include inventoryItems array
- Design choice: Inventory remains dormant (not deducted) until job marked as "finished" to avoid premature deductions

### November 15, 2025 - Inventory Management Feature
- Added comprehensive inventory tracking system with four categories:
  - Office Supplies: General office items tracked by pieces/boxes
  - Business Consumables: Business supplies with flexible unit tracking
  - Powder: Coating powder tracked by weight (pounds/ounces)
  - Ceramic: Ceramic materials tracked by volume (ounces)
- Database: Created `inventory` table with category, name, description, quantity, unit, and price fields
- Backend: Implemented full CRUD operations with admin-only access control
- Frontend: Built responsive Inventory page with category-grouped card layout
- Navigation: Added Inventory link to sidebar (admin/full_admin access only)
- Permissions: Enforced admin-only access throughout the stack

## External Dependencies

*   **Database Service**: Neon Serverless PostgreSQL (`@neondatabase/serverless`)
*   **UI Component Libraries**: Radix UI, Lucide React, embla-carousel-react
*   **Date Handling**: date-fns
*   **Styling**: Tailwind CSS, class-variance-authority, tailwind-merge