import fs from "node:fs/promises";
import path from "node:path";
import type { StorageProvider, StoragePut } from "@tessra/core/storage";

export function createLocalStorage(cfg: { root: string; publicBase: string }): StorageProvider {
	return {
		async put(f: StoragePut) {
			const full = path.join(cfg.root, f.key);
			await fs.mkdir(path.dirname(full), { recursive: true });
			await fs.writeFile(full, f.buffer);
			return { key: f.key };
		},
		async get(key) {
			try {
				const full = path.join(cfg.root, key);
				return await fs.readFile(full);
			} catch (error: any) {
				if (error.code === 'ENOENT') {
					return null;
				}
				throw error;
			}
		},
		async delete(key) {
			const full = path.join(cfg.root, key);
			await fs.rm(full, { force: true });
		}
	};
}
