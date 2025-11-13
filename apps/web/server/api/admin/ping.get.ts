export default defineEventHandler(async (event) => {
	requireAdminAuth(event);
	return { ok: true, time: new Date().toISOString() };
});
