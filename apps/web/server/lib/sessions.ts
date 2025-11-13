import { randomBytes } from 'crypto';
import { eq, lt } from 'drizzle-orm';
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

/**
 * Creates a new session
 * @returns The session token
 */
export async function createSession(): Promise<string> {
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

	// Find the session
	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.token, token))
		.limit(1);

	if (!session) {
		return false;
	}

	if (session.expiresAt < now) {
		await db.delete(sessions).where(eq(sessions.token, token));
		return false;
	}

	// Check if session is inactive
	const inactiveThreshold = new Date(now.getTime() - SESSION_INACTIVITY_MS);
	if (session.lastActivityAt < inactiveThreshold) {
		await db.delete(sessions).where(eq(sessions.token, token));
		return false;
	}

	// Update last activity time
	await db
		.update(sessions)
		.set({ lastActivityAt: now })
		.where(eq(sessions.token, token));

	return true;
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
 */
export async function cleanupExpiredSessions(): Promise<number> {
	const now = new Date();
	const inactiveThreshold = new Date(now.getTime() - SESSION_INACTIVITY_MS);

	const result = await db
		.delete(sessions)
		.where(lt(sessions.expiresAt, now));

	const inactiveResult = await db
		.delete(sessions)
		.where(lt(sessions.lastActivityAt, inactiveThreshold));

	return (result.rowCount || 0) + (inactiveResult.rowCount || 0);
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
