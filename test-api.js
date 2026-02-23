// Simple API test script
import { serve } from '@hono/node-server'
import { Hono } from 'hono'

// Create a test app
const app = new Hono()

app.get('/', (c) => {
  return c.json({ message: 'Test API is working' })
})

app.get('/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

const port = 3001
console.log(`Test server running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})