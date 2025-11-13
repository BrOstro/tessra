import { createLocalStorage } from "@tessra/drivers/storage-local";
import { createS3Storage } from "@tessra/drivers/storage-s3";

declare global {
	let __storage: import("@tessra/core/storage").StorageProvider;
}

export default defineNitroPlugin(() => {
	const rc = useRuntimeConfig();
	const s = rc.storage;

	const storage =
		s.driver === "s3"
			? createS3Storage({
				endpoint: s.s3Endpoint,
				region: s.s3Region,
				bucket: s.s3Bucket,
				accessKeyId: s.s3AccessKey,
				secretAccessKey: s.s3SecretKey
			})
			: createLocalStorage({
				root: s.localRoot,
				publicBase: s.localPublicBase
			});

	// Attach storage driver as a global singleton
	globalThis.__storage = storage;
});

// Helper to access the singleton storage driver
export function useStorage(): import("@tessra/core/storage").StorageProvider {
	return globalThis.__storage;
}
