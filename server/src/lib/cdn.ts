import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "./aws";

export const buildUrl = (Bucket: string, Key: string) => {
  const command = new GetObjectCommand({ Bucket, Key });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}