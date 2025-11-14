import { createClient } from 'redis';
import { getRedisConnectionOptions } from '../lib/redis';

const RATE_LIMIT_KEY_PREFIX = 'ratelimit:';

let redisClient: ReturnType<typeof createClient> | null = null;

/**
 * Gets or creates the Redis client for rate limiting
 */
async function getRedisClient() {
	if (!redisClient) {
		const connectionOptions = getRedisConnectionOptions();
		redisClient = createClient(connectionOptions);

		redisClient.on('error', (err) => {
			console.error('Redis rate limit client error:', err);
		});

		await redisClient.connect();
	}

	return redisClient;
}

/**
 * Checks if a rate limit has been exceeded and increments the attempt counter
 * @param identifier - Unique identifier for rate limiting (e.g., IP address, user ID)
 * @param namespace - Namespace for the rate limit (e.g., 'login', 'api')
 * @param maxAttempts - Maximum number of attempts allowed
 * @param windowSeconds - Time window in seconds
 * @returns Object with isLimited (true if rate limit exceeded) and remaining attempts
 */
export async function checkRateLimit(
	identifier: string,
	namespace: string,
	maxAttempts: number,
	windowSeconds: number
): Promise<{ isLimited: boolean; remaining: number; resetAt: Date }> {
	const key = `${RATE_LIMIT_KEY_PREFIX}${namespace}:${identifier}`;

	try {
		const client = await getRedisClient();

		// Increment the counter atomically
		const count = await client.incr(key);

		// If this is the first attempt, set the expiration
		if (count === 1) {
			await client.expire(key, windowSeconds);
		}

		// Get TTL to calculate resetAt
		const ttl = await client.ttl(key);
		const resetAt = new Date(Date.now() + ttl * 1000);

		const remaining = Math.max(0, maxAttempts - count);
		const isLimited = count > maxAttempts;

		return {
			isLimited,
			remaining,
			resetAt,
		};
	} catch (error) {
		console.error('Failed to check rate limit in Redis:', error);
		// Fail open - don't block users if Redis is down
		return {
			isLimited: false,
			remaining: maxAttempts,
			resetAt: new Date(Date.now() + windowSeconds * 1000),
		};
	}
}

/**
 * Resets the rate limit for a specific identifier (e.g., on successful login)
 * @param identifier - Unique identifier for rate limiting
 * @param namespace - Namespace for the rate limit
 */
export async function resetRateLimit(
	identifier: string,
	namespace: string
): Promise<void> {
	const key = `${RATE_LIMIT_KEY_PREFIX}${namespace}:${identifier}`;

	try {
		const client = await getRedisClient();
		await client.del(key);
	} catch (error) {
		console.error('Failed to reset rate limit in Redis:', error);
	}
}

/**
 * Gets the current rate limit status without incrementing
 * @param identifier - Unique identifier for rate limiting
 * @param namespace - Namespace for the rate limit
 * @param maxAttempts - Maximum number of attempts allowed
 * @param windowSeconds - Time window in seconds
 * @returns Object with current attempt count and remaining attempts
 */
export async function getRateLimitStatus(
	identifier: string,
	namespace: string,
	maxAttempts: number,
	windowSeconds: number
): Promise<{ attempts: number; remaining: number; resetAt: Date }> {
	const key = `${RATE_LIMIT_KEY_PREFIX}${namespace}:${identifier}`;

	try {
		const client = await getRedisClient();
		const count = (await client.get(key)) || '0';
		const attempts = parseInt(count, 10);
		const ttl = await client.ttl(key);

		const resetAt =
			ttl > 0
				? new Date(Date.now() + ttl * 1000)
				: new Date(Date.now() + windowSeconds * 1000);

		return {
			attempts,
			remaining: Math.max(0, maxAttempts - attempts),
			resetAt,
		};
	} catch (error) {
		console.error('Failed to get rate limit status from Redis:', error);
		return {
			attempts: 0,
			remaining: maxAttempts,
			resetAt: new Date(Date.now() + windowSeconds * 1000),
		};
	}
}
