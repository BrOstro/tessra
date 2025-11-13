export default defineNuxtPlugin(async () => {
	const { checkAuth } = useAuth();

	// Force check to ensure we validate the session on app start
	await checkAuth(true);
});
