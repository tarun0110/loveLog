# LoveTimeline - Date Memory Application

## Overview

LoveTimeline is a romantic memory-sharing application built for couples to document and cherish their dates together. The app features a timeline-based interface with photo galleries, ratings, comments, and collaborative memory creation with an approval system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: React Query (TanStack Query) for server state
- **Styling**: Tailwind CSS with custom scrapbook-themed design
- **Component Library**: Radix UI primitives with shadcn/ui components
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Style**: RESTful API with JSON responses
- **Session Management**: Express sessions with PostgreSQL storage
- **Authentication**: Replit Auth with OpenID Connect

### Database Architecture
- **Database**: PostgreSQL (via Neon serverless)
- **ORM**: Drizzle ORM with type-safe queries
- **Schema**: Shared schema definitions between client and server
- **Migrations**: Drizzle Kit for database migrations

## Key Components

### Authentication System
- Replit Auth integration for user management
- Session-based authentication with PostgreSQL session store
- User profiles with email, name, and profile images
- Automatic session handling and renewal

### Partnership Management
- Couple relationship system with invitation/approval flow
- Partnership status tracking (pending, active, ended)
- Collaborative timeline sharing between partners

### Memory System
- Timeline-based memory storage with photos
- Multi-rating system (food, place, overall experience)
- Approval workflow - memories require partner approval to be visible
- Rich descriptions with both summary and detailed views
- Comment system for each memory

### Photo Management
- Multiple photos per memory with captions
- Gallery view with navigation controls
- Responsive image display with polaroid-style design

### Search and Filtering
- Text search across memory titles and descriptions
- Filter by location, rating, and date ranges
- Real-time search with query parameter persistence

## Data Flow

1. **User Authentication**: Users log in via Replit Auth, creating or retrieving user profiles
2. **Partnership Creation**: Users invite partners by email, creating pending partnerships
3. **Memory Creation**: Authenticated users create memories with photos and ratings
4. **Approval Process**: Memories remain pending until approved by partner
5. **Timeline Display**: Approved memories appear in chronological order on shared timeline
6. **Interactive Features**: Users can view details, add comments, and search/filter memories

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless driver
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **express**: Web server framework
- **passport**: Authentication middleware

### UI Dependencies
- **@radix-ui/**: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **wouter**: Lightweight router

### Development Tools
- **vite**: Build tool and dev server
- **typescript**: Type checking
- **drizzle-kit**: Database migration tool

## Deployment Strategy

### Build Process
- Frontend: Vite builds React app to `dist/public`
- Backend: esbuild bundles server code to `dist/index.js`
- Database: Drizzle migrations applied via `db:push` command

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string (required)
- `SESSION_SECRET`: Session encryption key
- `REPL_ID`: Replit environment identifier
- `ISSUER_URL`: OpenID Connect issuer (defaults to Replit)

### Development vs Production
- Development: Uses Vite dev server with HMR
- Production: Serves static files from Express server
- Database schema shared between environments via `shared/schema.ts`

### Security Considerations
- Session-based authentication with secure cookies
- CSRF protection via session validation
- Input validation with Zod schemas
- Rate limiting through middleware
- Secure file upload handling for photos