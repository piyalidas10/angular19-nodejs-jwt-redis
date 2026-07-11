import { Response } from 'express';
import { config } from '../config/env';

const BASE_OPTS = {
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  path: '/',
} as const;

/** Set both HttpOnly auth cookies on the response. */
export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  // Access token — 15 min
  res.cookie('accessToken', accessToken, {
    ...BASE_OPTS,
    maxAge: 30 * 1000, // 30 seconds for testing, should be 15 * 60 * 1000 (15 minutes) in production
  });

  // Refresh token — 7 days, stricter SameSite
  res.cookie('refreshToken', refreshToken, {
    ...BASE_OPTS,
    sameSite: 'Strict',
    path: '/api/auth/refresh',  // only sent to refresh endpoint
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

/** Clear both auth cookies (logout). */
export function clearAuthCookies(res: Response): void {
  res.clearCookie('accessToken',  { ...BASE_OPTS });
  res.clearCookie('refreshToken', { ...BASE_OPTS, sameSite: 'Strict', path: '/api/auth/refresh' });
}
