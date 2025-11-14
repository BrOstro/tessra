export const useAuth = () => {
	const isAuthenticated = useState<boolean>('auth:isAuthenticated', () => false);
	const isLoading = useState<boolean>('auth:isLoading', () => false);
	const hasChecked = useState<boolean>('auth:hasChecked', () => false);

	/**
	 * Check if the current session is valid
	 * @param force - Force check even if already checked
	 */
	const checkAuth = async (force: boolean = false) => {
		// Skip if already checked and not forced (prevents redundant checks during navigation)
		if (hasChecked.value && !force) {
			return;
		}

		isLoading.value = true;
		try {
			// Use $fetch with proper cookie forwarding
			// On server: forward cookies from incoming request
			// On client: credentials: 'include' sends cookies automatically
			const headers: Record<string, string> = {};

			if (import.meta.server) {
				const reqHeaders = useRequestHeaders(['cookie']);
				if (reqHeaders.cookie) {
					headers.cookie = reqHeaders.cookie;
				}
			}

			const response = await $fetch('/api/auth/session', {
				headers: Object.keys(headers).length > 0 ? headers : undefined,
				credentials: 'include',
			});

			isAuthenticated.value = response.authenticated;
			hasChecked.value = true;
		} catch (error) {
			isAuthenticated.value = false;
			hasChecked.value = true;
			console.error('[Auth] Session check failed:', error);
		} finally {
			isLoading.value = false;
		}
	};

	const login = async (adminKey: string) => {
		isLoading.value = true;
		try {
			const csrfResponse = await $fetch<{ token: string }>('/api/auth/csrf');

			await $fetch('/api/auth/login', {
				method: 'POST',
				body: { adminKey },
				headers: {
					'X-CSRF-Token': csrfResponse.token,
				},
				credentials: 'include',
			});
			isAuthenticated.value = true;
			hasChecked.value = true;
			return { success: true };
		} catch (error: any) {
			console.error('[Auth] Session check failed:', error);
			isAuthenticated.value = false;
			hasChecked.value = true;
			return {
				success: false,
				error: error?.data?.statusMessage || 'Login failed',
			};
		} finally {
			isLoading.value = false;
		}
	};

	const logout = async () => {
		isLoading.value = true;
		try {
			const csrfResponse = await $fetch<{ token: string }>('/api/auth/csrf');

			await $fetch('/api/auth/logout', {
				method: 'POST',
				headers: {
					'X-CSRF-Token': csrfResponse.token,
				},
				credentials: 'include',
			});
		} catch (error) {
			console.error('Logout error:', error);
		} finally {
			isAuthenticated.value = false;
			hasChecked.value = true;
			isLoading.value = false;
		}
	};

	return {
		isAuthenticated: readonly(isAuthenticated),
		isLoading: readonly(isLoading),
		checkAuth,
		login,
		logout,
	};
};
