import { deleteSession } from '../../lib/sessions';
import { SESSION_COOKIE_OPTIONS } from '../../utils/auth';
import { requireCsrfToken } from '../../utils/csrf';

export default defineEventHandler(async (event) => {
	requireCsrfToken(event);

	const clientIp = getRequestIP(event) || 'unknown';

	// Get the session token from cookie
	const sessionToken = getCookie(event, 'session_token');

	if (sessionToken) {
		// Delete the session from database
		await deleteSession(sessionToken);
		console.info(`[AUTH] Session logged out from ${clientIp}`);
	}

	const { maxAge, ...cookieOptions } = SESSION_COOKIE_OPTIONS;
	deleteCookie(event, 'session_token', cookieOptions);

	return {
		success: true,
		message: 'Logout successful',
	};
});
