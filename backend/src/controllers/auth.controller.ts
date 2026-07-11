import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { setAuthCookies, clearAuthCookies } from '../utils/cookies';
import { userRepository } from '../repositories/user.repository';
import { toPublicUser } from '../models/types';
import { simulateDelay } from '../utils/helpers';

export const authController = {
  // ── POST /api/auth/login ───────────────────────────────────────────────────
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    console.log('🔥 LOGIN endpoint hit');
    try {
      await simulateDelay(500);
      const { username, password } = req.body as { username: string; password: string };
      const { accessToken, refreshToken } = await authService.login(username, password);

      setAuthCookies(res, accessToken, refreshToken);

      const user = userRepository.findByUsername(username)!;
      res.status(200).json({
        message: 'Login successful.',
        user: toPublicUser(user),
      });
    } catch (err) {
      next(Object.assign(err as Error, { status: 401 }));
    }
  },

  // ── POST /api/auth/refresh ─────────────────────────────────────────────────
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    console.log('🔥 REFRESH endpoint hit');
    try {
      const rawRefreshToken = req.cookies?.['refreshToken'] as string | undefined;
      console.log('======================');
      console.log('POST /auth/refresh');
      console.log('Cookie:', !!req.cookies.refreshToken);
      console.log('======================');
      if (!rawRefreshToken) {
        res.status(401).json({ status: 401, message: 'Refresh token missing.' });
        return;
      }

      await simulateDelay(200);
      const { accessToken, refreshToken } = await authService.refresh(rawRefreshToken);

      setAuthCookies(res, accessToken, refreshToken);

      res.status(200).json({ message: 'Token refreshed.' });
    } catch (err) {
      next(Object.assign(err as Error, { status: 401 }));
    }
  },

  // ── POST /api/auth/logout ──────────────────────────────────────────────────
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    console.log('🔥 LOGOUT endpoint hit');
    try {
      await simulateDelay(200);
      authService.logout(req.user!.sub);
      clearAuthCookies(res);
      res.status(200).json({ message: 'Logged out successfully.' });
    } catch (err) {
      next(err);
    }
  },

  // ── GET /api/auth/me ───────────────────────────────────────────────────────
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    console.log('🔥 ME endpoint hit');
    try {
      await simulateDelay(300);
      const user = userRepository.findById(req.user!.sub);
      if (!user) {
        res.status(404).json({ status: 404, message: 'User not found.' });
        return;
      }
      res.status(200).json({ user: toPublicUser(user) });
    } catch (err) {
      next(err);
    }
  },
};
