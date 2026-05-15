import { S3Client } from "@aws-sdk/client-s3";
import { CloudFrontClient } from "@aws-sdk/client-cloudfront"
import { env } from "./env";

const awsConfig = {
    region: env.awsRegion,
    credentials: {
        accessKeyId: env.awsAccesskey,
        secretAccessKey: env.awsSecretKey,
    }
}

export const s3Client = new S3Client(awsConfig);
export const cloudFrontClient = new CloudFrontClient(awsConfig)