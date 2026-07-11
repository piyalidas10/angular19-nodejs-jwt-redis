import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { RolesComponent } from './roles.component';
import { AuthService } from '../../core/auth/services/auth.service';
import { RoleInfo } from '../../core/auth/models/auth.models';
import { environment } from '../../../environments/environment';

// ─── Shared mock data ─────────────────────────────────────────────────────────

const MOCK_ROLES: RoleInfo[] = [
  {
    id: 'role-001',
    name: 'ADMIN',
    label: 'Administrator',
    description: 'Full system access.',
    permissions: ['USER_READ', 'USER_WRITE', 'ROLE_MANAGE'],
    userCount: 1,
  },
  {
    id: 'role-002',
    name: 'MANAGER',
    label: 'Manager',
    description: 'Can view users and reports.',
    permissions: ['USER_READ', 'REPORT_VIEW'],
    userCount: 2,
  },
  {
    id: 'role-003',
    name: 'EMPLOYEE',
    label: 'Employee',
    description: 'Standard employee.',
    permissions: ['PROFILE_EDIT'],
    userCount: 5,
  },
];

// ─── Setup helper ─────────────────────────────────────────────────────────────

function setup() {
  TestBed.configureTestingModule({
    imports: [
      RolesComponent,
      HttpClientTestingModule,
      RouterTestingModule,
      NoopAnimationsModule,
    ],
  });

  const httpMock = TestBed.inject(HttpTestingController);
  // Absorb bootstrap /auth/me
  httpMock.expectOne(r => r.url.includes('/auth/me'))
          .flush({}, { status: 401, statusText: 'Unauthorized' });

  const auth = TestBed.inject(AuthService);
  (auth as any).setUser({
    id: '1', username: 'admin', email: '', firstName: '', lastName: '',
    department: '', role: 'ADMIN', permissions: ['ROLE_MANAGE'],
    isActive: true, createdAt: '',
  });

  const fixture   = TestBed.createComponent(RolesComponent);
  const component = fixture.componentInstance;

  return { fixture, component, httpMock };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RolesComponent', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  // ── Creation ──────────────────────────────────────────────────────────────

  it('should create', () => {
    const { fixture, httpMock } = setup();
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/roles`).flush({ roles: MOCK_ROLES });
    expect(fixture.componentInstance).toBeTruthy();
  });

  // ── Loading state ─────────────────────────────────────────────────────────

  it('starts in loading state', () => {
    const { component, fixture, httpMock } = setup();
    fixture.detectChanges();
    expect(component.loading()).toBeTrue();
    httpMock.expectOne(`${environment.apiUrl}/roles`).flush({ roles: MOCK_ROLES });
  });

  it('clears loading state after successful response', fakeAsync(() => {
    const { component, fixture, httpMock } = setup();
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/roles`).flush({ roles: MOCK_ROLES });
    tick();
    expect(component.loading()).toBeFalse();
  }));

  it('clears loading state on error', fakeAsync(() => {
    const { component, fixture, httpMock } = setup();
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/roles`)
            .flush({}, { status: 500, statusText: 'Error' });
    tick();
    expect(component.loading()).toBeFalse();
  }));

  // ── Data population ───────────────────────────────────────────────────────

  it('populates roles signal from API response', fakeAsync(() => {
    const { component, fixture, httpMock } = setup();
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/roles`).flush({ roles: MOCK_ROLES });
    tick();
    expect(component.roles().length).toBe(3);
  }));

  it('leaves roles signal empty on error', fakeAsync(() => {
    const { component, fixture, httpMock } = setup();
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/roles`)
            .flush({}, { status: 500, statusText: 'Error' });
    tick();
    expect(component.roles()).toEqual([]);
  }));

  it('maps role names correctly', fakeAsync(() => {
    const { component, fixture, httpMock } = setup();
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/roles`).flush({ roles: MOCK_ROLES });
    tick();
    const names = component.roles().map(r => r.name);
    expect(names).toEqual(['ADMIN', 'MANAGER', 'EMPLOYEE']);
  }));

  // ── Template rendering ────────────────────────────────────────────────────

  it('renders skeleton while loading', () => {
    const { fixture, httpMock } = setup();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-skeleton')).toBeTruthy();
    httpMock.expectOne(`${environment.apiUrl}/roles`).flush({ roles: MOCK_ROLES });
  });

  it('renders one expansion panel per role', fakeAsync(() => {
    const { fixture, httpMock } = setup();
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/roles`).flush({ roles: MOCK_ROLES });
    tick();
    fixture.detectChanges();
    const panels = fixture.nativeElement.querySelectorAll('mat-expansion-panel');
    expect(panels.length).toBe(3);
  }));

  it('renders role labels', fakeAsync(() => {
    const { fixture, httpMock } = setup();
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/roles`).flush({ roles: MOCK_ROLES });
    tick();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Administrator');
    expect(text).toContain('Manager');
    expect(text).toContain('Employee');
  }));

  // ── HTTP request ──────────────────────────────────────────────────────────

  it('calls roles API with withCredentials', () => {
    const { fixture, httpMock } = setup();
    fixture.detectChanges();
    const req = httpMock.expectOne(`${environment.apiUrl}/roles`);
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ roles: MOCK_ROLES });
  });
});
