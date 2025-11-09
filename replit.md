# ShopFlow - Shop Management System

## Overview

ShopFlow is a comprehensive shop management application designed for businesses to track customers, jobs, estimates, and notes. The system provides a clean, productivity-focused interface for managing day-to-day shop operations with features for customer relationship management, job tracking, estimate creation, and internal note-taking.

The application follows a modern full-stack architecture with a React frontend and Express backend, utilizing PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- **estimates**: Financial quotes linked to customers and optionally to jobs
- **notes**: Text notes linked to either jobs or customers

**Relationships**
- Jobs reference customers (many-to-one)
- Estimates reference customers (many-to-one) and optionally jobs (many-to-one)
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