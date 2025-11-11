# Coat Check - Coating Job Management System

## Overview

Coat Check is a comprehensive coating job management application designed for coating businesses to track customers, jobs, estimates, and notes. The system provides a clean, productivity-focused interface for managing coating operations with features for customer relationship management, job tracking with coating types, estimate creation, and internal note-taking.

The application follows a modern full-stack architecture with a React frontend and Express backend, utilizing PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**Analytic Center Rename & Weather Widget (November 11, 2025)**
- Renamed "Dashboard" to "Analytic Center" throughout application (page title, sidebar, settings, charts)
- Added live Orlando, FL weather widget displaying temperature and humidity
- Weather widget shows trend arrows (up/down/stable) based on 3-hour comparison
- Uses Open-Meteo API (free, no API key required) with 5-minute auto-refresh
- Migrated localStorage key from "dashboard-tiles" to "analytic-center-tiles" with automatic preference migration
- Weather widget includes error handling and loading states

**Estimate to Job Conversion (November 11, 2025)**
- Added "Convert to Job" button on estimate cards
- Backend endpoint creates jobs from estimates with automatic customer lookup/creation
- Coating type inference from service categories (powder/ceramic/both)
- Status tracking prevents duplicate conversions
- Navigates to Jobs page after successful conversion
- Status badges on estimates (Draft, Sent, Approved, Rejected, Converted)

**Dashboard Metrics Chart (November 10, 2025)**
- Added dynamic chart visualization displaying all active dashboard tile metrics
- Chart uses single-axis BarChart from Recharts with custom tooltips
- Automatically updates when tiles are enabled/disabled in settings
- Excludes "Most Common" tile (non-numeric complex data)
- Shows formatted values in tooltips (currency, days, counts)
- Metric count displayed in chart header

## System Architecture

### Frontend Architecture

**Framework & Tooling**
- **React** with TypeScript for type-safe component development
- **Vite** as the build tool and development server
- **Wouter** for lightweight client-side routing
- **TanStack Query** (React Query) for server state management and data fetching

**UI Component System**
- **shadcn/ui** component library with Radix UI primitives
- **Tailwind CSS** for utility-first styling
- Custom design system based on Linear and Material Design principles (documented in `design_guidelines.md`)
- Consistent spacing primitives (2, 4, 6, 8) and typography hierarchy
- Inter font family for all UI elements

**State Management Approach**
- Server state managed via TanStack Query with aggressive caching (`staleTime: Infinity`)
- No global client state - forms use React Hook Form with local state
- Query invalidation pattern for optimistic updates after mutations

**Form Handling**
- React Hook Form for form state and validation
- Zod schemas (shared between client and server) for validation
- `@hookform/resolvers` for Zod integration

### Backend Architecture

**Server Framework**
- **Express.js** with TypeScript
- Custom middleware for request logging and JSON parsing
- RESTful API design pattern

**API Structure**
- Resource-based endpoints (`/api/customers`, `/api/jobs`, `/api/estimates`, `/api/notes`)
- Standard HTTP methods (GET, POST, PATCH, DELETE)
- Zod schema validation for request bodies using shared schemas
- Consistent error handling with appropriate status codes

**Data Access Layer**
- Storage abstraction via `IStorage` interface
- `DatabaseStorage` implementation provides all CRUD operations
- Separation of concerns between routes and data access logic

### Database Architecture

**ORM & Schema**
- **Drizzle ORM** for type-safe database operations
- Schema defined in `shared/schema.ts` for code sharing between client and server
- Automatic TypeScript type generation from database schema

**Database Schema**
- **customers**: Core customer information (name, email, phone, address)
- **jobs**: Work orders linked to customers with status and priority tracking
- **services**: Reusable service definitions with pricing (categories: powder, ceramic, prep)
- **estimates**: Service-based financial quotes with customer info and dates
- **estimate_services**: Junction table linking estimates to services (stores service snapshot)
- **notes**: Text notes linked to either jobs or customers

**Relationships**
- Jobs reference customers (many-to-one)
- Estimates contain customer name and phone directly (denormalized for flexibility)
- Estimate services reference estimates and services (many-to-many via junction table)
- Notes reference either jobs or customers (many-to-one)

**Data Validation**
- Shared Zod schemas generated from Drizzle tables using `drizzle-zod`
- Single source of truth for validation rules
- Type safety from database to UI

### External Dependencies

**Database Service**
- **Neon Serverless PostgreSQL** via `@neondatabase/serverless`
- WebSocket-based connection pooling for serverless environments
- Connection string configured via `DATABASE_URL` environment variable

**UI Component Libraries**
- **Radix UI**: Headless, accessible component primitives (dialogs, dropdowns, menus, etc.)
- **Lucide React**: Icon system
- **date-fns**: Date formatting and manipulation
- **embla-carousel-react**: Carousel/slider functionality

**Development Tools**
- **Replit-specific plugins**: Development banner, error overlay, and cartographer for enhanced development experience
- **tsx**: TypeScript execution for development server
- **esbuild**: Production build bundling for server code

**Styling Dependencies**
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: Type-safe component variants
- **tailwind-merge**: Intelligent class merging via `cn` utility

**Type Safety**
- TypeScript throughout the entire stack
- Shared types between client and server via `shared/` directory
- Path aliases for clean imports (`@/`, `@shared/`)