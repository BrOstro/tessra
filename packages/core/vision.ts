export interface VisionTags { caption?: string; tags?: string[] }
export interface VisionProvider {
	describe(input: { key?: string; buffer?: Buffer; mime: string }): Promise<VisionTags>;
}
