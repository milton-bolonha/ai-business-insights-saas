# Architectural Blueprint & System Integration

This document outlines the architectural paradigms that govern the I/O Automatic Blog module. The core philosophy driving this architecture is **Domain-Driven Design (DDD)** combined with a **Headless API-First** approach.

## 1. The App Tag Mechanism (SaaS Hub Integration)

To prevent the global application core from becoming bloated with domain-specific logic, the platform utilizes a dynamic activation model known as "App Tags".

### Registration Flow
The module must explicitly declare its existence to the global system via the central registry:
- **Registry File:** `src/lib/app-tags.ts`
- **Identifier:** `ai_blog`
- **Template ID:** `template_ai_blog`

### Dynamic UI Composition
The global routing layer (`src/containers/admin/AdminContainer.tsx`) acts as an orchestrator. It monitors the active workspace's selected template. If the `template_ai_blog` is active:
1. The global navigation (`AdminNavigation.tsx`) injects the Blog-specific tabs (e.g., "Blog Engine").
2. The core container dynamically mounts the `AiBlogBoard.tsx` interface.
3. This ensures that unused modules consume zero client-side processing or rendering cycles for tenants who do not subscribe to them.

## 2. Headless API Infrastructure

A defining characteristic of this module is that the User Interface (both Admin and Public Portal) never communicates directly with the database or the engines. All interactions flow through a dedicated RESTful API layer.

### API Routing Layer (`src/app/api/blog/`)
The API handles all CRUD operations and task dispatching:
- **Strict Validation:** Incoming payloads are validated using schemas (e.g., Zod) before processing.
- **Tenant Isolation:** Every request is routed through the `getAuthWorkspace(req)` middleware, ensuring that data is strictly partitioned by `workspaceId`. A tenant can never accidentally or maliciously query another tenant's posts.
- **Decoupling:** By treating the Admin UI and the Public Portal merely as "API Clients," we guarantee that the blog engine can eventually support Mobile Applications, CLI tools, or third-party integrations with zero modifications to the core logic.

## 3. Public Portal and Edge Rendering

The public-facing blog (`src/app/blog/[tenantId]`) is designed for extreme performance, targeting perfect 100/100 Lighthouse scores.

### Incremental Static Regeneration (ISR)
Instead of rendering pages dynamically on every user request (SSR), the platform utilizes Next.js ISR (`export const revalidate = 60`).
- The page generates static HTML at the Edge.
- Traffic spikes do not impact database performance, as the database is only queried once every 60 seconds (at most) in the background.
- This pattern is critical for SEO, as search engine crawlers receive instantaneous Time-To-First-Byte (TTFB) responses.

## 4. State Management Isolation

While the global SaaS platform relies heavily on Zustand (`useWorkspaceStore`, `useAuthStore`), the AI Blog module minimizes its reliance on global state for its internal data (posts, categories, tags). 

Instead, the `AiBlogBoard` uses local data fetching mechanisms (e.g., standard `useEffect` fetches, or SWR/React Query). This ensures that the global state tree doesn't grow exponentially when thousands of blog posts are generated, preventing memory leaks and UI lag.
