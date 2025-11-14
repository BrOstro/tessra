import { randomBytes } from 'crypto';
import { eq, lt, and, or } from 'drizzle-orm';
import { db } from './db';
import { sessions } from '../../db/schema';

// Session configuration
const SESSION_TOKEN_LENGTH = 32;
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_INACTIVITY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generates a cryptographically secure random token
 */
function generateSecureToken(): string {
	return randomBytes(SESSION_TOKEN_LENGTH).toString('base64url');
}

export async function deleteAllSessions(): Promise<void> {
	await db.delete(sessions);
}

/**
 * Creates a new session
 * @returns The session token
 */
export async function createSession(): Promise<string> {
	// Invalidate all existing sessions to prevent session fixation
	await deleteAllSessions();

	const token = generateSecureToken();
	const now = new Date();
	const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

	await db.insert(sessions).values({
		token,
		expiresAt,
		createdAt: now,
		lastActivityAt: now,
	});

	return token;
}

/**
 * Validates a session token and checks expiration
 * @param token The session token to validate
 * @returns true if the session is valid, false otherwise
 */
export async function validateSession(token: string): Promise<boolean> {
	if (!token) {
		return false;
	}

	const now = new Date();
	const inactiveThreshold = new Date(now.getTime() - SESSION_INACTIVITY_MS);

	// Only update if session is valid
	const result = await db
		.update(sessions)
		.set({ lastActivityAt: now })
		.where(
			and(
				eq(sessions.token, token),
				lt(now, sessions.expiresAt),
				lt(inactiveThreshold, sessions.lastActivityAt)
			)
		);

	if (result.rowCount && result.rowCount > 0) {
		return true;
	} else {
		await db.delete(sessions).where(eq(sessions.token, token));
		return false;
	}
}

/**
 * Deletes a session (logout)
 * @param token The session token to delete
 */
export async function deleteSession(token: string): Promise<void> {
	await db.delete(sessions).where(eq(sessions.token, token));
}

/**
 * Cleans up all expired sessions
 * Should be called periodically
 * @returns {Promise<number>} The number of sessions deleted
 */
export async function cleanupExpiredSessions(): Promise<number> {
	const now = new Date();
	const inactiveThreshold = new Date(now.getTime() - SESSION_INACTIVITY_MS);

	const result = await db
		.delete(sessions)
		.where(
			or(
				lt(sessions.expiresAt, now),
				lt(sessions.lastActivityAt, inactiveThreshold)
			)
		);
	return result.rowCount || 0;
}

/**
 * Gets session configuration values for external use
 */
export function getSessionConfig() {
	return {
		durationMs: SESSION_DURATION_MS,
		inactivityMs: SESSION_INACTIVITY_MS,
	};
}
