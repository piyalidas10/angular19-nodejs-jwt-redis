import Redis from 'ioredis';
import { config } from './env';

/**
 * Singleton ioredis client.
 *
 * - `lazyConnect: true`  — the socket is NOT opened at import time; call
 *   `redisClient.connect()` explicitly from server startup so the process
 *   does not crash if Redis is temporarily unavailable during tests.
 * - `maxRetriesPerRequest: null` — required by ioredis v5 for blocking
 *   commands; we set it here to silence the warning even though we only use
 *   non-blocking commands.
 * - TLS is automatically enabled when the URL scheme is `rediss://`.
 */
export const redisClient = new Redis(config.redis.url, {
  lazyConnect: true,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisClient.on('error', (err: Error) => {
  // Avoid crashing the process on transient connection errors.
  console.error('[Redis] connection error:', err.message);
});
