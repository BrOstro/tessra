import { cleanupExpiredSessions } from '../lib/sessions';

export default defineNitroPlugin(() => {
	// Clean up expired sessions every hour
	const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

	const cleanup = async () => {
		try {
			const deletedCount = await cleanupExpiredSessions();
			if (deletedCount > 0) {
				console.log(`[Sessions] Cleaned up ${deletedCount} expired session(s)`);
			}
		} catch (error) {
			console.error('[Sessions] Error cleaning up expired sessions:', error);
		}
	};

	// Run initial cleanup on startup
	cleanup();

	// Schedule periodic cleanup
	const intervalId = setInterval(cleanup, CLEANUP_INTERVAL_MS);

	// Cleanup on shutdown
	process.on('SIGTERM', () => {
		clearInterval(intervalId);
	});

	process.on('SIGINT', () => {
		clearInterval(intervalId);
	});

	console.log('[Sessions] Session cleanup scheduled (every hour)');
});
