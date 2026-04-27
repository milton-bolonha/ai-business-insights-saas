# App Tag Development Guide (Developer Documentation)

Documentation for creating, extending, and troubleshooting specialized "App Tags" (Templates) like **Trader**, **Borba Ranking**, and **Love Writers**.

---

## 🏗️ 1. Architecture of an "App Tag"

An App Tag in this SaaS represents a specialized workspace with its own AI agents, calculation engine, and unique UI components.

### Core Files
- **`src/lib/guest-templates.ts`**: The "Heart". Defines the template ID, tiles, prompts, and generation mode (parallel vs sequential).
- **`src/app/api/generate/route.ts`**: The "Brain". Orchestrates the logic, calls the calculation engines, and triggers the AI.
- **`src/lib/services/`**: The "Logic". Contains domain-specific services like `trade-ranking-service.ts` or `market-data-service.ts`.
- **`src/containers/admin/AdminContainer.tsx`**: The "Conductor". Swaps UI views based on the active template.

---

## 🚀 2. Creating a New App Tag

To create a new specialized ranking or dashboard:

1.  **Define the Template**: Add a new entry to `GUEST_DASHBOARD_TEMPLATES` in `src/lib/guest-templates.ts`.
2.  **Build the Service**: Create a new service in `src/lib/services/` to handle specific math/logic for that tag.
3.  **Integrate Generation**: Update `api/generate/route.ts` to detect your `templateId` and call the service before calling OpenAI.
4.  **Special UIs**: If needed, create a specialized component (like `TradeRankingMeter`) and render it in `AdminContainer.tsx` based on the template type.

---

## 🔗 3. External API Integration (The "Master Login" Pattern)

When an external API (like Mercado Livre) requires a user context to avoid `403 Forbidden` errors:

1.  **OAuth 2.0 Flow**: Implement a "Master Login" where the site owner (Admin) authorizes the app once.
2.  **Persistence**: Save the `accessToken` and `refreshToken` in the `integrations` collection in MongoDB.
3.  **Auto-Refresh**: In your service layer, check the `expiresAt` field. If expired, use the `refreshToken` to update the database silently before performing the search.
4.  **Transparency**: The final user should never see the connection; the backend uses the Admin's "Master Token" to fetch data for everyone.

---

## 🛠️ 4. Troubleshooting & Common Pitfalls

### API Errors
- **`403 Forbidden`**: Usually means the API requires a User Token (Master Login) instead of an App Token. Check if your Redirect URI is correctly registered in the provider's portal.
- **`502 Bad Gateway`**: Integrated in the ML proxy to signal upstream API failures while keeping the dashboard alive.

### TypeScript / Build Errors
- **`Omit<Toast, "id">`**: Ensure you use `variant: "success" | "destructive"` instead of `type`.
- **`Property does not exist on type...`**: When building complex input objects (like `tradeInput`), explicitly type them (e.g., `const input: TradeRankingInput = { ... }`) to allow adding late-stage properties like `marketStats`.

### Database
- **Connection Issues**: The app uses a **Circuit Breaker** (see `mongodb.ts`) to prevent hanging. If MongoDB is down, it should "fail open" and allow generation using theoretical data.

---

## 📈 5. Future Extensions

- **New Market Proxies**: Follow the pattern in `api/market/ml/route.ts` to create proxies for Amazon, eBay, or local ERPs.
- **Advanced Meters**: The `TradeRankingMeter` uses SVG. You can create similar gauges for "Risk", "Velocity", or "Market Share".
- **Dynamic Themes**: Use the `AdeAppearanceTokens` in `AdminTopHeader` to change colors/branding based on the product category.

---

> [!TIP]
> Always verify the **Redirect URI** in the Cloud provider portal before deploying. For Vercel, it must match your production domain.
