import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

function setupWithAuth(authenticated: boolean, permissions: string[] = []) {
  TestBed.configureTestingModule({
    imports: [HttpClientTestingModule, RouterTestingModule],
    providers: [AuthService],
  });
  const httpMock = TestBed.inject(HttpTestingController);
  const auth     = TestBed.inject(AuthService);
  const meReq    = httpMock.expectOne(r => r.url.includes('/auth/me'));
  meReq.flush({ status: 401 }, { status: 401, statusText: 'Unauthorized' });

  if (authenticated) {
    (auth as any).setUser({
      id: '1', username: 'admin', email: '', firstName: '', lastName: '',
      department: '', role: 'ADMIN', permissions, isActive: true, createdAt: '',
    });
  }
  httpMock.verify();
  return { auth, router: TestBed.inject(Router) };
}

describe('authGuard', () => {
  it('allows authenticated users', () => {
    setupWithAuth(true);
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(result).toBe(true);
  });

  it('redirects unauthenticated users to /login', () => {
    setupWithAuth(false);
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(result.toString()).toContain('login');
  });
});

describe('roleGuard', () => {
  it('allows users with the required permission', () => {
    setupWithAuth(true, ['USER_READ']);
    const route = { data: { permissions: ['USER_READ'] } } as unknown as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() => roleGuard(route, {} as any));
    expect(result).toBe(true);
  });

  it('redirects users without the required permission to /unauthorized', () => {
    setupWithAuth(true, ['PROFILE_EDIT']);
    const route = { data: { permissions: ['USER_DELETE'] } } as unknown as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() => roleGuard(route, {} as any));
    expect(result.toString()).toContain('unauthorized');
  });
});
