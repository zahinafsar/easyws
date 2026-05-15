import { Hono } from 'hono';
import { randomBytes } from 'crypto';
import { CreateBucketCommand, DeleteBucketCommand, ListBucketsCommand, ListObjectsCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../lib/aws';
import { zValidator } from '@hono/zod-validator';
import z from 'zod';

const app = new Hono()


// Bucket Management
app.get('/projects', async (c) => {
  const buckets = await s3Client.send(new ListBucketsCommand({}))
  return c.json(buckets)
})

app.post(
  '/projects',
  zValidator('json', z.object({ name: z.string() })),
  async (c) => {
    const body = c.req.valid('json')
    const buckets = await s3Client.send(new CreateBucketCommand({
      Bucket: body.name
    }))
    return c.json(buckets)
  }
)

app.delete(
  '/projects',
  zValidator('json', z.object({ name: z.string() })),
  async (c) => {
    const body = c.req.valid('json')
    const buckets = await s3Client.send(new DeleteBucketCommand({
      Bucket: body.name
    }))
    return c.json(buckets)
  }
)
// Bucket Management

// Object Management
app.get(
  '/projects/:name',
  zValidator('param', z.object({ name: z.string() })),
  async (c) => {
    const param = c.req.valid('param')
    const buckets = await s3Client.send(new ListObjectsCommand({
      Bucket: param.name
    }))
    return c.json(buckets)
  }
)

app.post(
  '/projects/:name',
  zValidator('param', z.object({ name: z.string() })),
  zValidator('form', z.object({
    file: z.instanceof(File),
  })),
  async (c) => {
    const param = c.req.valid('param')
    const form = c.req.valid('form')
    const result = await s3Client.send(new PutObjectCommand({
      Bucket: param.name,
      Key: randomBytes(32).toString("hex"),
      Body: new Uint8Array(await form.file.arrayBuffer()),
      ContentType: form.file.type,
    }))
    return c.json(result)
  }
)
// Object Management

export const s3 = app;
