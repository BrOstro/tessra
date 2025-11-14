import { registerJobProcessor, startJobWorker } from "../lib/jobs";
import type { OcrJobData } from "../lib/queue";
import { useOcr } from "./01.ocr";
import { useStorage } from "./02.storage";
import { db } from "../lib/db";
import { uploads } from "../../db/schema";
import { eq } from "drizzle-orm";

export default defineNitroPlugin(async () => {
	const rc = useRuntimeConfig();

	// Register OCR job processor if OCR is enabled
	if (rc.ocr.enabled) {
		registerJobProcessor<OcrJobData>("ocr:process", async (job) => {
			const { uploadId, objectKey, mime } = job.data;
			console.log(`Processing OCR job for upload: ${uploadId}`);

			const ocr = useOcr();
			if (!ocr) {
				throw new Error("OCR provider not initialized");
			}

			const storage = await useStorage();
			const buffer = await storage.get(objectKey);

			if (!buffer) {
				throw new Error(`File not found in storage: ${objectKey}`);
			}

			// Extract text using OCR
			const ocrText = await ocr.extractText({
				buffer,
				mime,
				key: objectKey,
			});

			// Update the database with OCR text
			await db
				.update(uploads)
				.set({ ocrText })
				.where(eq(uploads.id, uploadId));

			console.log(`OCR completed for upload ${uploadId}: ${ocrText.length} characters extracted`);

			return { success: true, textLength: ocrText.length };
		});
	}

	await startJobWorker(rc.jobs.concurrency);
});
