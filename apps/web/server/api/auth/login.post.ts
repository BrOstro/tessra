import { createSession } from '../../lib/sessions';

export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const { adminKey } = body;

	// Validate the admin key
	const expectedKey = process.env.ADMIN_TOKEN;

	if (!expectedKey) {
		throw createError({
			statusCode: 500,
			statusMessage: 'Server configuration error: ADMIN_TOKEN not set',
		});
	}

	if (!adminKey || adminKey !== expectedKey) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Invalid admin key',
		});
	}

	// Create a session
	const sessionToken = await createSession();

	// Set HTTP-only cookie
	setCookie(event, 'session_token', sessionToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
		path: '/',
	});

	return {
		success: true,
		message: 'Login successful',
	};
});
