import { enqueueJob } from "./jobs";

export interface OcrJobData {
	uploadId: string;
	objectKey: string;
	mime: string;
}

// Enqueue an OCR job
export async function enqueueOcrJob(data: OcrJobData) {
	console.log("Enqueuing OCR job for uploadId:", data.uploadId);
	await enqueueJob("ocr:process", data, {
		attempts: 3,
		backoff: {
			type: "exponential",
			delay: 2000,
		},
	});
}
