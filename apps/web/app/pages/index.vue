<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="text-center">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin mx-auto text-gray-600 dark:text-gray-400" />
      <p class="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
const { checkAuth, isAuthenticated } = useAuth();

// Check auth and redirect accordingly
onMounted(async () => {
  await checkAuth(true); // Force check to ensure fresh validation
  if (isAuthenticated.value) {
    await router.push('/admin');
  } else {
    await router.push('/login');
  }
});
</script>
