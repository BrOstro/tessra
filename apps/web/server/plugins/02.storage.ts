import { createLocalStorage } from "@tessra/drivers/storage-local";
import { createS3Storage } from "@tessra/drivers/storage-s3";
import { getSetting } from "../utils/settings";

declare global {
	let __storage: {
		local: import("@tessra/core/storage").StorageProvider;
		s3: import("@tessra/core/storage").StorageProvider;
	};
}

export default defineNitroPlugin(() => {
	const rc = useRuntimeConfig();
	const s = rc.storage;

	// Initialize both storage providers at startup
	const localStorage = createLocalStorage({
		root: s.localRoot,
		publicBase: s.localPublicBase
	});

	const hasS3Config = s.s3Endpoint && s.s3Region && s.s3Bucket && s.s3AccessKey && s.s3SecretKey;
	const s3Storage = hasS3Config
		? createS3Storage({
			endpoint: s.s3Endpoint,
			region: s.s3Region,
			bucket: s.s3Bucket,
			accessKeyId: s.s3AccessKey,
			secretAccessKey: s.s3SecretKey
		})
		: undefined;

	// Attach both storage drivers as global singletons
	globalThis.__storage = {
		local: localStorage,
		s3: s3Storage
	};
});

// Helper to access the storage driver based on current setting
export async function useStorage(): Promise<import("@tessra/core/storage").StorageProvider> {
	const rc = useRuntimeConfig();
	const driver = await getSetting('storage_driver', rc.storage.driver);
	return driver === 's3' ? globalThis.__storage.s3 : globalThis.__storage.local;
}
