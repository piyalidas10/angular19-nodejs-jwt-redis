import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { userRepository } from '../repositories/user.repository';
import { simulateDelay } from '../utils/helpers';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  await simulateDelay(500);

  const allUsers = userRepository.findAll();
  const total    = allUsers.length;
  const active   = allUsers.filter(u => u.isActive).length;

  const recentActivity = [
    { id: 1, action: 'User login',         user: 'admin',    time: new Date(Date.now() - 2 * 60_000).toISOString() },
    { id: 2, action: 'Profile updated',    user: 'manager',  time: new Date(Date.now() - 15 * 60_000).toISOString() },
    { id: 3, action: 'User created',       user: 'admin',    time: new Date(Date.now() - 60 * 60_000).toISOString() },
    { id: 4, action: 'Role assigned',      user: 'admin',    time: new Date(Date.now() - 2 * 3600_000).toISOString() },
    { id: 5, action: 'Password changed',   user: 'employee', time: new Date(Date.now() - 5 * 3600_000).toISOString() },
  ];

  const stats = {
    totalUsers: total,
    activeUsers: active,
    totalRoles: 3,
    totalPermissions: 6,
  };

  const currentUser = userRepository.findById(req.user!.sub);

  res.json({
    stats,
    recentActivity,
    apiStatus: { status: 'healthy', uptime: process.uptime(), timestamp: new Date().toISOString() },
    currentUser: currentUser ? (({ passwordHash: _, ...u }) => u)(currentUser) : null,
  });
});

export default router;
