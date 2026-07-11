import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, Subject, throwError, of, EMPTY } from 'rxjs';
import { tap, catchError, switchMap, finalize, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { User, LoginRequest, LoginResponse, Permission } from '../models/auth.models';

/**
 * AuthService — Angular 19 Signals-based authentication.
 *
 * Cookie-based auth flow:
 *  1. login()  → POST /auth/login  → server sets HttpOnly accessToken + refreshToken cookies.
 *  2. Every subsequent request automatically carries those cookies (withCredentials: true).
 *  3. On 401 the tokenInterceptor calls refresh():
 *       POST /auth/refresh  → server validates the refreshToken cookie,
 *       rotates it, and sets a new accessToken cookie.
 *  4. The interceptor retries the original request with the fresh cookie.
 *
 * Security contract:
 *  - No token is ever stored in localStorage / sessionStorage / JS memory.
 *  - This service only manages reactive UI state (currentUser, flags).
 *  - Concurrent 401 callers share one in-flight refresh via refreshDone$.
 *  - Cross-tab logout is coordinated via BroadcastChannel.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${environment.apiUrl}/auth`;

  // ── Refresh queue ──────────────────────────────────────────────────────────
  // Tracks whether a refresh call is already in-flight so concurrent 401s
  // wait on the same request rather than firing multiple /refresh calls.
  private isRefreshing = false;
  private refreshDone$ = new Subject<void>();

  // ── Cross-tab coordination ─────────────────────────────────────────────────
  private readonly channel: BroadcastChannel | null =
    typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel('auth_channel')
      : null;

  // ── Angular 19 Signals ─────────────────────────────────────────────────────
  readonly currentUser     = signal<User | null>(null);
  readonly isAuthenticated = signal<boolean>(false);
  readonly isLoading       = signal<boolean>(false);

  // Derived signals
  readonly userRole        = computed(() => this.currentUser()?.role ?? null);
  readonly userPermissions = computed(() => this.currentUser()?.permissions ?? []);
  readonly isAdmin         = computed(() => this.userRole() === 'ADMIN');
  readonly isManager       = computed(() => this.userRole() === 'MANAGER');
  readonly displayName     = computed(() => {
    const u = this.currentUser();
    return u ? `${u.firstName} ${u.lastName}` : '';
  });

  private readonly http       = inject(HttpClient);
  private readonly router     = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.listenBroadcastChannel();
    this.destroyRef.onDestroy(() => this.channel?.close());
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Public API
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Step 1 of the auth flow.
   * Sends credentials → server validates, signs tokens, sets HttpOnly cookies.
   * JS never sees the tokens — the browser stores and sends them automatically.
   */
  login(credentials: LoginRequest): Observable<User> {
    this.isLoading.set(true);
    return this.http
      .post<LoginResponse>(`${this.API}/login`, credentials, { withCredentials: true })
      .pipe(
        tap(res => {
          this.setUser(res.user);
          this.channel?.postMessage({ type: 'login' });
        }),
        map(res => res.user),
        finalize(() => this.isLoading.set(false)),
      );
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.API}/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => this.channel?.postMessage({ type: 'logout' })),
        // Always clear state — even if the server call fails.
        catchError(() => of(undefined as void)),
        finalize(() => {
          this.clearState();
          this.router.navigate(['/login']);
        }),
      );
  }

  /**
   * Step 3b of the auth flow — called by tokenInterceptor on 401.
   *
   * Sends the HttpOnly refreshToken cookie to /auth/refresh.
   * The server validates it, rotates it, and sets a fresh accessToken cookie.
   * Concurrent callers wait on refreshDone$ so only one network request fires.
   */
  refresh(): Observable<void> {
    console.log('🚀 refresh() called');

    if (this.isRefreshing) {
      console.log('Already refreshing...');
      // Queue behind the in-flight refresh.
      return this.refreshDone$.pipe(switchMap(() => of(undefined as void)));
    }

    this.isRefreshing = true;

    return this.http
      .post<{ message: string }>(`${this.API}/refresh`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          console.log('✅ /refresh returned 200')
          // Unblock all queued callers.
          this.refreshDone$.next();
        }),
        map(() => undefined as void),
        catchError(err => {
          console.log('❌ /refresh returned', err.status);
          // Refresh failed (token expired / revoked / reuse attack).
          // Notify queued callers, clear session, send user to login.
          this.refreshDone$.error(err);
          this.refreshDone$ = new Subject<void>(); // reset for next cycle
          this.clearState();
          this.router.navigate(['/login']);
          return throwError(() => err);
        }),
        finalize(() => {
          console.log('Refresh finalize');
          this.isRefreshing = false;
          // Always reset the subject so the next refresh cycle starts clean.
          // (catchError already resets on error; this covers the success path.)
          this.refreshDone$ = new Subject<void>();
        }),
      );
  }

  /** Fetch the authenticated user's profile from /auth/me. */
  fetchMe(): Observable<User> {
    return this.http
      .get<{ user: User }>(`${this.API}/me`, { withCredentials: true })
      .pipe(
        tap(() => console.log('✅ HTTP request returned')),
        tap(res => this.setUser(res.user)),
        map(res => res.user),
      );
  }

  /**
   * Persist profile changes via PATCH /auth/me and update the in-memory
   * user signal so the UI reflects the change immediately.
   */
  updateProfile(
    patch: Partial<Pick<User, 'firstName' | 'lastName' | 'email' | 'department'>>,
  ): Observable<User> {
    return this.http
      .patch<{ user: User }>(`${this.API}/me`, patch, { withCredentials: true })
      .pipe(
        tap(res => this.setUser(res.user)),
        map(res => res.user),
      );
  }

  hasPermission(permission: Permission): boolean {
    return this.userPermissions().includes(permission);
  }

  hasAnyPermission(...permissions: Permission[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  hasAllPermissions(...permissions: Permission[]): boolean {
    return permissions.every(p => this.hasPermission(p));
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Private helpers
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * On app bootstrap, silently attempt to restore session from the cookie.
   * If the cookie is absent or expired the server returns 401 and we stay
   * logged-out — no redirect, just clear UI state.
   */
  private hydrateSession(): void {
    console.log('🔥 hydrateSession()');
    this.isLoading.set(true);
    this.fetchMe()
      .pipe(
        catchError(err => {
          console.error('❌ fetchMe failed', err);
          console.log('No active session');
          this.clearState();
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: user => console.log('USER', user),
        error: err => console.error('ERROR', err),
        complete: () => console.log('COMPLETE')
      });
  }

  private listenBroadcastChannel(): void {
    console.log('🔥 listenBroadcastChannel()');
    if (!this.channel) return;
    this.channel.onmessage = ({ data }) => {
      switch (data.type) {
        case 'logout':
          this.clearState();
          this.router.navigate(['/login']);
          break;
        case 'login':
          // Another tab logged in — restore this tab's session from the cookie.
          this.hydrateSession();
          break;
      }
    };
  }

  private setUser(user: User): void {
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
  }

  clearState(): void {
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }
}
