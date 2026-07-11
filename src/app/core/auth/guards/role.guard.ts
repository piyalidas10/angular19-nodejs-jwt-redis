import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Permission } from '../models/auth.models';

/**
 * Functional permission/role guard.
 * Route data shape: { permissions: Permission[] }
 * Redirects to /unauthorized when the user lacks the required permissions.
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const required: Permission[] = route.data['permissions'] ?? [];
  if (required.length === 0) return true;

  const allowed = required.some(p => auth.hasPermission(p));
  return allowed ? true : router.createUrlTree(['/unauthorized']);
};
