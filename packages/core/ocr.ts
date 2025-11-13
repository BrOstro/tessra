export interface OcrProvider {
	extractText(input: { key?: string; buffer?: Buffer; mime: string }): Promise<string>;
}
