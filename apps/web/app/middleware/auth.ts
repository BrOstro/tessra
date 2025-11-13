export default defineNuxtRouteMiddleware(async (to, from) => {
	const { checkAuth, isAuthenticated } = useAuth();

	// Always check auth on initial load or when navigating to protected routes
	// This ensures SSR and page refreshes work correctly
	await checkAuth();

	// If not authenticated and trying to access admin pages, redirect to login
	if (!isAuthenticated.value && to.path.startsWith('/admin')) {
		return navigateTo('/login');
	}

	// If authenticated and trying to access login, redirect to admin
	if (isAuthenticated.value && to.path === '/login') {
		return navigateTo('/admin');
	}
});
