import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Functional auth guard.
 *
 * Flow:
 * 1. Already authenticated → allow.
 * 2. Otherwise try restoring session from HttpOnly cookie (/auth/me).
 * 3. If successful → allow.
 * 4. If not → redirect to login.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.fetchMe().pipe(
  map(() => true),
  catchError(() => {
    auth.clearState();
    return of(router.createUrlTree(['/login']));
  })
);
};