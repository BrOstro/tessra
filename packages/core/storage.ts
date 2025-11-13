export interface StoragePut {
	buffer: Buffer; key: string; mime: string; metadata?: Record<string,string>;
}

export interface StorageProvider {
	put(f: StoragePut): Promise<{ key: string }>;
	get(key: string): Promise<Buffer | null>;
	delete(key: string): Promise<void>;
}