import { Request, Response, NextFunction } from 'express';

export function noCache(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
  });

  next();
}