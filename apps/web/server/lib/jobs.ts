import type { Job } from "bullmq";
import { Queue, Worker } from "bullmq";
import { getRedisConnectionOptions } from "./redis";

// Job processor function type
export type JobProcessor<T = any> = (job: Job<T>) => Promise<any>;

// Registry of job processors
const jobProcessors = new Map<string, JobProcessor>();

// Global queue instance
declare global {
	let __jobQueue: Queue | undefined;
}

// Get or create the main job queue
export async function getJobQueue(): Promise<Queue> {
	if (!globalThis.__jobQueue) {
		const connection = getRedisConnectionOptions();
		globalThis.__jobQueue = new Queue("tessra-jobs", {
			connection,
		});
	}
	return globalThis.__jobQueue;
}

// Register a job processor
export function registerJobProcessor<T = any>(
	jobName: string,
	processor: JobProcessor<T>
) {
	if (jobProcessors.has(jobName)) {
		console.warn(`Job processor "${jobName}" already registered, overwriting`);
	}
	jobProcessors.set(jobName, processor);
	console.log(`Registered job processor: ${jobName}`);
}

// Enqueue a job
export async function enqueueJob<T = any>(
	jobName: string,
	data: T,
	options?: {
		attempts?: number;
		backoff?: { type: "exponential" | "fixed"; delay: number };
		delay?: number;
		priority?: number;
	}
) {
	const queue = await getJobQueue();
	await queue.add(jobName, data, {
		attempts: options?.attempts ?? 3,
		backoff: options?.backoff ?? {
			type: "exponential",
			delay: 2000,
		},
		delay: options?.delay,
		priority: options?.priority,
	});
}

// Start the unified job worker
export async function startJobWorker(concurrency: number = 5) {
	const connection = getRedisConnectionOptions();

	const worker = new Worker(
		"tessra-jobs",
		async (job) => {
			const processor = jobProcessors.get(job.name);
			if (!processor) {
				throw new Error(`No processor registered for job type: ${job.name}`);
			}
			return await processor(job);
		},
		{
			connection,
			concurrency,
		}
	);

	worker.on("completed", (job) => {
		console.log(`Job ${job.name} [${job.id}] completed`);
	});

	worker.on("failed", (job, err) => {
		console.error(`Job ${job?.name} [${job?.id}] failed:`, err.message);
	});

	console.log(`Job worker started with ${concurrency} concurrent processors`);
	return worker;
}
