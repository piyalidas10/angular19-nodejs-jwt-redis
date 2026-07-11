import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import jwt from 'jsonwebtoken';

/** Augment Express Request with the authenticated user payload. */
declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        username: string;
        email: string;
        role: string;
        permissions: string[];
      };
    }
  }
}

/**
 * Validates the HttpOnly accessToken cookie on every protected route.
 * On success, attaches decoded payload to req.user.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.['accessToken'] as string | undefined;
  console.log('✅ Authentication Cookie ', req.cookies);

  if (!token) {
    console.log('❌ No access token');
    res.status(401).json({ status: 401, message: 'Authentication required.' });
    return;
  }

  const decoded = jwt.decode(token) as jwt.JwtPayload;
  console.log('Decoded JWT:', decoded);
  console.log('iat:', decoded?.iat);
  console.log('exp:', decoded?.exp);
  console.log(
    'expires in:',
    decoded?.exp ? decoded.exp * 1000 - Date.now() : 'unknown'
  );

  try {
    const payload = verifyAccessToken(token);
    console.log(
      'JWT expires:',
      new Date(payload.exp! * 1000).toLocaleString()
    );
    req.user = payload;
    next();
  } catch (err) {
    const expired = err instanceof Error && err.name === 'TokenExpiredError';
    res.status(401).json({
      status: 401,
      message: expired ? 'Access token expired.' : 'Invalid access token.',
    });
  }
}

/**
 * Role-based access guard factory.
 * Usage: router.get('/admin', authenticate, requireRole('ADMIN'), handler)
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ status: 403, message: 'Insufficient role.' });
      return;
    }
    next();
  };
}

/**
 * Permission-based access guard factory.
 * Usage: router.delete('/users/:id', authenticate, requirePermission('USER_DELETE'), handler)
 */
export function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ status: 401, message: 'Authentication required.' });
      return;
    }
    const hasAll = permissions.every(p => req.user!.permissions.includes(p));
    if (!hasAll) {
      res.status(403).json({ status: 403, message: 'Insufficient permissions.' });
      return;
    }
    next();
  };
}
