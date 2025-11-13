import {eq, and} from "drizzle-orm";
import {db} from "../../lib/db";
import {uploads} from "../../../db/schema";
import {useStorage} from "../../plugins/storage";

export default defineEventHandler(async (event) => {
	const { id } = event.context.params;
	const u = await db.select().from(uploads).where(and(eq(uploads.id, id), eq(uploads.visibility, 'public'))).limit(1);
	if (u.length === 0) {
		throw createError({ statusCode: 404, statusMessage: 'Upload not found' });
	}

	const upload = u[0];

	const storage = useStorage();

	// Fetch the file buffer from storage
	const buffer = await storage.get(upload.objectKey);

	if (!buffer) throw createError({ statusCode: 404, statusMessage: 'File not found in storage' });

	// Set appropriate headers
	setHeader(event, 'Content-Type', upload.mime);
	setHeader(event, 'Content-Length', upload.sizeBytes.toString());
	setHeader(event, 'Cache-Control', upload.visibility === 'public' ? 'public, max-age=31536000' : 'private, max-age=3600');

	return buffer;
});
