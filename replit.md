## Overview

Coat Check is a comprehensive coating job management application designed for coating businesses. It provides a clean, productivity-focused interface for tracking customers, jobs, estimates, and notes. The system supports customer relationship management, detailed job tracking with various coating types (powder/ceramic/misc), efficient estimate creation with simplified service selection, and internal note-taking. The application aims to streamline operations and enhance productivity for coating businesses.

## Recent Changes (November 13, 2025)

### Multi-Service Jobs System (Latest - November 13, 2025)
- **Complete Multi-Service Implementation**: Jobs can now have multiple services with individual add/remove capability
  - **Database Schema**: Created `job_services` junction table for many-to-many relationship (jobId, serviceId, serviceName, servicePrice, quantity)
  - **Backward Compatibility**: Kept legacy `serviceId` column in jobs table to prevent production migration failures during publishing
  - **Storage Layer**: Implemented `createJobWithServices` and `updateJobWithServices` with PostgreSQL transactions for atomic operations
  - **Backend Routes**: POST/PATCH /api/jobs accept `serviceIds` array, auto-calculate price from services (manual override supported)
  - **JobForm Component**: 
    - Add multiple services via dropdown above items field
    - **Space-Efficient Layout**: Services displayed as compact single-line rows (not cards) to maximize vertical space
    - Each row shows: service name + price + remove button (X icon) in one line
    - **Editable Total**: Price field auto-populates with service total and can be customized on-the-fly
    - Helper text shows "Auto-calculated from services: $XX.XX" when using auto value
    - Price field label indicates "(Editable)" when services are selected
  - **Form Validation**: Requires at least one service to be selected
  - **Migration Applied**: Database schema updated using `npm run db:push --force`
  - **Publishing Fix**: Restored `serviceId` column for backward compatibility to resolve production deployment migration failures
  - **Testing**: End-to-end tests confirmed adding/removing services, compact row layout, editable pricing, and job persistence work correctly

### Username/Password Authentication System (November 13, 2025)
- **Complete Authentication Redesign**: Replaced Replit OAuth with simple username/password authentication
  - **Login System**: Clean login page with username/password form using shadcn components
  - **Session Management**: Secure sessions with PostgreSQL storage via `connect-pg-simple`
  - **Password Security**: Bcrypt hashing with salt rounds of 10
  - **Username Handling**: Case-insensitive lookups (LOWER() comparison in SQL)
  - **User Roles**: Two roles - Admin (full access) and Manager (estimates + services read-only)
  - **Default Role**: New users default to "admin" role
  - **Test Users**: 
    - Admin: username=`admin`, password=`admin` (case-insensitive)
    - Manager: username=`manager`, password=`manager` (case-insensitive)
  
- **Backend Implementation**:
  - Created `SessionUser` type (`{id, username, role}`) for frontend state
  - Separated API validation type (`InsertUser` with password) from storage type (`NewUserInsert` with passwordHash)
  - Authentication endpoints: `POST /api/login`, `POST /api/logout`, `GET /api/user`
  - Role-based middleware: `isAuthenticated`, `isAdmin`, `isManagerOrAbove`
  - Permission matrix enforced on all API routes:
    - **Admin only**: Customers, Jobs, Notes, Users, Services (POST/PATCH/DELETE), Convert-to-job
    - **Manager+**: Estimates (full CRUD), Services (GET read-only)

- **Frontend Integration**:
  - Updated `useAuth()` hook with login/logout mutations and SessionUser typing
  - Created dedicated `/login` page replacing Landing page for unauthenticated users
  - Updated header to display username (2-character initials for avatar)
  - Removed dependencies on firstName, lastName, profileImageUrl fields
  - **ProtectedRoute**: Shows AccessDenied page for unauthorized access (no redirects)
  - **Services Page**: Strict read-only UI for managers (all edit/delete controls hidden)
  - **Sidebar**: Dynamically filters menu items based on user role
  - **401 Handling**: Returns null instead of throwing error to prevent loading screen bugs

### Mobile Optimization
- **Comprehensive Mobile Responsiveness**: All pages now fully optimized for mobile devices with consistent patterns:
  - **Page Padding**: All pages use `px-4 sm:px-0` for mobile edge padding
  - **Responsive Spacing**: Progressive spacing using `space-y-5 sm:space-y-6 md:space-y-8`
  - **Touch Targets**: All interactive elements meet 44px minimum touch target requirement
  - **Card-Based Views**: Mobile views use cards (md:hidden) with desktop tables (hidden md:block) at 768px breakpoint
  
- **Dashboard Mobile**: Single-column metric tiles, 180px chart height on mobile (260px desktop), stacked recent jobs cards, dual temperature gauge with flex-wrap
- **Customers Mobile**: Full card view with customer info, metrics, and action buttons properly sized
- **Services Mobile**: Card view with default button sizes (not sm) for proper touch targets
- **Users Mobile**: Card view with per-user mutation loading states (no global disabling)
- **Jobs Mobile**: Card view with status badges, customer info, and job details; newest jobs first sorting
- **Notes Mobile**: Responsive cards with stacked author/timestamp, full-width filter on mobile, smaller avatars
- **Estimates Mobile**: Stacked estimate cards, full-width search and buttons on mobile, dark mode status badges

### Previous Features
- **Service-Based Estimates**: Estimates form now displays all available services from the database (replacing hardcoded Powder/Ceramic/Misc dropdown). Backend automatically derives serviceType from selected service category, creates estimate_service linkage, and sets total based on service price.
- **Jobs Page UX**: Job row clicks now show full details dialog instead of opening edit mode. Edit action moved to 3-dot dropdown menu for cleaner interaction.
- **Customer Metrics**: Added "Total Jobs" column to Customer page showing complete job count (not just active jobs). Backend updated to return totalJobsCount metric.
- **Jobs Page Sorting**: Non-closed jobs (status !== 'finished' and !== 'paid') now appear at top of list, sorted by newest date first. Closed jobs follow below, also sorted by newest date first.
- **Coating Type Standardization**: Updated all forms and backend to use "misc" instead of "both" for mixed coating jobs.
- **UI Improvements**: All dropdown placeholders changed to "Select" for consistency.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with **React** and **TypeScript**, using **Vite** for tooling. **Wouter** handles client-side routing, and **TanStack Query** manages server state with aggressive caching. UI components are based on **shadcn/ui** and **Radix UI primitives**, styled with **Tailwind CSS**. Forms are managed with **React Hook Form** and validated using **Zod schemas** shared with the backend.

### Backend Architecture

The backend is built with **Express.js** and **TypeScript**, providing a **RESTful API** design. It includes custom middleware for logging and JSON parsing. API endpoints are resource-based and utilize **Zod schema validation** for request bodies. A `DatabaseStorage` implementation handles all CRUD operations, separating data access logic from routes. Authentication and role-based access control are implemented using **username/password authentication** with bcrypt hashing and a two-role permission system:
- **Admin**: Full access to all features including user management, customers, jobs, services (full CRUD), estimates, and notes
- **Manager**: Access to estimates (full CRUD) and services (read-only view only)

Route protection is enforced via middleware (`isAuthenticated`, `isAdmin`, `isManagerOrAbove`) with frontend route guards showing AccessDenied page for unauthorized access. Secure session management is handled via `connect-pg-simple`.

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