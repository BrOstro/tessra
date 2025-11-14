import { randomBytes } from 'node:crypto';
import type { H3Event } from 'h3';
import { createClient } from 'redis';
import { getRedisConnectionOptions } from '../lib/redis';

const CSRF_TOKEN_BYTES = 32;
const CSRF_TOKEN_EXPIRY_SECONDS = 60 * 60; // 1 hour
const CSRF_KEY_PREFIX = 'csrf:';

let redisClient: ReturnType<typeof createClient> | null = null;

/**
 * Gets or creates the Redis client for CSRF token storage
 */
async function getRedisClient() {
	if (!redisClient) {
		const connectionOptions = getRedisConnectionOptions();
		redisClient = createClient(connectionOptions);

		redisClient.on('error', (err) => {
			console.error('Redis CSRF client error:', err);
		});

		await redisClient.connect();
	}

	return redisClient;
}

/**
 * Generates a CSRF token and stores it in Redis with automatic expiration
 * @returns The generated CSRF token
 */
export async function generateCsrfToken(): Promise<string> {
	const token = randomBytes(CSRF_TOKEN_BYTES).toString('base64url');
	const key = CSRF_KEY_PREFIX + token;

	try {
		const client = await getRedisClient();
		// Store token with automatic expiration (EX = seconds)
		await client.set(key, '1', { EX: CSRF_TOKEN_EXPIRY_SECONDS });
	} catch (error) {
		console.error('Failed to store CSRF token in Redis:', error);
		throw createError({
			statusCode: 500,
			statusMessage: 'Failed to generate CSRF token',
		});
	}

	return token;
}

/**
 * Validates a CSRF token by checking Redis and deleting it (single use)
 * @param {string} token - The token to validate
 * @returns True if valid and not expired, false otherwise
 */
export async function validateCsrfToken(
	token: string | undefined
): Promise<boolean> {
	if (!token) return false;

	const key = CSRF_KEY_PREFIX + token;

	try {
		const client = await getRedisClient();

		// Check if token exists and delete it atomically (single use)
		const result = await client.getDel(key);

		// If result is not null, token existed and was valid
		return result !== null;
	} catch (error) {
		console.error('Failed to validate CSRF token in Redis:', error);
		return false;
	}
}

/**
 * Middleware to verify CSRF token for state-changing operations
 * @param event - The H3 event object
 * @throws {Error} 403 Forbidden if CSRF validation fails
 */
export async function requireCsrfToken(event: H3Event): Promise<void> {
	const token = getHeader(event, 'x-csrf-token');

	const isValid = await validateCsrfToken(token);

	if (!isValid) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Invalid or missing CSRF token',
		});
	}
}
