# Gemini Project Context: AI SaaS Platform (Code-First Analysis)

This document provides a comprehensive, code-first overview of the AI SaaS Platform, based on a direct analysis of the source code. It is intended as an accurate context for development and future Gemini CLI interactions.

## 1. Project Overview

This is a full-stack AI-powered Software-as-a-Service (SaaS) application built with Next.js (App Router). The core of the application allows users to create **Workspaces** that contain **Dashboards**. These dashboards are canvases for AI-generated content **Tiles**, along with **Notes** and **Contacts**.

A critical architectural feature is the distinction between two user types:
*   **Guests**: Unauthenticated users whose data (`workspaces`, `usage`) is persisted entirely in the browser's `localStorage`. This provides a frictionless trial experience.
*   **Members**: Authenticated users (via Clerk) whose data is stored in a MongoDB database, enabling persistence across devices and higher usage limits.

The application is heavily interactive, relying on a sophisticated state management system and a backend composed of Next.js API Routes.

## 2. Core Architecture & Technologies

*   **Framework**: Next.js 16 / React 19
*   **Language**: TypeScript
*   **Database**: MongoDB with Mongoose for data modeling (`src/lib/db/models/`).
*   **Authentication**: Managed by **Clerk**, providing user session and identity.
*   **Authorization**: A custom authorization layer (`src/lib/auth/authorize.ts`) checks whether a user is a guest or member and grants access to resources accordingly.
*   **AI Content Generation**: **OpenAI** is used for generating content for Tiles. The logic is encapsulated in `src/lib/ai/tile-generation.ts`.
*   **Styling & Theming**: **Tailwind CSS** is used for styling. The application features a custom theming system (`src/lib/ade-theme.ts`) that allows for appearance customization, including background colors (`bgcolor`), which is managed via `useAppearanceManagement` hook.

## 3. State Management Strategy

The application employs a sophisticated "trifecta" of state management libraries, each with a distinct role:

1.  **Zustand (`src/lib/stores/`)**: Used for managing global, synchronous UI state.
    *   `authStore.ts`: Manages user authentication state, usage limits, and differentiates between `isGuest` and `isMember`.
    *   `workspaceStore.ts`: Holds the active workspace and dashboard state on the client, acting as the primary source of truth for the UI.
    *   `uiStore.ts`: Manages transient UI state like open modals and component selections.

2.  **TanStack Query (`src/lib/state/query/`)**: Manages all asynchronous operations and server state (caching, refetching, and optimistic updates).
    *   It's used for all API calls to create, update, and delete data (`tile.queries.ts`, `contact.queries.ts`, etc.).
    *   Mutations handle the communication with the backend, and on success, they often trigger invalidations to refetch and update the UI.

3.  **XState (`src/lib/state/machines/`)**: Used for modeling complex, multi-step, and long-running processes with finite states.
    *   `onboarding.machine.ts`: Manages the multi-step user onboarding wizard.
    *   `tileGeneration.machine.ts`: Orchestrates the complex flow of generating an AI tile, including handling loading, success, and error states.

## 4. Data Flow & Persistence

*   **Guest Flow**:
    1.  User interacts with the UI (e.g., adds a note).
    2.  A TanStack Query mutation calls the relevant Next.js API endpoint (e.g., `POST /api/workspace/notes`).
    3.  The API endpoint's logic, guided by the absence of a `userId`, uses helper functions in `src/lib/storage/dashboards-store.ts` to write the data directly to `localStorage`.
    4.  The `workspaceStore` on the client is then updated to reflect the change.

*   **Member Flow**:
    1.  User interacts with the UI.
    2.  A TanStack Query mutation calls the API endpoint.
    3.  The API endpoint identifies the authenticated user via Clerk (`getAuth`).
    4.  The request is processed by the relevant service (e.g., `noteService.ts`), which interacts with the MongoDB models (`src/lib/db/models/Note.ts`) to persist the data.
    5.  Optionally, the API invalidates a Redis cache (`src/lib/cache/redis.ts`).
    6.  On a successful response, TanStack Query automatically refetches the relevant data or updates the cache, causing the UI to re-render with the new information.

## 5. Key Project Structure Guide

*   `src/app/api/`: Location of all backend API routes. The folder structure directly maps to the URL paths.
*   `src/lib/db/models/`: Contains all Mongoose schemas (`Workspace.ts`, `Tile.ts`, etc.). This is the single source of truth for the database structure.
*   `src/lib/stores/`: Zustand stores for global client-side state.
*   `src/lib/state/query/`: TanStack Query hooks for all server interactions.
*   `src/lib/services/`: Backend service layer that contains the core business logic for handling data (e.g., `tileService.ts`).
*   `src/lib/ai/`: Contains all logic related to the OpenAI integration.
*   `src/containers/`: "Smart" components that often contain significant logic, connect to state management, and compose smaller UI components. `AdminContainer.tsx` is a central hub for the main dashboard.
*   `src/components/`: "Dumb" or presentational UI components.

## 6. Building and Running the Project

### Installation

```bash
npm install
```

### Running in Development Mode

```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

### Key Commands

*   `npm run dev`: Starts the development server.
*   `npm run build`: Builds the application for production.
*   `npm run lint`: Runs ESLint to check for code quality issues.
*   `npm run test:e2e`: Executes end-to-end tests using Playwright.
*   `npm run db:indexes`: Executes a script to create necessary indexes in MongoDB for performance.