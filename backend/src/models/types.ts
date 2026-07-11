// ─── Roles ────────────────────────────────────────────────────────────────────
export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

// ─── Permissions ─────────────────────────────────────────────────────────────
export type Permission =
  | 'USER_READ'
  | 'USER_WRITE'
  | 'USER_DELETE'
  | 'ROLE_MANAGE'
  | 'REPORT_VIEW'
  | 'PROFILE_EDIT';

// ─── Role → Permission map ────────────────────────────────────────────────────
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN:    ['USER_READ', 'USER_WRITE', 'USER_DELETE', 'ROLE_MANAGE', 'REPORT_VIEW', 'PROFILE_EDIT'],
  MANAGER:  ['USER_READ', 'REPORT_VIEW', 'PROFILE_EDIT'],
  EMPLOYEE: ['PROFILE_EDIT'],
};

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  department: string;
  avatarUrl?: string;
  role: Role;
  permissions: Permission[];
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

// ─── Public user (never expose passwordHash) ─────────────────────────────────
export type PublicUser = Omit<User, 'passwordHash'>;

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _, ...pub } = user;
  return pub;
}

// ─── Refresh Token ────────────────────────────────────────────────────────────
export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  isRevoked: boolean;
}
