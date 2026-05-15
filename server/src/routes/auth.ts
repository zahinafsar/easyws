import { Hono } from 'hono';

export const auth = new Hono().get('/', (c) => {
  console.log('auth route');
  return c.text('auth');
});
