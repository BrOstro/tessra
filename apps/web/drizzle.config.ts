import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'postgresql',
	schema: './db/schema.ts',
	out: './drizzle',
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
	strict: process.env.NODE_ENV !== 'production' && !process.env.RAILWAY_ENVIRONMENT_NAME,
});
