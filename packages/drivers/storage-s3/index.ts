import {S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand} from "@aws-sdk/client-s3";
import type { StorageProvider, StoragePut } from "@tessra/core/storage";

export function createS3Storage(cfg: {
	endpoint?: string; region: string; bucket: string; accessKeyId: string; secretAccessKey: string;
}): StorageProvider {
	const s3 = new S3Client({
		region: cfg.region, endpoint: cfg.endpoint, forcePathStyle: !!cfg.endpoint,
		credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey }
	});

	return {
		async put(f: StoragePut) {
			await s3.send(new PutObjectCommand({ Bucket: cfg.bucket, Key: f.key, Body: f.buffer, ContentType: f.mime, Metadata: f.metadata }));
			return { key: f.key };
		},
		async get(key) {
			try {
				const response = await s3.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: key }));
				if (!response.Body) return null;

				// Convert the stream to a Buffer
				const chunks: Uint8Array[] = [];
				for await (const chunk of response.Body as any) {
					chunks.push(chunk);
				}
				return Buffer.concat(chunks);
			} catch (error: any) {
				if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
					return null;
				}
				throw error;
			}
		},
		async delete(key) {
			await s3.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }));
		}
	};
}
