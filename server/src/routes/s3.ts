import { Hono } from 'hono';
import { randomBytes } from 'crypto';
import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  ListBucketsCommand,
  ListObjectsCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { s3Client } from '../lib/aws';
import { buildUrl } from '../lib/cdn';
import { zValidator } from '@hono/zod-validator';
import z from 'zod';

export const s3 = new Hono()
  .get('/projects', async (c) => {
    const buckets = await s3Client.send(new ListBucketsCommand({}));
    return c.json(buckets);
  })
  .post(
    '/projects',
    zValidator('json', z.object({ name: z.string() })),
    async (c) => {
      const body = c.req.valid('json');

      const result = await s3Client.send(
        new CreateBucketCommand({ Bucket: body.name })
      );

      return c.json(result);
    }
  )
  .delete(
    '/projects',
    zValidator('json', z.object({ name: z.string() })),
    async (c) => {
      const body = c.req.valid('json');
      const result = await s3Client.send(
        new DeleteBucketCommand({ Bucket: body.name })
      );
      return c.json(result);
    }
  )
  .get(
    '/projects/:name',
    zValidator('param', z.object({ name: z.string() })),
    async (c) => {
      const param = c.req.valid('param');
      const result = await s3Client.send(
        new ListObjectsCommand({ Bucket: param.name })
      );

      const Contents = await Promise.all(
        (result.Contents ?? []).map(async (o) => ({
          Key: o.Key,
          Size: o.Size,
          LastModified: o.LastModified,
          ETag: o.ETag,
          Url: o.Key ? await buildUrl(param.name, o.Key) : undefined,
        }))
      );

      return c.json({ Name: result.Name, Contents });
    }
  )
  .post(
    '/projects/:name',
    zValidator('param', z.object({ name: z.string() })),
    zValidator('form', z.object({ file: z.instanceof(File) })),
    async (c) => {
      const param = c.req.valid('param');
      const form = c.req.valid('form');
      const Key = randomBytes(32).toString('hex');
      await s3Client.send(
        new PutObjectCommand({
          Bucket: param.name,
          Key,
          Body: new Uint8Array(await form.file.arrayBuffer()),
          ContentType: form.file.type,
        })
      );
      return c.json({ Key, Url: await buildUrl(param.name, Key) });
    }
  )
  .delete(
    '/projects/:name/objects/:key',
    zValidator('param', z.object({ name: z.string(), key: z.string() })),
    async (c) => {
      const param = c.req.valid('param');
      const result = await s3Client.send(
        new DeleteObjectCommand({ Bucket: param.name, Key: param.key })
      );
      return c.json(result);
    }
  );
