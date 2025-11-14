import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

export interface S3Status {
	configured: boolean;
	connected: boolean;
	message: string;
}

/**
 * Check if S3 is configured and test the connection
 */
export async function checkS3Status(): Promise<S3Status> {
	const rc = useRuntimeConfig();
	const s = rc.storage;

	// Check if required S3 environment variables are configured
	const hasConfig = !!(
		s.s3Bucket &&
		s.s3Region &&
		s.s3AccessKey &&
		s.s3SecretKey
	);

	if (!hasConfig) {
		return {
			configured: false,
			connected: false,
			message: 'S3 credentials not configured. Please set S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY environment variables.'
		};
	}

	// Test S3 connection by attempting a headBucket operation
	try {
		const s3Client = new S3Client({
			region: s.s3Region,
			endpoint: s.s3Endpoint,
			forcePathStyle: !!s.s3Endpoint,
			credentials: {
				accessKeyId: s.s3AccessKey,
				secretAccessKey: s.s3SecretKey
			}
		});

		await s3Client.send(new HeadBucketCommand({ Bucket: s.s3Bucket }));

		return {
			configured: true,
			connected: true,
			message: 'S3 is configured and accessible'
		};
	} catch (error: any) {
		console.error('S3 connection test failed:', error);

		let message = 'Failed to connect to S3. ';
		if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
			message += `Bucket '${s.s3Bucket}' does not exist.`;
		} else if (error.name === 'Forbidden' || error.$metadata?.httpStatusCode === 403) {
			message += 'Access denied. Please verify your credentials have the correct permissions.';
		} else if (error.$metadata?.httpStatusCode === 401) {
			message += 'Invalid credentials. Please verify your access key and secret key.';
		} else {
			message += error.message || 'Please verify your configuration.';
		}

		return {
			configured: true,
			connected: false,
			message
		};
	}
}
