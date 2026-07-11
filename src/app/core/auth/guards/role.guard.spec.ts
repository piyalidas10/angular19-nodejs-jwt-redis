import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, ActivatedRouteSnapshot } from '@angular/router';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';
import { Permission, Role, User } from '../models/auth.models';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a minimal mock ActivatedRouteSnapshot carrying `data.permissions`.
 */
function mockRoute(permissions: Permission[]): ActivatedRouteSnapshot {
  return { data: { permissions } } as unknown as ActivatedRouteSnapshot;
}

/**
 * Configure TestBed, absorb the bootstrap /auth/me request and optionally
 * inject a signed-in user into AuthService.
 */
function setup(options: {
  authenticated: boolean;
  role?: Role;
  permissions?: Permission[];
}) {
  TestBed.configureTestingModule({
    imports: [HttpClientTestingModule, RouterTestingModule],
    providers: [AuthService],
  });

  const httpMock = TestBed.inject(HttpTestingController);
  const auth     = TestBed.inject(AuthService);
  const router   = TestBed.inject(Router);

  // Absorb the bootstrap session-restore call
  const meReq = httpMock.expectOne(r => r.url.includes('/auth/me'));
  meReq.flush({}, { status: 401, statusText: 'Unauthorized' });
  httpMock.verify();

  if (options.authenticated) {
    const user: User = {
      id: 'u-001',
      username: options.role?.toLowerCase() ?? 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      department: 'Engineering',
      role: options.role ?? 'EMPLOYEE',
      permissions: options.permissions ?? [],
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    // Call the private helper directly — safe for tests
    (auth as any).setUser(user);
  }

  return { auth, router };
}

/**
 * Run the guard inside Angular's injection context and return the result.
 */
function runGuard(route: ActivatedRouteSnapshot) {
  return TestBed.runInInjectionContext(() =>
    roleGuard(route, {} as any),
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('roleGuard', () => {

  // ── Unauthenticated user ──────────────────────────────────────────────────

  describe('when the user is NOT authenticated', () => {
    it('returns a UrlTree redirecting to /login', () => {
      setup({ authenticated: false });

      const result = runGuard(mockRoute(['USER_READ']));

      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/login');
    });

    it('redirects to /login even when no permissions are required', () => {
      setup({ authenticated: false });

      const result = runGuard(mockRoute([]));

      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/login');
    });
  });

  // ── No permissions required ───────────────────────────────────────────────

  describe('when no permissions are required on the route', () => {
    it('returns true for an authenticated user with no permissions', () => {
      setup({ authenticated: true, role: 'EMPLOYEE', permissions: [] });

      const result = runGuard(mockRoute([]));

      expect(result).toBe(true);
    });

    it('returns true for an authenticated ADMIN with no route permissions', () => {
      setup({ authenticated: true, role: 'ADMIN', permissions: ['USER_READ', 'USER_WRITE'] });

      const result = runGuard(mockRoute([]));

      expect(result).toBe(true);
    });

    it('returns true when route.data is missing the permissions key entirely', () => {
      setup({ authenticated: true, role: 'EMPLOYEE', permissions: [] });
      // Omit permissions from route data — tests the `?? []` default
      const route = { data: {} } as unknown as ActivatedRouteSnapshot;

      const result = runGuard(route);

      expect(result).toBe(true);
    });
  });

  // ── Single permission checks ──────────────────────────────────────────────

  describe('when a single permission is required', () => {
    it('returns true when the user has the exact required permission', () => {
      setup({ authenticated: true, role: 'MANAGER', permissions: ['USER_READ'] });

      const result = runGuard(mockRoute(['USER_READ']));

      expect(result).toBe(true);
    });

    it('returns a UrlTree to /unauthorized when the user lacks the permission', () => {
      setup({ authenticated: true, role: 'EMPLOYEE', permissions: ['PROFILE_EDIT'] });

      const result = runGuard(mockRoute(['USER_READ']));

      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/unauthorized');
    });

    it('returns a UrlTree to /unauthorized when the user has no permissions at all', () => {
      setup({ authenticated: true, role: 'EMPLOYEE', permissions: [] });

      const result = runGuard(mockRoute(['ROLE_MANAGE']));

      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/unauthorized');
    });
  });

  // ── Multiple permissions (ANY match) ─────────────────────────────────────

  describe('when multiple permissions are required (ANY match via some())', () => {
    it('returns true when the user has ALL listed permissions', () => {
      setup({
        authenticated: true,
        role: 'ADMIN',
        permissions: ['USER_READ', 'USER_WRITE', 'USER_DELETE'],
      });

      const result = runGuard(mockRoute(['USER_READ', 'USER_WRITE']));

      expect(result).toBe(true);
    });

    it('returns true when the user has only ONE of the listed permissions', () => {
      // guard uses .some() → any match is sufficient
      setup({
        authenticated: true,
        role: 'MANAGER',
        permissions: ['USER_READ'],
      });

      const result = runGuard(mockRoute(['USER_READ', 'ROLE_MANAGE']));

      expect(result).toBe(true);
    });

    it('returns a UrlTree to /unauthorized when the user has none of the listed permissions', () => {
      setup({
        authenticated: true,
        role: 'EMPLOYEE',
        permissions: ['PROFILE_EDIT'],
      });

      const result = runGuard(mockRoute(['USER_DELETE', 'ROLE_MANAGE']));

      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/unauthorized');
    });
  });

  // ── Per-role scenario matrix ──────────────────────────────────────────────

  describe('ADMIN role', () => {
    const adminPerms: Permission[] = [
      'USER_READ', 'USER_WRITE', 'USER_DELETE', 'ROLE_MANAGE', 'REPORT_VIEW', 'PROFILE_EDIT',
    ];

    beforeEach(() => setup({ authenticated: true, role: 'ADMIN', permissions: adminPerms }));

    it('can access the Users page (USER_READ)', () => {
      expect(runGuard(mockRoute(['USER_READ']))).toBe(true);
    });

    it('can access the Roles page (ROLE_MANAGE)', () => {
      expect(runGuard(mockRoute(['ROLE_MANAGE']))).toBe(true);
    });

    it('can delete users (USER_DELETE)', () => {
      expect(runGuard(mockRoute(['USER_DELETE']))).toBe(true);
    });
  });

  describe('MANAGER role', () => {
    const managerPerms: Permission[] = ['USER_READ', 'REPORT_VIEW', 'PROFILE_EDIT'];

    beforeEach(() => setup({ authenticated: true, role: 'MANAGER', permissions: managerPerms }));

    it('can access the Users page (USER_READ)', () => {
      expect(runGuard(mockRoute(['USER_READ']))).toBe(true);
    });

    it('cannot access the Roles page (ROLE_MANAGE)', () => {
      const result = runGuard(mockRoute(['ROLE_MANAGE']));
      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/unauthorized');
    });

    it('cannot delete users (USER_DELETE)', () => {
      const result = runGuard(mockRoute(['USER_DELETE']));
      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/unauthorized');
    });
  });

  describe('EMPLOYEE role', () => {
    const employeePerms: Permission[] = ['PROFILE_EDIT'];

    beforeEach(() => setup({ authenticated: true, role: 'EMPLOYEE', permissions: employeePerms }));

    it('can access own profile (PROFILE_EDIT)', () => {
      expect(runGuard(mockRoute(['PROFILE_EDIT']))).toBe(true);
    });

    it('cannot access Users page (USER_READ)', () => {
      const result = runGuard(mockRoute(['USER_READ']));
      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/unauthorized');
    });

    it('cannot access Roles page (ROLE_MANAGE)', () => {
      const result = runGuard(mockRoute(['ROLE_MANAGE']));
      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/unauthorized');
    });

    it('cannot view reports (REPORT_VIEW)', () => {
      const result = runGuard(mockRoute(['REPORT_VIEW']));
      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/unauthorized');
    });
  });

  // ── Redirect target verification ─────────────────────────────────────────

  describe('redirect target correctness', () => {
    it('unauthenticated → redirect is to exactly /login (not /unauthorized)', () => {
      setup({ authenticated: false });
      const result = runGuard(mockRoute(['USER_READ'])) as UrlTree;
      expect(result.toString()).toBe('/login');
      expect(result.toString()).not.toContain('unauthorized');
    });

    it('authenticated + forbidden → redirect is to exactly /unauthorized (not /login)', () => {
      setup({ authenticated: true, role: 'EMPLOYEE', permissions: ['PROFILE_EDIT'] });
      const result = runGuard(mockRoute(['USER_DELETE'])) as UrlTree;
      expect(result.toString()).toBe('/unauthorized');
      expect(result.toString()).not.toContain('login');
    });
  });

  // ── Return type guarantees ────────────────────────────────────────────────

  describe('return type', () => {
    it('returns a boolean true (not a UrlTree) when access is granted', () => {
      setup({ authenticated: true, role: 'ADMIN', permissions: ['USER_READ'] });
      const result = runGuard(mockRoute(['USER_READ']));
      expect(typeof result).toBe('boolean');
      expect(result).toBeTrue();
    });

    it('returns a UrlTree (not a boolean) when access is denied', () => {
      setup({ authenticated: true, role: 'EMPLOYEE', permissions: ['PROFILE_EDIT'] });
      const result = runGuard(mockRoute(['USER_WRITE']));
      expect(result).not.toBeTrue();
      expect(result).toBeInstanceOf(UrlTree);
    });
  });
});
