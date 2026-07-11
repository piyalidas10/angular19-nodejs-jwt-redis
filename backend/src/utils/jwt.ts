import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { config } from '../config/env';

export interface AccessTokenPayload {
  sub: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string; // unique token id for rotation
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
    issuer: 'auth-backend',
    audience: 'auth-frontend',
  } as SignOptions);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
    issuer: 'auth-backend',
    audience: 'auth-frontend',
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload & JwtPayload {
  return jwt.verify(token, config.jwt.accessSecret, {
    issuer: 'auth-backend',
    audience: 'auth-frontend',
  }) as AccessTokenPayload & JwtPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload & JwtPayload {
  return jwt.verify(token, config.jwt.refreshSecret, {
    issuer: 'auth-backend',
    audience: 'auth-frontend',
  }) as RefreshTokenPayload & JwtPayload;
}

/** Milliseconds until a JWT expires. Returns 0 if already expired. */
export function msUntilExpiry(token: string): number {
  try {
    const decoded = jwt.decode(token) as JwtPayload | null;
    if (!decoded?.exp) return 0;
    return Math.max(0, decoded.exp * 1000 - Date.now());
  } catch {
    return 0;
  }
}
