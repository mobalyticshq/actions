interface Bucket {
    upload(sourcePath: string, options: {
        destination: string;
    }): Promise<unknown>;
}
export declare function uploadFileToBucket(bucket: Bucket, sourcePath: string, destination: string, bucketName: string, description?: string): Promise<boolean>;
export {};
//# sourceMappingURL=bucket.utils.d.ts.map