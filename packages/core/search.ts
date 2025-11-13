export interface SearchProvider {
	index(doc: { id: string; title?: string; ocr?: string; tags?: string[]; createdAt: string }): Promise<void>;
	query(q: { text: string; filters?: Record<string, string | string[]>; limit?: number; offset?: number }): Promise<{ ids: string[] }>;
}
