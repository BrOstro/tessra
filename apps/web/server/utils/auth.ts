import type { H3Event } from 'h3';
import { validateSession } from '../lib/sessions';

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
