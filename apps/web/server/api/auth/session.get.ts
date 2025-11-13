import { validateSession } from '../../lib/sessions';

export default defineEventHandler(async (event) => {
	// Get the session token from cookie
	const sessionToken = getCookie(event, 'session_token');

	if (!sessionToken) {
		return {
			authenticated: false,
		};
	}

	// Validate the session
	const isValid = await validateSession(sessionToken);

	if (!isValid) {
		// Clear invalid cookie
		deleteCookie(event, 'session_token', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			path: '/',
		});

		return {
			authenticated: false,
		};
	}

	return {
		authenticated: true,
	};
});
