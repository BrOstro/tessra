import { createSession } from '../../lib/sessions';
import { SESSION_COOKIE_OPTIONS } from '../../utils/auth';
import { requireCsrfToken } from '../../utils/csrf';

// Rate limiting: Track login attempts by IP
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export default defineEventHandler(async (event) => {
	requireCsrfToken(event);

	// Rate limiting check
	const clientIp = getRequestIP(event) || 'unknown';
	const now = Date.now();
	const attempt = loginAttempts.get(clientIp);

	if (attempt) {
		if (now < attempt.resetAt) {
			if (attempt.count >= MAX_ATTEMPTS) {
				throw createError({
					statusCode: 429,
					statusMessage: 'Too many login attempts. Please try again later.',
				});
			}
			attempt.count++;
		} else {
			loginAttempts.set(clientIp, { count: 1, resetAt: now + WINDOW_MS });
		}
	} else {
		loginAttempts.set(clientIp, { count: 1, resetAt: now + WINDOW_MS });
	}

	const body = await readBody(event);
	const { adminKey } = body;

	// Validate the admin key
	const expectedKey = process.env.ADMIN_TOKEN;

	if (!expectedKey) {
		console.error('[AUTH] ADMIN_TOKEN not configured');
		throw createError({
			statusCode: 500,
			statusMessage: 'Server configuration error: ADMIN_TOKEN not set',
		});
	}

	if (!adminKey || adminKey !== expectedKey) {
		console.warn(`[AUTH] Failed login attempt from ${clientIp}`);
		throw createError({
			statusCode: 401,
			statusMessage: 'Invalid admin key',
		});
	}

	// Successful login - reset rate limit for this IP
	loginAttempts.delete(clientIp);

	// Create a session
	const sessionToken = await createSession();

	setCookie(event, 'session_token', sessionToken, SESSION_COOKIE_OPTIONS);

	console.info(`[AUTH] Successful login from ${clientIp}`);

	return {
		success: true,
		message: 'Login successful',
	};
});
