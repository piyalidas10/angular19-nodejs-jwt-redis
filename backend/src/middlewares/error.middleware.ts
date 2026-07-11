import { Request, Response, NextFunction } from 'express';

/** Global error handler — must be registered last in the Express chain. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('[ERROR]', err);

  const status = (err as any)?.status ?? 500;
  const message =
    err instanceof Error ? err.message : 'An unexpected error occurred.';

  res.status(status).json({ status, message });
}
