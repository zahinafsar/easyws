import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { s3 } from './routes/s3';
import { auth } from './routes/auth';
import { onError } from './lib/error';

const app = new Hono()
  .use(
    '*',
    cors({
      origin: (origin) => (origin?.startsWith('http://localhost:') ? origin : ''),
      credentials: true,
    })
  )
  .onError(onError)
  .get('/', (c) => c.text('Hello EasyWS!'))
  .route('/s3', s3)
  .route('/auth', auth);

export type AppType = typeof app;

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
