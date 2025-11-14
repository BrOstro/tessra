import crypto from 'node:crypto';
import { uploads } from "../../db/schema";
import { db } from "../lib/db";
import { requireAdminAuth } from "../utils/auth";
import { useStorage } from "../plugins/02.storage";
import { enqueueOcrJob } from "../lib/queue";
import { getSetting } from "../utils/settings";

export default defineEventHandler(async (event) => {
	await requireAdminAuth(event);

	const form = await readMultipartFormData(event);
	const file = form?.find(f => f.name === 'file' && 'data' in f);
	if (!file || !('data' in file)) {
		throw createError({ statusCode: 400, statusMessage: 'file required' });
	}

	const storage = await useStorage();
	const buffer = file.data as Buffer;
	const mime = (file as any).type || 'application/octet-stream';
	const hash = crypto.createHash('sha256').update(buffer).digest('hex');
	const extension = mime.split('/')[1] ?? 'bin';
	const key = `uploads/${hash.slice(0, 2)}/${hash}.${extension}`;

	// Store file using the configured storage provider (local or S3)
	await storage.put({ buffer, key, mime });

	const rc = useRuntimeConfig();
	const defaultVisibility = await getSetting(
		'default_visibility',
		rc.defaultVisibility
	) as 'public' | 'private';

	const inserted = await db.insert(uploads).values({
		objectKey: key,
		mime,
		sizeBytes: buffer.length,
		sha256: hash,
		visibility: defaultVisibility
	}).returning();

	const id = inserted[0].id;

	// Enqueue OCR job if enabled and file is an image
	const ocrEnabled = (await getSetting('ocr_enabled', rc.ocr.enabled ? 'true' : 'false')) === 'true';
	if (ocrEnabled && mime.startsWith('image/')) {
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
