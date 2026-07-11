import bcrypt from 'bcryptjs';
import { User, ROLE_PERMISSIONS } from '../models/types';

// Pre-hashed passwords for mock data (synchronous at module load — acceptable for tests/dev only)
const HASH_ADMIN    = bcrypt.hashSync('Admin@123',    10);
const HASH_MANAGER  = bcrypt.hashSync('Manager@123',  10);
const HASH_EMPLOYEE = bcrypt.hashSync('Employee@123', 10);

export const MOCK_USERS: User[] = [
  {
    id: 'usr-001',
    username: 'admin',
    email: 'admin@company.com',
    passwordHash: HASH_ADMIN,
    firstName: 'Alice',
    lastName: 'Admin',
    department: 'IT',
    avatarUrl: 'https://i.pravatar.cc/150?u=admin',
    role: 'ADMIN',
    permissions: ROLE_PERMISSIONS['ADMIN'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'usr-002',
    username: 'manager',
    email: 'manager@company.com',
    passwordHash: HASH_MANAGER,
    firstName: 'Mark',
    lastName: 'Manager',
    department: 'Operations',
    avatarUrl: 'https://i.pravatar.cc/150?u=manager',
    role: 'MANAGER',
    permissions: ROLE_PERMISSIONS['MANAGER'],
    isActive: true,
    createdAt: '2024-02-01T00:00:00.000Z',
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'usr-003',
    username: 'employee',
    email: 'employee@company.com',
    passwordHash: HASH_EMPLOYEE,
    firstName: 'Eva',
    lastName: 'Employee',
    department: 'Sales',
    avatarUrl: 'https://i.pravatar.cc/150?u=employee',
    role: 'EMPLOYEE',
    permissions: ROLE_PERMISSIONS['EMPLOYEE'],
    isActive: true,
    createdAt: '2024-03-01T00:00:00.000Z',
    lastLogin: new Date().toISOString(),
  },
];
