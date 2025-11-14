import { randomBytes } from 'node:crypto';
import type { H3Event } from 'h3';

const csrfTokens = new Map<string, number>();

// Cleanup expired tokens every hour
setInterval(() => {
	const now = Date.now();
	for (const [token, expiry] of csrfTokens.entries()) {
		if (now > expiry) {
			csrfTokens.delete(token);
		}
	}
}, 60 * 60 * 1000);

/**
 * Generates a CSRF token and stores it with expiration
 * @returns The generated CSRF token
 */
export function generateCsrfToken(): string {
	const token = randomBytes(32).toString('base64url');
	const expiry = Date.now() + 60 * 60 * 1000; // 1 hour expiry
	csrfTokens.set(token, expiry);
	return token;
}

/**
 * Validates a CSRF token
 * @param token - The token to validate
 * @returns True if valid and not expired, false otherwise
 */
export function validateCsrfToken(token: string | undefined): boolean {
	if (!token) return false;

	const expiry = csrfTokens.get(token);
	if (!expiry) return false;

	const now = Date.now();
	if (now > expiry) {
		csrfTokens.delete(token);
		return false;
	}

	// Token is valid - delete it (single use)
	csrfTokens.delete(token);
	return true;
}

/**
 * Middleware to verify CSRF token for state-changing operations
 * @param event - The H3 event object
 * @throws {Error} 403 Forbidden if CSRF validation fails
 */
export function requireCsrfToken(event: H3Event): void {
	const token = getHeader(event, 'x-csrf-token');

	if (!validateCsrfToken(token)) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Invalid or missing CSRF token',
		});
	}
}
