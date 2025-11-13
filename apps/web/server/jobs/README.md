# Job System

This directory contains job processors that run asynchronously via the job queue.

## Architecture

- **Shared Redis connection**: `server/lib/redis.ts` manages a singleton Redis connection
- **Job registry**: `server/lib/jobs.ts` provides a registry for job processors
- **Unified worker**: Started in `server/plugins/queue.ts`, handles all registered job types
- **Job processors**: Register processors in plugins using `registerJobProcessor()`

## Adding a New Job Type

### 1. Define your job data interface

```typescript
// server/lib/my-jobs.ts
export interface MyJobData {
  userId: string;
  action: string;
}
```

### 2. Create an enqueue helper

```typescript
// server/lib/my-jobs.ts
import { enqueueJob } from "./jobs";

export async function enqueueMyJob(data: MyJobData) {
  await enqueueJob("myjob:process", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
  });
}
```

### 3. Register your processor in a plugin

```typescript
// server/plugins/my-feature.ts
import { registerJobProcessor } from "../lib/jobs";
import type { MyJobData } from "../lib/my-jobs";

export default defineNitroPlugin(() => {
  registerJobProcessor<MyJobData>("myjob:process", async (job) => {
    const { userId, action } = job.data;

    // Do your async work here
    console.log(`Processing ${action} for user ${userId}`);

    return { success: true };
  });
});
```

### 4. Enqueue jobs from anywhere

```typescript
// server/api/my-endpoint.ts
import { enqueueMyJob } from "../lib/my-jobs";

export default defineEventHandler(async (event) => {
  await enqueueMyJob({
    userId: "123",
    action: "send-email"
  });

  return { queued: true };
});
```

## Job Naming Convention

Use a namespace pattern for job names: `<feature>:<action>`

Examples:
- `ocr:process`
- `email:send`
- `video:transcode`
- `thumbnail:generate`

## Current Job Types

### `ocr:process`
- **File**: `server/plugins/queue.ts`
- **Purpose**: Extract text from uploaded images using Tesseract OCR
- **Data**: `OcrJobData` (uploadId, objectKey, mime)
- **Enabled**: Only when `OCR_ENABLED=true`
