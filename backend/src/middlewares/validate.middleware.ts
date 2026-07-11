import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/** Run express-validator checks and short-circuit with 422 on failure. */
export function validate(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      status: 422,
      message: 'Validation failed.',
      details: errors.array(),
    });
    return;
  }
  next();
}
