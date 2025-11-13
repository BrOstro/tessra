import {createWorker} from "tesseract.js";
import type {OcrProvider} from "@tessra/core/ocr";

export interface TesseractOcrConfig {
	lang?: string;
	logger?: (m: any) => void;
}

export function createTesseractOcr(cfg?: TesseractOcrConfig): OcrProvider {
	const lang = cfg?.lang || "eng";
	let worker: Awaited<ReturnType<typeof createWorker>> | null = null;

	const getWorker = async () => {
		if (!worker) {
			worker = await createWorker(lang, undefined, {
				logger: cfg?.logger,
			});
		}
		return worker;
	};

	return {
		async extractText(input: { key?: string; buffer?: Buffer; mime: string }) {
			if (!input.mime.startsWith("image/")) {
				return "";
			}

			const w = await getWorker();
			const { data } = await w.recognize(input.buffer!);
			return data.text.replace(/[^a-zA-Z0-9\s.,!?;:'"()\[\]{}\-_=+@#$%&*/\\|<>~`]/g, '');
		},
	};
}
