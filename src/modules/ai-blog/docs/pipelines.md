# Asynchronous Pipelines and Queue Processing

Executing heavy AI generation tasks in modern, serverless hosting environments (such as Vercel) introduces critical limitations regarding execution duration. HTTP requests typically face hard timeouts (e.g., 10 seconds for Hobby plans, 60 seconds for Enterprise plans).

Generating a comprehensive "Topic Cluster" involving 30+ highly researched articles requires several minutes of API communication with external LLM providers (OpenAI, Anthropic). Attempting this synchronously via a standard REST API route would guarantee `504 Gateway Timeout` errors.

To solve this, the AI Blog module implements a decoupled Asynchronous Pipeline architecture located in `src/modules/ai-blog/pipelines/`.

## Architecture Flow: The Redis Queue Strategy

The pipeline operates on an Event-Driven architecture utilizing a fast, in-memory data store (Redis/Upstash).

### 1. The Dispatch Phase (API Route)
When an administrator triggers a mass-generation event via the UI:
- The Next.js API Route intercepts the request.
- It validates the payload and permissions.
- Instead of executing the generation, it serializes the task details (Topic, Keywords, WorkspaceID, Tone) and pushes them onto a Redis list (e.g., `LPUSH blog:generation:queue <payload>`).
- The API immediately responds to the client with `202 Accepted` and a Job ID. The UI can then display a "Processing in background" state.

### 2. The Worker Phase (Background Execution)
A dedicated, long-running worker process (or an external orchestrator like Inngest/QStash) actively monitors the Redis queue.
- **Dequeuing:** The worker pops tasks from the queue sequentially or in controlled parallel batches.
- **Execution:** The worker invokes the `AIContentEngine` to interface with the LLMs.
- **Persistence:** Upon successful generation, the worker connects directly to MongoDB to save the `BlogPost` document and updates the task status.

## Reliability and Error Handling

The pipeline architecture inherently provides enterprise-grade reliability:
- **Rate Limiting Protection:** External LLM APIs impose strict requests-per-minute (RPM) limits. The worker acts as a throttle, ensuring the system never triggers HTTP 429 (Too Many Requests) errors from OpenAI.
- **Retry Mechanisms:** If a network failure occurs during LLM generation, the worker can safely return the job to the queue and retry with exponential backoff.
- **Atomic Operations:** Tasks are processed independently. If Article 14 in a 30-article cluster fails, it does not crash the entire process; the remaining articles continue generating.
