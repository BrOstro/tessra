import crypto from 'node:crypto';
import { uploads } from "../../db/schema";
import { db } from "../lib/db";
import { requireAdminAuth } from "../utils/auth";
import { useStorage } from "../plugins/drivers";
import { enqueueOcrJob } from "../lib/queue";

export default defineEventHandler(async (event) => {
	requireAdminAuth(event);

	const form = await readMultipartFormData(event);
	const file = form?.find(f => f.name === 'file' && 'data' in f);
	if (!file || !('data' in file)) {
		throw createError({ statusCode: 400, statusMessage: 'file required' });
	}

	const storage = useStorage();
	const buffer = file.data as Buffer;
	const mime = (file as any).type || 'application/octet-stream';
	const hash = crypto.createHash('sha256').update(buffer).digest('hex');
	const extension = mime.split('/')[1] ?? 'bin';
	const key = `uploads/${hash.slice(0, 2)}/${hash}.${extension}`;

	// Store file using the configured storage provider (local or S3)
	await storage.put({ buffer, key, mime });

	const defaultVisibility = process.env.DEFAULT_VISIBILITY as 'public' | 'private' | undefined;
	const visibility = defaultVisibility && ['public', 'private'].includes(defaultVisibility)
		? defaultVisibility
		: 'private';

	const inserted = await db.insert(uploads).values({
		objectKey: key,
		mime,
		sizeBytes: buffer.length,
		sha256: hash,
		visibility
	}).returning();

	const id = inserted[0].id;

	// Enqueue OCR job if enabled and file is an image
	const rc = useRuntimeConfig();
	if (rc.ocr.enabled && mime.startsWith('image/')) {
		await enqueueOcrJob({
			uploadId: id,
			objectKey: key,
			mime
		});
	}

	return {
		id,
		publicUrl: `${getRequestURL(event).origin}/uploads/${id}`
	};
});
