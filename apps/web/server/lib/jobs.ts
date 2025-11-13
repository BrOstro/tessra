import type { Job } from "bullmq";
import { Queue, Worker } from "bullmq";
import { getRedisConnectionOptions } from "./redis";

// Job processor function type
export type JobProcessor<T = any> = (job: Job<T>) => Promise<any>;

// Registry of job processors
const jobProcessors = new Map<string, JobProcessor>();

// Global queue and worker instances
declare global {
	let __jobQueue: Queue | undefined;
	let __jobWorker: Worker | undefined;
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
	// Prevent duplicate workers
	if (globalThis.__jobWorker) {
		console.warn("Job worker already running, returning existing instance");
		return globalThis.__jobWorker;
	}

	try {
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

		// Store worker globally
		globalThis.__jobWorker = worker;

		console.log(`Job worker started with ${concurrency} concurrent processors`);
		return worker;
	} catch (error) {
		console.error('Failed to start job worker:', error);
		throw new Error('Job worker initialization failed');
	}
}

// Gracefully shutdown worker and queue
export async function shutdownJobSystem() {
	const errors: Error[] = [];

	// Close worker
	if (globalThis.__jobWorker) {
		try {
			await globalThis.__jobWorker.close();
			console.log("Job worker closed successfully");
			globalThis.__jobWorker = undefined;
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			console.error("Error closing job worker:", err.message);
			errors.push(err);
		}
	}

	// Close queue
	if (globalThis.__jobQueue) {
		try {
			await globalThis.__jobQueue.close();
			console.log("Job queue closed successfully");
			globalThis.__jobQueue = undefined;
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			console.error("Error closing job queue:", err.message);
			errors.push(err);
		}
	}

	if (errors.length > 0) {
		throw new Error(`Shutdown completed with ${errors.length} error(s): ${errors.map(e => e.message).join(", ")}`);
	}
}
