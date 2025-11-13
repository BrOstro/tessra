import {createTesseractOcr} from "@tessra/drivers/ocr-tesseract";

declare global {
	let __ocr: import("@tessra/core/ocr").OcrProvider | null;
}

export default defineNitroPlugin(() => {
	const rc = useRuntimeConfig();

	// Only initialize OCR if enabled
	if (rc.ocr.enabled) {
		globalThis.__ocr = createTesseractOcr({
			lang: rc.ocr.lang,
			logger: (m) => {
				if (m.status === "recognizing text") {
					console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
				}
			},
		});
		console.log(`OCR enabled with language: ${rc.ocr.lang}`);
	} else {
		globalThis.__ocr = null;
		console.log("OCR disabled");
	}
});

export function useOcr(): import("@tessra/core/ocr").OcrProvider | null {
	return globalThis.__ocr;
}
