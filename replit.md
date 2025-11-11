# Coat Check - Coating Job Management System

## Overview

Coat Check is a comprehensive coating job management application designed for coating businesses to track customers, jobs, estimates, and notes. The system provides a clean, productivity-focused interface for managing coating operations with features for customer relationship management, job tracking with coating types, estimate creation, and internal note-taking.

The application follows a modern full-stack architecture with a React frontend and Express backend, utilizing PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**Dual Temperature Gauge with Needles (November 11, 2025)**
- Added ceramic vs powder jobs comparison gauge to Analytic Center with speedometer styling
- Displays two side-by-side gauges with 240° arc sweep (210° to -30°) showing job counts
- Ceramic gauge arc uses chart-3 (orange) representing "hot" coating
- Powder gauge arc uses chart-2 (teal) representing "cool" coating
- Enhanced with black needle overlays that dynamically rotate based on job count
  - Needle rotation formula: -120° + (value/maxJobs × 240°)
  - Smooth 1000ms transition animations
  - 85px length, 6px width with rounded ends
  - Black/foreground color for universal visibility
- Added 12 hash marks along the gauge sweep for precision reading
  - 3px tall, 0.5px wide, 30% opacity
  - Evenly distributed from -120° to +120°
  - Black color matching needles
- Integrated CountUp animations for numeric displays (2-second duration)
- Added center hubs (24px diameter) with muted backgrounds
- Dynamic max value: 50 above highest metric (replaces fixed 100 minimum)
- Positioned between metric tiles and monthly revenue chart
- No title on card (removed "Performance Metrics")
- Increased size: inner radius 70px, outer radius 100px with 8px corner radius
- Unfilled arc portions shown at 30% opacity
- All elements include data-testid attributes for automated testing
- Theme-aware colors adapt to light/dark mode via CSS variables
- Dashboard order: Tiles → Gauges → Revenue Chart → Recent Jobs

**Dashboard Tiles & Light Mode Colors (November 11, 2025)**
- Reduced all Analytic Center tiles by 25% (smaller padding, fonts, icons)
- Updated light mode color scheme:
  - Sidebar: Changed to dark grey (25% lightness) with light text for contrast
  - Main background: Changed to very light grey (97% lightness, almost white)
  - Cards: White background to stand out against light grey canvas
  - Improved contrast ratios for better readability

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

**Monthly Revenue Line Graph (November 11, 2025)**
- Replaced bar chart with eye-catching monthly revenue line graph
- Shows revenue trends across all 12 months (Jan-Dec) for current year
- Uses AreaChart from Recharts with gradient fill (teal/cyan chart-2 color)
- Gradient fades from 80% opacity at top to 10% at bottom
- Line features 3px stroke with circular data point markers (5px radius)
- Active hover markers enlarge to 7px with primary color highlight
- Y-axis formatted with currency ($), X-axis shows month abbreviations
- Custom tooltips display month, year, and formatted revenue amount
- Calculates revenue from jobs filtered by receivedDate (current year)
- Guards against NaN with `Number(job.price || 0)` for missing prices
- Chart always visible with 350px height in responsive container

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