import { requireAdminAuth } from '../../../utils/auth';
import { requireCsrfToken } from '../../../utils/csrf';
import { updateSetting } from '../../../utils/settings';
import { checkS3Status } from '../../../utils/s3';

export default defineEventHandler(async (event) => {
	await requireAdminAuth(event);
	await requireCsrfToken(event);

	const body = await readBody(event);
	const { key, value } = body;

	// Validate allowed settings and values
	const validSettings: Record<string, string[]> = {
		storage_driver: ['local', 's3'],
		default_visibility: ['public', 'private'],
		ocr_enabled: ['true', 'false'],
	};

	if (!validSettings[key]) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Invalid setting key',
		});
	}

	if (!validSettings[key].includes(value)) {
		throw createError({
			statusCode: 400,
			statusMessage: `Invalid value for ${key}. Must be one of: ${validSettings[key].join(', ')}`,
		});
	}

	// Special validation for S3 storage driver
	if (key === 'storage_driver' && value === 's3') {
		const config = useRuntimeConfig();
		const s3Status = await checkS3Status(config.storage);

		if (!s3Status.configured || !s3Status.connected) {
			throw createError({
				statusCode: 400,
				statusMessage: s3Status.message,
			});
		}
	}

	await updateSetting(key, value);

	return { success: true };
});
