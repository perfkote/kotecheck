## Overview

Coat Check is a comprehensive coating job management application designed for coating businesses. It provides a clean, productivity-focused interface for tracking customers, jobs, estimates, and notes. The system supports customer relationship management, detailed job tracking with various coating types, efficient estimate creation, and internal note-taking. The application aims to streamline operations and enhance productivity for coating businesses.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with **React** and **TypeScript**, using **Vite** for tooling. **Wouter** handles client-side routing, and **TanStack Query** manages server state with aggressive caching. UI components are based on **shadcn/ui** and **Radix UI primitives**, styled with **Tailwind CSS**. Forms are managed with **React Hook Form** and validated using **Zod schemas** shared with the backend.

### Backend Architecture

The backend is built with **Express.js** and **TypeScript**, providing a **RESTful API** design. It includes custom middleware for logging and JSON parsing. API endpoints are resource-based and utilize **Zod schema validation** for request bodies. A `DatabaseStorage` implementation handles all CRUD operations, separating data access logic from routes. Authentication and role-based access control are implemented using **Replit Auth** with OAuth support and a custom permission system (Admin, Manager, Employee, Read-Only roles). Secure session management is handled via `connect-pg-simple`.

### Database Architecture

The application uses **PostgreSQL** with **Drizzle ORM** for type-safe database operations. The schema, defined in `shared/schema.ts`, includes tables for `customers`, `jobs`, `services`, `estimates`, `estimate_services`, `notes`, `users`, and `sessions`. Relationships include jobs linked to customers, many-to-many between estimates and services via `estimate_services`, and notes linked to jobs or customers. **Shared Zod schemas** generated from Drizzle ensure consistent data validation across the stack.

### UI/UX Decisions

The design follows principles similar to Linear and Material Design, using consistent spacing and typography with the Inter font family. The application supports both light and dark modes with theme-aware colors. Mobile optimization is a key focus, providing responsive layouts for dashboards and job listings, transitioning to card-based views on smaller screens. Key features like a dual temperature gauge, monthly revenue line graph, and a customer reviews widget enhance the user experience.

## External Dependencies

*   **Database Service**: Neon Serverless PostgreSQL (`@neondatabase/serverless`)
*   **UI Component Libraries**: Radix UI, Lucide React, embla-carousel-react
*   **Date Handling**: date-fns
*   **Styling**: Tailwind CSS, class-variance-authority, tailwind-merge
*   **Development Tools**: Replit-specific plugins (development banner, error overlay, cartographer), tsx, esbuild
*   **Authentication**: Replit Auth
```