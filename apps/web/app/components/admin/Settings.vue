<template>
	<UCard>
		<template #header>
			<h2 class="text-lg font-semibold">System Settings</h2>
		</template>

		<div class="space-y-6">
			<p class="text-sm text-gray-600 dark:text-gray-400">
				Configure runtime settings for your application. Changes take effect immediately.
			</p>

			<!-- Storage Driver -->
			<div>
				<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Storage Driver
				</label>

				<USelectMenu
					v-model="storageDriverModel"
					:ui="{ content: 'min-w-fit' }"
					:items="storageDriverOptions"
					:disabled="settingsLoading"
					:loading="settingsLoading"
				/>

				<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
					S3 credentials are configured via environment variables
				</p>

				<p v-if="!s3Status.configured || !s3Status.connected" class="text-xs text-amber-600 dark:text-amber-400 mt-1">
					{{ s3Status.message }}
				</p>
			</div>

			<!-- Default Visibility -->
			<div>
				<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Default Visibility
				</label>

				<USelectMenu
					v-model="visibilityModel"
					:ui="{ content: 'min-w-fit' }"
					:items="visibilityOptions"
					:disabled="settingsLoading"
					:loading="settingsLoading"
				/>

				<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
					Default visibility for new uploads
				</p>
			</div>

			<!-- OCR Enabled -->
			<div>
				<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					OCR Processing
				</label>

				<USwitch
					v-model="ocrEnabled"
					:disabled="settingsLoading"
					:loading="settingsLoading"
					@update:model-value="updateSetting('ocr_enabled', $event ? 'true' : 'false')"
				/>

				<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
					Automatically extract text from uploaded images to make them searchable
				</p>
			</div>
		</div>
	</UCard>
</template>

<script setup lang="ts">
const toast = useToast();

// Settings state
const settings = ref({
	storage_driver: 'local',
	default_visibility: 'private',
	ocr_enabled: 'false'
});

// S3 status state
const s3Status = ref({
	configured: false,
	connected: false,
	message: ''
});

const storageDriverModel = computed({
	get: () => storageDriverOptions.value.find(opt => opt.value === settings.value.storage_driver),
	set: (selectedOption) => {
		settings.value.storage_driver = selectedOption.value;
		updateSetting('storage_driver', selectedOption.value);
	}
});

const visibilityModel = computed({
	get: () => visibilityOptions.find(opt => opt.value === settings.value.default_visibility),
	set: (selectedOption) => {
		settings.value.default_visibility = selectedOption.value;
		updateSetting('default_visibility', selectedOption.value);
	}
});

const ocrEnabled = computed({
	get: () => settings.value.ocr_enabled === 'true',
	set: (value) => { settings.value.ocr_enabled = value ? 'true' : 'false'; }
});

const settingsLoading = ref(false);

const storageDriverOptions = computed(() => [
	{ label: 'Local Storage', value: 'local' },
	{
		label: 'Amazon S3',
		value: 's3',
		disabled: !s3Status.value.configured || !s3Status.value.connected
	}
]);

const visibilityOptions = [
	{ label: 'Public', value: 'public' },
	{ label: 'Private', value: 'private' }
];

const loadSettings = async () => {
	try {
		settings.value = await $fetch('/api/admin/settings');
	} catch (error) {
		console.error('Failed to load settings:', error);
		toast.add({
			title: 'Error',
			description: 'Failed to load settings',
			color: 'error',
			duration: 5000,
			type: 'foreground'
		});
	}
};

const loadS3Status = async () => {
	try {
		s3Status.value = await $fetch('/api/admin/settings/s3-status');
	} catch (error) {
		console.error('Failed to load S3 status:', error);
	}
};

const updateSetting = async (key: string, value: string) => {
	settingsLoading.value = true;

	try {
		// Get CSRF token
		const csrfResponse = await $fetch('/api/auth/csrf');

		// Update setting
		await $fetch('/api/admin/settings', {
			method: 'PATCH',
			body: { key, value },
			headers: {
				'X-CSRF-Token': csrfResponse.token
			}
		});

		toast.add({
			title: 'Success',
			description: 'Setting updated successfully',
			color: 'success',
			duration: 3000,
			type: 'foreground'
		});
	} catch (error) {
		console.error('Failed to update setting:', error);
		toast.add({
			title: 'Error',
			description: error?.data?.statusMessage || 'Failed to update setting',
			color: 'error',
			duration: 5000,
			type: 'foreground'
		});

		// Reload settings to revert UI
		await loadSettings();
	} finally {
		settingsLoading.value = false;
	}
};

onMounted(() => {
	loadSettings();
	loadS3Status();
});
</script>
