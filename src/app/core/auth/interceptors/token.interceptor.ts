import {
  HttpInterceptorFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, switchMap, tap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Token Interceptor — functional style (Angular 19).
 *
 * Responsibilities:
 *  1. Attach withCredentials to every request (browser sends cookies automatically).
 *  2. On 401: call authService.refresh() once, then retry the original request.
 *     Concurrent 401s are queued behind a single refresh via AuthService's Subject.
 *  3. On 403: show a snackbar notification.
 *  4. On 5xx: show a generic error snackbar.
 *
 * IMPORTANT
 * ----------
 * DO NOT directly inject AuthService here:
 *
 *    const auth = inject(AuthService);   ❌
 *
 * AuthService itself depends on HttpClient.
 * HttpClient executes this interceptor.
 *
 * AuthService
 *      ↓
 * HttpClient
 *      ↓
 * tokenInterceptor
 *      ↓
 * inject(AuthService)  ❌ Circular dependency (NG0200)
 *
 * Instead, inject Angular's Injector and lazily resolve AuthService
 * only when a 401 actually occurs.
 */
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('➡️ Interceptor:', req.method, req.url);

  // Angular root injector
  const injector = inject(Injector);

  // Safe to inject (doesn't depend on HttpClient)
  const snackBar = inject(MatSnackBar);

  // Always send cookies with every request
  const credReq = req.clone({
    withCredentials: true,
  });
  

  return next(credReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('❌ Error:', error.status, req.url);

      //----------------------------------------------------------------------
      // Ignore these endpoints completely
      //----------------------------------------------------------------------
      const isAuthEndpoint =
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/refresh') ||
        req.url.includes('/auth/me');

      //----------------------------------------------------------------------
      // Only ONE refresh attempt
      //----------------------------------------------------------------------
      const alreadyRetried =
        req.headers.has('x-refresh-retry');

      // ──────────────────────────────────────────────────────────────────────
      // 401 — try a token refresh then retry
      // ----------------------------------------------------------------------
      // Ignore login/refresh/me endpoints to avoid infinite retry loops.
      // ──────────────────────────────────────────────────────────────────────
      if (
        error.status === 401 &&
        !isAuthEndpoint &&
        !alreadyRetried
      ) {
        console.log('🔄 Calling refresh...');

        console.log('==============================');
        console.log('401 intercepted');
        console.log('Original URL:', req.url);
        console.log('Attempting refresh...');
        console.log('==============================');

        // Lazily resolve AuthService.
        // This avoids the NG0200 circular dependency.
        const auth = injector.get(AuthService);

        return auth.refresh().pipe(

          tap(() => console.log('✅ Refresh successful. Retrying request...')),

          switchMap(() =>

            // Retry original request — browser will automatically
            // send the newly issued HttpOnly cookie.
            next(req.clone({
              withCredentials: true,
                headers: req.headers.set(
                  'x-refresh-retry',
                  'true'
                ),
            })),
          ),

          catchError(refreshErr => {
            console.log('❌ Refresh failed.');
            // Refresh failed.
            // AuthService already clears state and redirects to /login.
            return throwError(() => refreshErr);
          }),
        );
      }

      // ──────────────────────────────────────────────────────────────────────
      // 403 — insufficient permissions
      // ──────────────────────────────────────────────────────────────────────
      if (error.status === 403) {
        snackBar.open(
          'Access denied: Insufficient permissions.',
          'Close',
          {
            duration: 4000,
            panelClass: 'snack-error',
          },
        );
      }

      // ──────────────────────────────────────────────────────────────────────
      // 5xx — server errors
      // ──────────────────────────────────────────────────────────────────────
      if (error.status >= 500) {
        snackBar.open(
          'A server error occurred. Please try again.',
          'Close',
          {
            duration: 6000,
            panelClass: 'snack-error',
          },
        );
      }

      return throwError(() => error);
    }),
  );
};