import { createClient } from 'redis';
import { getRedisConnectionOptions } from '../lib/redis';
import { db } from '../lib/db';
import { settings } from '../../db/schema';
import { eq } from 'drizzle-orm';

const SETTINGS_KEY_PREFIX = 'settings:';
const SETTINGS_CACHE_TTL = 300;

let redisClient: ReturnType<typeof createClient> | null = null;
let connectionPromise: Promise<ReturnType<typeof createClient>> | null = null;

/**
 * Gets or creates the Redis client for settings caching
 * Uses a connection promise guard to prevent race conditions from concurrent calls
 */
async function getRedisClient() {
	if (!connectionPromise) {
		connectionPromise = (async () => {
			const connectionOptions = getRedisConnectionOptions();
			redisClient = createClient(connectionOptions);

			redisClient.on('error', (err) => {
				console.error('Redis settings cache client error:', err);
			});

			await redisClient.connect();
			return redisClient;
		})().catch((err) => {
			connectionPromise = null;
			throw err;
		});
	}

	return connectionPromise;
}

/**
 * Gets a setting value with Redis cache and DB fallback
 * @param key - Setting key (e.g., 'storage_driver')
 * @param envFallback - Environment variable value to use if not in DB
 * @returns The setting value
 */
export async function getSetting(
	key: string,
	envFallback: string
): Promise<string> {
	const cacheKey = SETTINGS_KEY_PREFIX + key;

	try {
		const client = await getRedisClient();

		const cached = await client.get(cacheKey);
		if (cached !== null) {
			return cached;
		}

		// Cache miss - check database
		const result = await db.select().from(settings).where(eq(settings.key, key));

		if (result.length > 0) {
			const value = result[0].value;
			await client.set(cacheKey, value, { EX: SETTINGS_CACHE_TTL });
			return value;
		}

		// Not in DB - use environment variable fallback
		// Don't cache env fallback so DB takes precedence once set
		return envFallback;
	} catch (error) {
		console.error('Failed to get setting from cache/DB:', error);
		// Fail gracefully - use environment variable
		return envFallback;
	}
}

/**
 * Updates a setting in the database and invalidates cache
 * @param key - Setting key
 * @param value - New value
 */
export async function updateSetting(key: string, value: string): Promise<void> {
	const cacheKey = SETTINGS_KEY_PREFIX + key;

	await db
		.insert(settings)
		.values({ key, value, updatedAt: new Date() })
		.onConflictDoUpdate({
			target: settings.key,
			set: { value, updatedAt: new Date() },
		});

	try {
		const client = await getRedisClient();
		await client.del(cacheKey);
	} catch (error) {
		console.error('Failed to invalidate settings cache:', error);
	}
}

/**
 * Clears all settings from cache (useful for manual cache busting)
 * Uses SCAN instead of KEYS to avoid blocking Redis server
 */
export async function clearSettingsCache(): Promise<void> {
	try {
		const client = await getRedisClient();
		let cursor = 0;
		let deletedCount = 0;

		do {
			const result = await client.scan(cursor, {
				MATCH: SETTINGS_KEY_PREFIX + '*',
				COUNT: 100
			});

			cursor = result.cursor;

			if (result.keys.length > 0) {
				await client.del(result.keys);
				deletedCount += result.keys.length;
			}
		} while (cursor !== 0);

		if (deletedCount > 0) {
			console.log(`Cleared ${deletedCount} settings from cache`);
		}
	} catch (error) {
		console.error('Failed to clear settings cache:', error);
	}
}
