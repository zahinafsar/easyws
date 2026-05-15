import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  console.log('auth route')
  return c.text('auth')
})

export const auth = app;
