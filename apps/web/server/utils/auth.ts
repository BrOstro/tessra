import type { H3Event } from 'h3';
import { validateSession } from '../lib/sessions';

export const SESSION_COOKIE_OPTIONS = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'strict' as const,
	maxAge: 60 * 60 * 24 * 7, // 7 days
	path: '/'
};

/**
 * Dual Authentication Strategy:
 *
 * 1. Session-based (Web UI): Uses HTTP-only cookies for persistent browser sessions
 *    - Used by admin panel login page
 *    - Provides seamless UX with automatic session persistence across refreshes
 *    - Sessions stored in database with expiration and inactivity timeout
 *
 * 2. Bearer Token (API Clients): Uses Authorization header for programmatic access
 *    - Used by external services, scripts, or API consumers
 *    - Direct validation against ADMIN_TOKEN environment variable
 *    - No session overhead for stateless API calls
 *
 * Both methods use the same ADMIN_TOKEN credential but serve different use cases.
 */

/**
 * Validates authentication via session cookie or bearer token
 * @param event - The H3 event object
 * @throws {Error} 401 Unauthorized if authentication fails
 */
export async function requireAdminAuth(event: H3Event): Promise<void> {
	// First, check for session cookie (for web UI)
	const sessionToken = getCookie(event, 'session_token');
	if (sessionToken) {
		const isValidSession = await validateSession(sessionToken);
		if (isValidSession) {
			return; // Authentication successful via session
		}
		// If session is invalid, continue to check bearer token
	}

	// Fall back to bearer token authentication (for API clients)
	const auth = getHeader(event, 'authorization');

	if (!auth || typeof auth !== 'string') {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized'
		});
	}

	const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

	if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized'
		});
	}
}
