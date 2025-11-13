import {createWorker} from "tesseract.js";
import type {OcrProvider} from "@tessra/core/ocr";

export interface TesseractOcrConfig {
	lang?: string;
	logger?: (m: any) => void;
}

export function createTesseractOcr(cfg?: TesseractOcrConfig): OcrProvider {
	const lang = cfg?.lang || "eng";

	return {
		async extractText(input: { key?: string; buffer?: Buffer; mime: string }) {
			// Only process image files
			if (!input.mime.startsWith("image/")) {
				return "";
			}

			const worker = await createWorker(lang, undefined, {
				logger: cfg?.logger,
			});

			try {
				const { data } = await worker.recognize(input.buffer!);
				// Extract only alphanumeric characters
				return data.text.replace(/[^a-zA-Z0-9\s]/g, '');
			} finally {
				await worker.terminate();
			}
		},
	};
}
