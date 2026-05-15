import "dotenv/config";
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { s3 } from './routes/s3'
import { auth } from './routes/auth'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello EasyWS!')
})

app.route('/s3', s3)
app.route('/auth', auth)

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})