// Get Redis connection options for BullMQ (without connecting)
export function getRedisConnectionOptions() {
	const rc = useRuntimeConfig();
	const url = new URL(rc.redisUrl);

	return {
		host: url.hostname,
		port: parseInt(url.port) || 6379,
		password: url.password || undefined,
		username: url.username || undefined,
		db: url.pathname ? parseInt(url.pathname.slice(1)) : 0,
	};
}

