import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authLimiter } from '../middlewares/rate-limit.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

// Never cache authentication responses
router.use((req, res, next) => {
  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  );
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  [
    body('username').trim().notEmpty().withMessage('Username is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  authController.login,
);

// POST /api/auth/refresh  — no authentication required (uses refresh cookie)
router.post('/refresh', authLimiter, authController.refresh);

// POST /api/auth/logout
router.post('/logout', authenticate, authController.logout);

// GET  /api/auth/me
router.get('/me', authenticate, authController.me);

export default router;
