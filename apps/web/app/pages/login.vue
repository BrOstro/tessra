<template>
	<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
		<UCard class="w-full max-w-md">
			<template #header>
				<div class="text-center">
					<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Admin Login</h1>
					<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
						Enter your admin key to continue
					</p>
				</div>
			</template>

			<UForm class="space-y-4" @submit.prevent="handleLogin">
				<UFormField class="justify-center" label="Admin Key" name="adminKey" :error="errorMessage">
					<UInput
						v-model="adminKey"
						class="w-full"
						type="password"
						placeholder="Enter your admin key"
						size="lg"
						:disabled="isLoading"
						autocomplete="one-time-code"
					/>
				</UFormField>

				<UButton
					type="submit"
					block
					size="lg"
					:loading="isLoading"
					:disabled="!adminKey || isLoading"
				>
					Login
				</UButton>
			</UForm>

			<template #footer>
				<div class="text-center text-sm text-gray-600 dark:text-gray-400">
					Secured with HTTP-only cookies
				</div>
			</template>
		</UCard>
	</div>
</template>

<script setup lang="ts">
definePageMeta({
	middleware: ['auth'],
});

const router = useRouter();
const {login, isLoading} = useAuth();

const adminKey = ref('');
const errorMessage = ref('');

const handleLogin = async () => {
	errorMessage.value = '';

	if (!adminKey.value) {
		errorMessage.value = 'Admin key is required';
		return;
	}

	const result = await login(adminKey.value);

	if (result.success) {
		router.push('/admin');
	} else {
		errorMessage.value = result.error || 'Invalid admin key';
		adminKey.value = ''; // Clear the input on failure
	}
};
</script>
