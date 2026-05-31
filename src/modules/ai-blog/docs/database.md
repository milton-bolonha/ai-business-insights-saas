# Database Architecture and Intelligent Search

The data layer of the I/O Automatic Blog module is entirely isolated within `src/modules/ai-blog/db/`. It leverages MongoDB via Mongoose, ensuring that the heavy structural requirements of an SEO platform do not pollute or slow down the global user, billing, or workspace tables.

## 1. Domain-Specific Schemas

The module defines explicit schemas tailored for advanced content publishing:
- **`BlogPost` Schema:** Handles extreme variability in content state (draft, scheduled, published). It embeds a strict `seoSchema` sub-document containing metadata (Titles, Descriptions, Canonical URLs, Schema.org payloads) and tracks AI generation metadata (Search Intents, Generation Model ID).
- **`BlogCategory` Schema:** Engineered to support deep hierarchical taxonomy. It includes self-referential `parentId` fields for infinite nesting and an `isPillar` boolean to explicitly mark categories as "Pillar Pages" for cluster mapping.

## 2. Intelligent Search Optimization

The modern internet demands search capabilities far beyond basic SQL `LIKE '%keyword%'` queries. The `BlogPost` schema implements two advanced search paradigms directly at the database engine level.

### Compound Text Indexing (Lexical Search)
To facilitate ultra-fast searches on the public-facing blog without requiring a dedicated indexing service like ElasticSearch or Algolia, the schema defines native MongoDB Compound Text Indexes.

```typescript
blogPostSchema.index(
  { title: "text", excerpt: "text", content: "text", "seo.focusKeywords": "text" },
  { weights: { title: 10, "seo.focusKeywords": 8, excerpt: 5, content: 1 } }
);
```
**Mechanism:** MongoDB tokenizes the text fields and creates an inverted index.
**Relevance Tuning:** By assigning mathematical weights, the database natively understands context. An article containing the user's query in its `title` will automatically outrank an article that merely mentions the query deep within its `content` body, guaranteeing highly relevant search results out of the box.

### Vector Search (Semantic Search & Embeddings)
Lexical search fails when users search for concepts rather than exact words (e.g., searching "how to increase website traffic" should return an article titled "Ultimate Guide to Audience Growth").

To solve this, the schema is future-proofed with an embedding field:
```typescript
embedding: { type: [Number], select: false }
```
**Mechanism:** 
1. When an article is generated, an embedding model (like `text-embedding-3-small` from OpenAI) converts the article into a high-dimensional mathematical vector (an array of floats).
2. This array is stored in the `embedding` field.
3. When a user queries the blog, their search query is also converted into a vector.
4. MongoDB Atlas Vector Search ($knnBeta / $vectorSearch) performs a cosine-similarity mathematical calculation to find the closest vectors in the database. 
5. The system retrieves semantically matched content, fundamentally upgrading the search experience from keyword-matching to true "Intelligent Understanding."
