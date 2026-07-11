import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { usersController } from '../controllers/users.controller';
import { authenticate, requirePermission } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/users?page=1&limit=10&search=&role=
router.get(
  '/',
  requirePermission('USER_READ'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  usersController.getAll,
);

// GET /api/users/:id
router.get('/:id', requirePermission('USER_READ'), usersController.getOne);

// POST /api/users
router.post(
  '/',
  requirePermission('USER_WRITE'),
  [
    body('username').trim().isLength({ min: 3 }).withMessage('Username min 3 chars.'),
    body('email').isEmail().withMessage('Valid email required.'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars.'),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('department').trim().notEmpty(),
    body('role').isIn(['ADMIN', 'MANAGER', 'EMPLOYEE']).withMessage('Invalid role.'),
  ],
  validate,
  usersController.create,
);

// PUT /api/users/:id
router.put(
  '/:id',
  requirePermission('USER_WRITE'),
  [
    param('id').notEmpty(),
    body('role').optional().isIn(['ADMIN', 'MANAGER', 'EMPLOYEE']),
  ],
  validate,
  usersController.update,
);

// DELETE /api/users/:id
router.delete('/:id', requirePermission('USER_DELETE'), usersController.remove);

export default router;
