import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { ROLE_PERMISSIONS } from '../models/types';
import { simulateDelay } from '../utils/helpers';

const router = Router();
router.use(authenticate);

const ALL_PERMISSIONS = [
  { id: 'perm-001', name: 'USER_READ',    label: 'Read Users',      description: 'View user list and details' },
  { id: 'perm-002', name: 'USER_WRITE',   label: 'Write Users',     description: 'Create and update users' },
  { id: 'perm-003', name: 'USER_DELETE',  label: 'Delete Users',    description: 'Remove users from the system' },
  { id: 'perm-004', name: 'ROLE_MANAGE',  label: 'Manage Roles',    description: 'Assign and modify roles' },
  { id: 'perm-005', name: 'REPORT_VIEW',  label: 'View Reports',    description: 'Access reporting dashboards' },
  { id: 'perm-006', name: 'PROFILE_EDIT', label: 'Edit Profile',    description: 'Edit own profile information' },
];

router.get('/', async (_req, res) => {
  await simulateDelay(300);
  res.json({ permissions: ALL_PERMISSIONS, rolePermissions: ROLE_PERMISSIONS });
});

export default router;
