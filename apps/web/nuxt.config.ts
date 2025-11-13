// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));

// Debug: Check if env vars are loaded
console.log('Environment check:', {
	ADMIN_TOKEN: process.env.ADMIN_TOKEN ? '✓ loaded' : '✗ missing',
	STORAGE_DRIVER: process.env.STORAGE_DRIVER || 'not set',
	"LOCAL_ROOT": process.env.LOCAL_ROOT || 'not set',
	"S3_BUCKET": process.env.S3_BUCKET ?  process.env.S3_BUCKET : '✗ missing',
	"S3_REGION": process.env.S3_REGION || 'not set',
	"S3_ENDPOINT": process.env.S3_ENDPOINT || 'not set',
});

export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	devtools: {enabled: true},

	alias: {
		'@tessra/core': resolve(currentDir, '../../packages/core'),
		'@tessra/drivers': resolve(currentDir, '../../packages/drivers'),
	},

	modules: [
		'@nuxt/eslint',
		'@nuxt/image',
		'@nuxt/test-utils',
		'@nuxt/ui'
	],
	runtimeConfig: {
		adminToken: process.env.ADMIN_TOKEN,
		// storage config (server-only)
		storage: {
			driver: process.env.STORAGE_DRIVER || "local", // local | s3
			// local
			localRoot: process.env.LOCAL_ROOT || ".data/uploads",
			localPublicBase: process.env.LOCAL_PUBLIC_BASE || "http://localhost:3000/raw/",
			// s3
			s3Endpoint: process.env.S3_ENDPOINT || undefined,
			s3Region: process.env.S3_REGION || "us-east-1",
			s3Bucket: process.env.S3_BUCKET || "",
			s3AccessKey: process.env.S3_ACCESS_KEY || "",
			s3SecretKey: process.env.S3_SECRET_KEY || "",
		},
		public: {
			appName: process.env.APP_NAME || "Tessra"
		}
	}
})