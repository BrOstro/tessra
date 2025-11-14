<template>
	<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
		<!-- Header -->
		<header class="bg-white dark:bg-gray-800 shadow">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
					<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your uploads and settings</p>
				</div>
				<UButton
					color="red"
					variant="soft"
					:loading="isLoading"
					@click="handleLogout"
				>
					Logout
				</UButton>
			</div>
		</header>

		<!-- Main Content -->
		<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<!-- Upload Section -->
				<UCard>
					<template #header>
						<h2 class="text-lg font-semibold">File Upload</h2>
					</template>
					<div class="space-y-4">
						<p class="text-sm text-gray-600 dark:text-gray-400">
							Upload files with OCR processing support
						</p>
						<UButton block>
							Upload File
						</UButton>
					</div>
				</UCard>

				<!-- Recent Uploads -->
				<UCard>
					<template #header>
						<h2 class="text-lg font-semibold">Recent Uploads</h2>
					</template>
					<div class="space-y-2">
						<p class="text-sm text-gray-600 dark:text-gray-400">
							No uploads yet
						</p>
					</div>
				</UCard>

				<!-- System Status -->
				<UCard>
					<template #header>
						<h2 class="text-lg font-semibold">System Status</h2>
					</template>
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600 dark:text-gray-400">API Status</span>
							<UBadge color="green">Online</UBadge>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600 dark:text-gray-400">OCR Service</span>
							<UBadge color="green">Ready</UBadge>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600 dark:text-gray-400">Storage</span>
							<UBadge color="green">Connected</UBadge>
						</div>
					</div>
				</UCard>
			</div>

			<!-- Settings Section -->
			<div class="mt-8">
				<AdminSettings />
			</div>

			<!-- Info Section -->
			<div class="mt-8">
				<UCard>
					<template #header>
						<h2 class="text-lg font-semibold">Session Information</h2>
					</template>
					<div class="space-y-2">
						<p class="text-sm text-gray-600 dark:text-gray-400">
							You are logged in with a secure session cookie. Your session will expire after 7 days
							or 24 hours of inactivity.
						</p>
						<div class="flex items-center gap-2 mt-4">
							<UBadge color="blue">Secure Session</UBadge>
							<UBadge color="green">HTTP-Only Cookie</UBadge>
						</div>
					</div>
				</UCard>
			</div>
		</main>
	</div>
</template>

<script setup lang="ts">
definePageMeta({
	middleware: ['auth'],
});

const router = useRouter();
const {logout, isLoading} = useAuth();

const handleLogout = async () => {
	await logout();
	await router.push('/login');
};
</script>
