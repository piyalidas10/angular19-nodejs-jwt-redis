/**
 * Simulated user repository backed by the in-memory MOCK_USERS array.
 * Supports CRUD operations with propagation to the live array so the
 * session remains consistent within one server run.
 */

import { v4 as uuidv4 } from 'uuid';
import { MOCK_USERS } from '../mock-data/users';
import { User, PublicUser, toPublicUser, ROLE_PERMISSIONS, Role } from '../models/types';

export const userRepository = {
  findAll(): PublicUser[] {
    return MOCK_USERS.map(toPublicUser);
  },

  findById(id: string): User | undefined {
    return MOCK_USERS.find(u => u.id === id);
  },

  findByUsername(username: string): User | undefined {
    return MOCK_USERS.find(u => u.username.toLowerCase() === username.toLowerCase());
  },

  findByEmail(email: string): User | undefined {
    return MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  create(dto: {
    username: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    department: string;
    role: Role;
  }): PublicUser {
    const user: User = {
      id: `usr-${uuidv4().slice(0, 8)}`,
      ...dto,
      permissions: ROLE_PERMISSIONS[dto.role],
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    MOCK_USERS.push(user);
    return toPublicUser(user);
  },

  update(id: string, patch: Partial<Omit<User, 'id' | 'passwordHash'>>): PublicUser | null {
    const idx = MOCK_USERS.findIndex(u => u.id === id);
    if (idx === -1) return null;
    const updated = { ...MOCK_USERS[idx]!, ...patch };
    if (patch.role) updated.permissions = ROLE_PERMISSIONS[patch.role];
    MOCK_USERS[idx] = updated;
    return toPublicUser(updated);
  },

  delete(id: string): boolean {
    const idx = MOCK_USERS.findIndex(u => u.id === id);
    if (idx === -1) return false;
    MOCK_USERS.splice(idx, 1);
    return true;
  },

  setLastLogin(id: string): void {
    const user = MOCK_USERS.find(u => u.id === id);
    if (user) user.lastLogin = new Date().toISOString();
  },
};
