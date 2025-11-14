import { requireAdminAuth } from '../../../utils/auth';
import { getSetting } from '../../../utils/settings';

export default defineEventHandler(async (event) => {
	await requireAdminAuth(event);

	const rc = useRuntimeConfig();

	return {
		storage_driver: await getSetting(
			'storage_driver',
			rc.storage.driver
		),
		default_visibility: await getSetting(
			'default_visibility',
			rc.defaultVisibility
		),
		ocr_enabled: await getSetting(
			'ocr_enabled',
			rc.ocr.enabled ? 'true' : 'false'
		),
	};
});
