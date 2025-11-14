import { requireAdminAuth } from '../../../utils/auth';
import { checkS3Status } from '../../../utils/s3';

export default defineEventHandler(async (event) => {
	await requireAdminAuth(event);

	const config = useRuntimeConfig();
	return await checkS3Status(config.storage);
});
