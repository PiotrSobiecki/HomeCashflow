// Cloudflare Workers entrypoint
// Env bindings (DATABASE_URL, NEXTAUTH_SECRET, etc.) are automatically
// available as c.env inside Hono route handlers.
import { app } from './app.js'

export default app
