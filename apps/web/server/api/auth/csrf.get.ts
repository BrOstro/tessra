import { generateCsrfToken } from '../../utils/csrf';

export default defineEventHandler(async () => {
	const token = await generateCsrfToken();

	return {
		token,
	};
});
