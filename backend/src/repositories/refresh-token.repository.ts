import crypto from 'crypto';
import { redisClient } from '../config/redis';

const KEY = (jti: string)         => `rt:${jti}`;
const USER_KEY = (userId: string) => `rt:user:${userId}`;

/** SHA-256 hash of the raw JWT — never store the token plaintext. */
function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export const refreshTokenRepository = {
  /**
   * Persist a refresh-token record in Redis.
   *
   * Two keys are written atomically via a pipeline:
   *   rt:{jti}          HASH  — tokenHash, userId, expiresAt
   *   rt:user:{userId}  SET   — member jti  (index for revokeAllForUser)
   *
   * Both keys share the same TTL so Redis auto-evicts them.
   */
  async save(jti: string, userId: string, rawToken: string, expiresAt: Date): Promise<void> {
    const ttlSeconds = Math.ceil((expiresAt.getTime() - Date.now()) / 1000);
    if (ttlSeconds <= 0) return; // already expired — nothing to store

    const pipeline = redisClient.pipeline();
    pipeline.hset(KEY(jti), {
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt: String(expiresAt.getTime()),
    });
    pipeline.expire(KEY(jti), ttlSeconds);
    pipeline.sadd(USER_KEY(userId), jti);
    pipeline.expire(USER_KEY(userId), ttlSeconds);
    await pipeline.exec();
  },

  /**
   * Look up a record by jti, verify the raw token hash, and confirm it has
   * not been revoked (key deleted) and has not expired (TTL enforces this).
   *
   * Returns the userId on success, null otherwise.
   */
  async findValid(jti: string, rawToken: string): Promise<string | null> {
    const record = await redisClient.hgetall(KEY(jti));
    if (!record || !record['tokenHash']) return null;                       // not found / revoked
    if (record['tokenHash'] !== hashToken(rawToken)) return null;          // hash mismatch
    if (parseInt(record['expiresAt']!, 10) < Date.now()) return null;      // expired (belt-and-suspenders)
    return record['userId']!;
  },

  /**
   * Revoke a single token — deletes the hash key and removes the jti from
   * the user index set.
   */
  async revoke(jti: string): Promise<void> {
    const userId = await redisClient.hget(KEY(jti), 'userId');
    const pipeline = redisClient.pipeline();
    pipeline.del(KEY(jti));
    if (userId) pipeline.srem(USER_KEY(userId), jti);
    await pipeline.exec();
  },

  /**
   * Revoke ALL refresh tokens for a user (logout-everywhere / reuse attack).
   *
   * Reads the user's jti set, deletes every rt:{jti} key, then deletes the
   * set itself — all in a single pipeline round-trip.
   */
  async revokeAllForUser(userId: string): Promise<void> {
    const jtis = await redisClient.smembers(USER_KEY(userId));
    if (jtis.length === 0) return;

    const pipeline = redisClient.pipeline();
    for (const jti of jtis) pipeline.del(KEY(jti));
    pipeline.del(USER_KEY(userId));
    await pipeline.exec();
  },
};
