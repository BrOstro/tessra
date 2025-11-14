import { createSession } from '../../lib/sessions';
import { SESSION_COOKIE_OPTIONS } from '../../utils/auth';
import { requireCsrfToken } from '../../utils/csrf';
import { checkRateLimit, resetRateLimit } from '../../utils/rateLimit';
import { timingSafeEqual } from 'crypto';

// Rate limiting configuration
const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60; // 15 minutes

export default defineEventHandler(async (event) => {
	await requireCsrfToken(event);

	// Rate limiting check
	const clientIp = getRequestIP(event) || 'unknown';
	const rateLimit = await checkRateLimit(
		clientIp,
		'login',
		MAX_ATTEMPTS,
		WINDOW_SECONDS
	);

	if (rateLimit.isLimited) {
		throw createError({
			statusCode: 429,
			statusMessage: 'Too many login attempts. Please try again later.',
		});
	}

	const body = await readBody(event);
	const { adminKey } = body;

	// Validate the admin key
	const expectedKey = process.env.ADMIN_TOKEN;

	if (!expectedKey) {
		console.error('[AUTH] ADMIN_TOKEN not configured');
		throw createError({
			statusCode: 500,
			statusMessage: 'Server configuration error',
		});
	}

	const keyBuffer = Buffer.from(adminKey);
	const expectedBuffer = Buffer.from(expectedKey);
	if (keyBuffer.length !== expectedBuffer.length || !timingSafeEqual(keyBuffer, expectedBuffer)) {
		console.warn(`[AUTH] Failed login attempt from ${clientIp}`);
		throw createError({
			statusCode: 401,
			statusMessage: 'Invalid admin key',
		});
	}

	// Successful login - reset rate limit for this IP
	await resetRateLimit(clientIp, 'login');

	// Create a session
	const sessionToken = await createSession();

	setCookie(event, 'session_token', sessionToken, SESSION_COOKIE_OPTIONS);

	console.info(`[AUTH] Successful login from ${clientIp}`);

	return {
		success: true,
		message: 'Login successful',
	};
});
