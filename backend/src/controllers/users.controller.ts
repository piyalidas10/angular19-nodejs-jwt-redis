import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository';
import { simulateDelay } from '../utils/helpers';
import { Role } from '../models/types';

export const usersController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await simulateDelay(500);
      const page   = parseInt(req.query['page']   as string ?? '1');
      const limit  = parseInt(req.query['limit']  as string ?? '10');
      const search = (req.query['search'] as string ?? '').toLowerCase();
      const role   = req.query['role'] as string | undefined;

      let users = userRepository.findAll();

      if (search) {
        users = users.filter(u =>
          u.username.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search)    ||
          u.firstName.toLowerCase().includes(search)||
          u.lastName.toLowerCase().includes(search)
        );
      }
      if (role) users = users.filter(u => u.role === role);

      const total = users.length;
      const data  = users.slice((page - 1) * limit, page * limit);

      res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
  },

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await simulateDelay(300);
      const user = userRepository.findById(req.params['id']!);
      if (!user) { res.status(404).json({ status: 404, message: 'User not found.' }); return; }
      const { passwordHash: _, ...pub } = user;
      res.json({ user: pub });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await simulateDelay(500);
      const { username, email, password, firstName, lastName, department, role } = req.body as {
        username: string; email: string; password: string;
        firstName: string; lastName: string; department: string; role: Role;
      };

      if (userRepository.findByUsername(username)) {
        res.status(409).json({ status: 409, message: 'Username already exists.' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = userRepository.create({ username, email, passwordHash, firstName, lastName, department, role });
      res.status(201).json({ user });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await simulateDelay(500);
      const user = userRepository.update(req.params['id']!, req.body);
      if (!user) { res.status(404).json({ status: 404, message: 'User not found.' }); return; }
      res.json({ user });
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await simulateDelay(300);
      const deleted = userRepository.delete(req.params['id']!);
      if (!deleted) { res.status(404).json({ status: 404, message: 'User not found.' }); return; }
      res.json({ message: 'User deleted.' });
    } catch (err) { next(err); }
  },
};
