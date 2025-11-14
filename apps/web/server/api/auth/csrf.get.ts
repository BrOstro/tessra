import { generateCsrfToken } from '../../utils/csrf';

export default defineEventHandler(() => {
	const token = generateCsrfToken();

	return {
		token,
	};
});
