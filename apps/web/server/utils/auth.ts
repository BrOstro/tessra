import type { H3Event } from 'h3';

/**
 * Validates the admin token from the Authorization header
 * @param event - The H3 event object
 * @throws {Error} 401 Unauthorized if token is invalid or missing
 */
export function requireAdminAuth(event: H3Event): void {
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
