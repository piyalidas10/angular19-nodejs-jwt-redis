import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService],
    });
    service   = TestBed.inject(AuthService);
    httpMock  = TestBed.inject(HttpTestingController);

    // Absorb the bootstrap /auth/me call
    const meReq = httpMock.expectOne(r => r.url.includes('/auth/me'));
    meReq.flush({ status: 401 }, { status: 401, statusText: 'Unauthorized' });
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start unauthenticated', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('should set user and authenticate on successful login', () => {
    const mockUser = {
      id: '1', username: 'admin', email: 'admin@test.com',
      firstName: 'Alice', lastName: 'Admin',
      department: 'IT', role: 'ADMIN' as const,
      permissions: ['USER_READ' as const],
      isActive: true, createdAt: '2024-01-01',
    };

    service.login({ username: 'admin', password: 'Admin@123' }).subscribe(user => {
      expect(user.username).toBe('admin');
    });

    const req = httpMock.expectOne(r => r.url.includes('/auth/login'));
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ message: 'Login successful.', user: mockUser });

    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.username).toBe('admin');
  });

  it('should clear state and navigate on logout', () => {
    service.logout().subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/auth/logout'));
    req.flush({});
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('hasPermission() returns true for granted permissions', () => {
    (service as any).setUser({
      id: '1', username: 'admin', email: '', firstName: '', lastName: '',
      department: '', role: 'ADMIN', permissions: ['USER_READ', 'USER_WRITE'],
      isActive: true, createdAt: '',
    });
    expect(service.hasPermission('USER_READ')).toBe(true);
    expect(service.hasPermission('USER_DELETE' as any)).toBe(false);
  });

  it('should not attach sensitive data to requests', () => {
    service.login({ username: 'admin', password: 'Admin@123' }).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/auth/login'));
    // Body should NOT contain tokens (tokens are in cookies, not the request body)
    expect(req.request.body).not.toHaveProperty('accessToken');
    expect(req.request.body).not.toHaveProperty('refreshToken');
    req.flush({});
  });
});
