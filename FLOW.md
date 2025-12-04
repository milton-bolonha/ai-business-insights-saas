# Application Flow and API Documentation

This document outlines the application's user flow, data handling, and API structure, detailing the distinction between Guest and Member experiences and the process of upgrading via Stripe.

## 1. Core Concepts

- **Workspace:** The primary container for all user data. A user can have multiple workspaces.
- **Dashboard:** A canvas within a Workspace. Each Workspace can have multiple Dashboards.
- **Tiles:** AI-generated content cards that are the core feature. They exist within a Dashboard.
- **Notes & Contacts:** Additional resources that can be added to a Dashboard.

## 2. User Types: Guest vs. Member

The application has two distinct user modes:

### Guest Mode
- **Authentication:** No authentication is required. The user is anonymous.
- **Data Storage:** All data (workspaces, dashboards, notes, etc.) is persisted exclusively in the browser's `localStorage`. This is managed by helpers in `src/lib/storage/dashboards-store.ts`.
- **Limitations:** Guests have strict usage limits on the number of items they can create (e.g., workspaces, tiles, notes).
- **Data Migration:** When a guest signs up to become a member, their `localStorage` data is migrated to the MongoDB database.

### Member Mode
- **Authentication:** Users are authenticated using Clerk.
- **Data Storage:** All data is stored in a MongoDB database, allowing persistence across devices and sessions.
- **Usage Limits:** Members have significantly higher usage limits, managed via a subscription model.

## 3. API Endpoint Overview

The backend is built with Next.js API Routes. Here's a summary of the key endpoints under `/api`:

- **/api/workspace**: Handles CRUD operations for workspaces.
- **/api/workspace/notes**: Handles CRUD for notes within a dashboard.
- **/api/workspace/contacts**: Handles CRUD for contacts within a dashboard.
- **/api/workspace/tiles**: Handles CRUD for AI tiles.
- **/api/workspace/tiles/[tileId]/chat**: Manages chat interactions with a specific tile.
- **/api/generate**: The core endpoint for AI content generation via OpenAI.
- **/api/stripe/checkout**: Initiates a Stripe payment session for upgrading an account.
- **/api/webhooks/stripe**: Listens for webhook events from Stripe to confirm successful payments.
- **/api/migrate-guest-data**: Handles the migration of a guest's local data to the database upon account creation.
- **/api/usage**: Fetches the current usage statistics for the user.

## 4. Detailed Flows

### Guest User CRUD Flow (e.g., Creating a Note)

1.  **UI Interaction:** The user adds a note through the UI in `NotesPanelAde.tsx`.
2.  **Client-Side State:** A TanStack Query mutation (`useCreateNote` from `note.queries.ts`) is called.
3.  **API Request:** The mutation sends a `POST` request to `/api/workspace/notes`. Since the user is a guest, no authentication token is sent.
4.  **Backend Authorization:** The `authorize()` function is called in the API route. It detects the absence of a `userId` and sets the user's role to `GUEST`.
5.  **Data Persistence:** The route handler, instead of calling the database service, uses functions from `src/lib/storage/dashboards-store.ts` to write the new note directly into the `workspaces` key in the browser's `localStorage`.
6.  **UI Update:** The TanStack Query invalidates relevant queries, causing the UI to refetch the local data and display the new note.

### Member User CRUD Flow (e.g., Creating a Note)

1.  **UI Interaction:** The flow starts identically in the UI.
2.  **Client-Side State:** `useCreateNote` is called.
3.  **API Request:** The mutation sends a `POST` request to `/api/workspace/notes`. Clerk's middleware attaches the user's authentication token.
4.  **Backend Authorization:** The `authorize()` function finds a `userId` and identifies the user as a `MEMBER`.
5.  **Data Persistence:** The API route handler calls `noteService.createNote()`.
6.  **Service Layer:** The `noteService` interacts with the `Note` Mongoose model (`src/lib/db/models/Note.ts`) to create a new document in the MongoDB database, associated with the correct `workspaceId` and `dashboardId`.
7.  **UI Update:** The mutation succeeds, queries are invalidated, and the UI refetches the updated data from the backend.

### Upgrade and Payment Flow

1.  **Limit Reached:** The user performs an action that exceeds their guest usage limit (e.g., creating a new tile).
2.  **Upgrade Prompt:** The UI, likely checking state from `authStore`, displays an `UpgradeModal`.
3.  **Initiate Checkout:** The user clicks "Upgrade." This action calls a function (e.g., `handlePayment`) which triggers a TanStack Query mutation that sends a request to `/api/stripe/checkout`.
4.  **Stripe Session:** The backend API route communicates with Stripe, creates a new checkout session with pre-defined product details, and returns the session URL.
5.  **Redirect to Stripe:** The frontend redirects the user to the Stripe-hosted checkout page.
6.  **Payment Success & Webhook:** The user completes the payment on Stripe. Stripe then sends a `checkout.session.completed` event to the webhook endpoint at `/api/webhooks/stripe`.
7.  **Webhook Handler:** The webhook handler verifies the event's authenticity. It extracts the `client_reference_id` (which should contain the user's ID) and the customer's email from the event. It then updates the user's record in the database (e.g., sets their plan to 'pro', updates usage limits).
8.  **Onboarding:** The user is redirected back to the application. The application should now recognize them as a paid member. If they were a guest, they are guided through the member onboarding flow (`OnboardingWizard.tsx`), which is managed by `onboarding.machine.ts`. During this process, their guest data is migrated via the `/api/migrate-guest-data` endpoint.
9.  **Access Granted:** The user's `authStore` state is updated, their limits are increased, and they can now use the member-only features.
