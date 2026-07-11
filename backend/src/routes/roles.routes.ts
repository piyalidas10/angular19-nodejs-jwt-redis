import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { MOCK_ROLES } from '../mock-data/roles';
import { simulateDelay } from '../utils/helpers';

const router = Router();
router.use(authenticate);

router.get('/', async (_req, res) => {
  await simulateDelay(400);
  res.json({ roles: MOCK_ROLES });
});

router.get('/:id', async (req, res) => {
  await simulateDelay(300);
  const role = MOCK_ROLES.find(r => r.id === req.params['id']);
  if (!role) { res.status(404).json({ status: 404, message: 'Role not found.' }); return; }
  res.json({ role });
});

export default router;
