import { validateSession } from '../../lib/sessions';
import { SESSION_COOKIE_OPTIONS } from '../../utils/auth';

export default defineEventHandler(async (event) => {
	const sessionToken = getCookie(event, 'session_token');

	if (!sessionToken) {
		return {
			authenticated: false,
		};
	}

	// Validate the session
	const isValid = await validateSession(sessionToken);

	if (!isValid) {
		const { maxAge, ...cookieOptions } = SESSION_COOKIE_OPTIONS;
		deleteCookie(event, 'session_token', cookieOptions);

		return {
			authenticated: false,
		};
	}

	return {
		authenticated: true,
	};
});
