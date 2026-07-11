import { Role, ROLE_PERMISSIONS } from '../models/types';

export interface RoleInfo {
  id: string;
  name: Role;
  label: string;
  description: string;
  permissions: string[];
  userCount: number;
}

export const MOCK_ROLES: RoleInfo[] = [
  {
    id: 'role-001',
    name: 'ADMIN',
    label: 'Administrator',
    description: 'Full system access with user and role management capabilities.',
    permissions: ROLE_PERMISSIONS['ADMIN'],
    userCount: 1,
  },
  {
    id: 'role-002',
    name: 'MANAGER',
    label: 'Manager',
    description: 'Can view users and reports, manage team members.',
    permissions: ROLE_PERMISSIONS['MANAGER'],
    userCount: 1,
  },
  {
    id: 'role-003',
    name: 'EMPLOYEE',
    label: 'Employee',
    description: 'Standard employee with profile edit access.',
    permissions: ROLE_PERMISSIONS['EMPLOYEE'],
    userCount: 1,
  },
];
