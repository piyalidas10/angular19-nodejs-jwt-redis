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

// ─── User (mirrors backend PublicUser) ───────────────────────────────────────
export interface User {
  id: string;
  username: string;
  email: string;
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

// ─── Auth state ───────────────────────────────────────────────────────────────
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ─── Login request / response ─────────────────────────────────────────────────
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
}

// ─── Role metadata ────────────────────────────────────────────────────────────
export interface RoleInfo {
  id: string;
  name: Role;
  label: string;
  description: string;
  permissions: Permission[];
  userCount: number;
}
