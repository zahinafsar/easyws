import { randomBytes } from 'node:crypto';
import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  type BucketLocationConstraint,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface UploadObjectInput {
  bucket: string;
  body: Uint8Array;
  contentType: string;
}

export class S3Service {
  constructor(private readonly client = new S3Client({})) {}

  listProjects() {
    return this.client.send(new ListBucketsCommand({}));
  }

  async createProject(name: string) {
    const region = await this.client.config.region();
    return this.client.send(
      new CreateBucketCommand({
        Bucket: name,
        CreateBucketConfiguration:
          region === 'us-east-1'
            ? undefined
            : { LocationConstraint: region as BucketLocationConstraint },
      }),
    );
  }

  deleteProject(name: string) {
    return this.client.send(new DeleteBucketCommand({ Bucket: name }));
  }

  async listObjects(project: string) {
    const result = await this.client.send(
      new ListObjectsV2Command({ Bucket: project }),
    );
    const Contents = await Promise.all(
      (result.Contents ?? []).map(async (object) => ({
        Key: object.Key,
        Size: object.Size,
        LastModified: object.LastModified,
        ETag: object.ETag,
        Url: object.Key
          ? await this.buildUrl(project, object.Key)
          : undefined,
      })),
    );

    return { Name: result.Name, Contents };
  }

  async uploadObject({ bucket, body, contentType }: UploadObjectInput) {
    const Key = randomBytes(32).toString('hex');
    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return { Key, Url: await this.buildUrl(bucket, Key) };
  }

  async getObject(project: string, key: string) {
    const result = await this.client.send(
      new HeadObjectCommand({ Bucket: project, Key: key }),
    );

    return {
      Key: key,
      Size: result.ContentLength,
      LastModified: result.LastModified,
      ETag: result.ETag,
      ContentType: result.ContentType,
      Url: await this.buildUrl(project, key),
    };
  }

  deleteObject(project: string, key: string) {
    return this.client.send(
      new DeleteObjectCommand({ Bucket: project, Key: key }),
    );
  }

  private buildUrl(bucket: string, key: string) {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: 3600 },
    );
  }
}

export const s3Service = new S3Service();
