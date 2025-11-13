import { deleteSession } from '../../lib/sessions';

export default defineEventHandler(async (event) => {
	// Get the session token from cookie
	const sessionToken = getCookie(event, 'session_token');

	if (sessionToken) {
		// Delete the session from database
		await deleteSession(sessionToken);
	}

	// Clear the cookie
	deleteCookie(event, 'session_token', {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		path: '/',
	});

	return {
		success: true,
		message: 'Logout successful',
	};
});
