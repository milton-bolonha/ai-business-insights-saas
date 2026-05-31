# Intelligence Engines

The core differentiator of the I/O Automatic Blog lies within its Intelligence Engines (`src/modules/ai-blog/engines/`). These are highly specialized classes responsible for orchestrating the generation of content and the technical optimization of the publishing output.

---

## 1. AI Content Engine (`ai-content-engine.ts`)

Standard Large Language Model (LLM) generation techniques often result in homogenized, low-value text blocks that are penalized by modern search engines (e.g., Google's "Helpful Content Update"). The `AIContentEngine` circumvents this through rigorous orchestration.

### The "Entity-First" Generation Strategy
The engine enforces an "Entity-First" paradigm through complex prompt engineering. Instead of requesting narrative prose, the engine instructs the LLM to process the topic via a rigid structure:
1. **Entity Identification:** Define the core subjects, nouns, and authoritative concepts related to the target keyword.
2. **Semantic Block Construction:** Organize the data into discrete, parsable modules (e.g., "Key Takeaways" bullet lists, Definition blocks, Step-by-step guides).
3. **Q&A Optimization:** Automatically generate natural language Frequently Asked Questions (FAQs) mapped directly to user search intent. This specifically targets featured snippets and AI Overviews (like Perplexity or ChatGPT search).

### Topical Authority Mapping
When generating a "Cluster," the engine does not work in isolation. It evaluates the parent category (the "Pillar Page") and cross-links the newly generated article to related cluster nodes, artificially simulating deep subject matter expertise.

---

## 2. Advanced SEO Optimization Engine (`seo-engine.ts`)

The SEO Engine is a highly advanced deterministic subsystem that handles the technical requirements of modern web crawling. Rather than relying on basic linear heuristic scores, the engine calculates a sophisticated, weight-based enterprise-grade SEO report.

### Dynamic JSON-LD Schema.org Injection
Search engines rely heavily on structured data. The SEO Engine automatically translates the Mongoose database records into rich `application/ld+json` payloads.
- **Article Schema:** Automatically defines the Headline, Author, Publication Timeline, and Canonical URLs.
- **LocalBusiness Schema (GEO SEO):** If the tenant operates within specific geographic coordinates, the engine can inject location-based schemas to boost hyper-local search visibility.

### Weighted Scoring & Non-Linear Transformation Matrix
The engine implements a professional weighted scoring algorithm that maps discrete metrics onto non-linear transformation functions $T_i(x_i)$ before aggregating the results:

$$S = \frac{\sum w_i \cdot T_i(x_i)}{\sum w_i} - \text{Penalties}$$

#### Dimension Weights ($w_i$):
- **Structure (25%):** Meta title/description existence and ideal lengths, slug friendliness, focus keyword matching.
- **Content & Keyword Density (25%):** Non-linear word count tiers. Ideal keyword density `[0.5% - 2.2%]` yields maximum score; high density `[2.2% - 4.0%]` yields lower scores; density above `4.0%` yields zero score for this sub-dimension.
- **Semantic Coverage (20%):** Scans for contextually expected vocabulary/entities (co-occurrence tags like Next.js, SSR, sitemap for React SEO focus keyword) to establish true topical authority.
- **Readability & Flow (10%):** Evaluates average words per sentence and paragraph lengths to enforce high readability.
- **Links & Interlinking (10%):** Evaluates hyperlink density, and checks for a healthy mix of internal and external authority links.
- **Media Optimization (5%):** Evaluates image presence and alt-text description accessibility.
- **Freshness Index (5%):** Scans for mentions of the current calendar year and recent updates.

#### Score Penalties:
Negative scoring is applied deterministically to penalize bad SEO practices:
- **Keyword Stuffing Penalty (-20 pts):** Applied if keyword density exceeds `5.0%`.
- **Missing H1 Penalty (-10 pts):** Applied if no H1 headings are defined in the body.
- **Missing Meta Description Penalty (-8 pts):** Deducts points to enforce CTR optimizations.

---

## 3. Real-time Live UI Analyzer Widget
The advanced SEO score calculations are fully integrated into both `PostEditorPanel.tsx` and `PageEditorPanel.tsx` using a dynamic React hook setup. 

- **Live Evaluation:** As the user writes, edits titles, meta descriptions, focus keywords, or article body text, a `useEffect` hook triggers the `SEOEngine.calculateSEOScore()` dynamically.
- **Circular Progress Gauge & Grades:** Renders a circular animated progress ring reflecting the real-time score alongside an **SEO Grade Letter (A+ to E)** and semantic status (Excellent, Strong, Moderate, Weak, Critical).
- **Search Intent Classifier:** Automatically parses keywords to classify intent (`Informational`, `Transactional`, `Navigational`, `Comparative`) and cross-validates if content holds appropriate matching structures.
- **Score Breakdown & Structured Insights:** Explains exactly what points were scored, listing top positives and suggestions/negatives to guide the content author dynamically.
