import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { refreshTokenRepository } from '../repositories/refresh-token.repository';
import { userRepository } from '../repositories/user.repository';

// 7 days in ms
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  /**
   * Validate credentials and return a token pair.
   * Throws a descriptive error on failure.
   */
  async login(username: string, password: string): Promise<TokenPair> {
    const user = userRepository.findByUsername(username);
    if (!user || !user.isActive) {
      throw new Error('Invalid username or password.');
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new Error('Invalid username or password.');
    }

    userRepository.setLastLogin(user.id);

    return this.issueTokenPair(user.id, user.username, user.email, user.role, user.permissions);
  },

  /**
   * Rotate refresh token — revoke old, issue new pair.
   */
  async refresh(rawRefreshToken: string): Promise<TokenPair> {
    let payload: ReturnType<typeof verifyRefreshToken>;
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new Error('Invalid or expired refresh token.');
    }

    const userId = await refreshTokenRepository.findValid(payload.jti, rawRefreshToken);
    if (!userId) {
      // Possible token reuse attack — revoke all tokens for this user.
      await refreshTokenRepository.revokeAllForUser(payload.sub);
      throw new Error('Refresh token reuse detected. Please log in again.');
    }

    const user = userRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      await refreshTokenRepository.revoke(payload.jti);
      throw new Error('User not found or inactive.');
    }

    // Revoke current token before issuing a new pair (rotation)
    await refreshTokenRepository.revoke(payload.jti);

    return this.issueTokenPair(user.id, user.username, user.email, user.role, user.permissions);
  },

  /** Revoke all refresh tokens for a user (logout). */
  async logout(userId: string): Promise<void> {
    await refreshTokenRepository.revokeAllForUser(userId);
  },

  // ── private helper ──────────────────────────────────────────────────────────

  async issueTokenPair(
    userId: string,
    username: string,
    email: string,
    role: string,
    permissions: string[],
  ): Promise<TokenPair> {
    const jti = uuidv4();

    const accessToken  = signAccessToken({ sub: userId, username, email, role, permissions });
    const refreshToken = signRefreshToken({ sub: userId, jti });

    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    await refreshTokenRepository.save(jti, userId, refreshToken, expiresAt);

    return { accessToken, refreshToken };
  },
};
