// Get Redis connection options for BullMQ (without connecting)
export function getRedisConnectionOptions() {
	const rc = useRuntimeConfig();

	let url: URL;
	try {
		url = new URL(rc.redisUrl);
	} catch (err) {
		throw new Error(
			`Invalid Redis URL provided in configuration: "${rc.redisUrl}". Please check your REDIS_URL environment variable or configuration.`
		);
	}

	return {
		host: url.hostname,
		port: parseInt(url.port) || 6379,
		password: url.password || undefined,
		username: url.username || undefined,
		db: url.pathname ? (parseInt(url.pathname.slice(1)) || 0) : 0,
	};
}

