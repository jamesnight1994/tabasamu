import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

/**
 * Local Docker Compose Postgres has no TLS. Managed hosts (Render, etc.) require SSL.
 * Set DATABASE_SSL=false explicitly for Compose; default to SSL when unset in production.
 */
const databaseSslDisabled =
  process.env.DATABASE_SSL === 'false' ||
  process.env.DATABASE_SSL === 'disable' ||
  process.env.DATABASE_SSL === '0'

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    databaseDriverOptions: databaseSslDisabled
      ? { ssl: false, sslmode: 'disable' }
      : { ssl: { rejectUnauthorized: false }, sslmode: 'require' },
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
    },
    // Free/single instance: "shared". Split server/worker later via MEDUSA_WORKER_MODE.
    workerMode: (process.env.MEDUSA_WORKER_MODE as
      | 'shared'
      | 'worker'
      | 'server'
      | undefined) || 'shared',
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === 'true',
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
})
