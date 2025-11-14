import { requireAdminAuth } from '../../utils/auth';

export default defineEventHandler(async (event) => {
	await requireAdminAuth(event);
	return { ok: true, time: new Date().toISOString() };
});
