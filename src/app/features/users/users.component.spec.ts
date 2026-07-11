import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

import { UsersComponent } from './users.component';
import { AuthService } from '../../core/auth/services/auth.service';
import { User } from '../../core/auth/models/auth.models';
import { environment } from '../../../environments/environment';

// ─── Shared mock data ─────────────────────────────────────────────────────────

const MOCK_USERS: User[] = [
  {
    id: 'u-1', username: 'admin', email: 'admin@co.com',
    firstName: 'Alice', lastName: 'Admin', department: 'IT',
    role: 'ADMIN', permissions: ['USER_READ', 'USER_WRITE', 'USER_DELETE'],
    isActive: true, createdAt: '2024-01-01',
  },
  {
    id: 'u-2', username: 'manager', email: 'mgr@co.com',
    firstName: 'Mark', lastName: 'Manager', department: 'Ops',
    role: 'MANAGER', permissions: ['USER_READ'],
    isActive: true, createdAt: '2024-02-01',
  },
];

// ─── Setup helper ─────────────────────────────────────────────────────────────

function setup() {
  TestBed.configureTestingModule({
    imports: [
      UsersComponent,
      HttpClientTestingModule,
      RouterTestingModule,
      NoopAnimationsModule,
    ],
  });

  const httpMock = TestBed.inject(HttpTestingController);
  httpMock.expectOne(r => r.url.includes('/auth/me'))
          .flush({}, { status: 401, statusText: 'Unauthorized' });

  const auth = TestBed.inject(AuthService);
  (auth as any).setUser({
    id: '1', username: 'admin', email: '', firstName: '', lastName: '',
    department: '', role: 'ADMIN',
    permissions: ['USER_READ', 'USER_WRITE', 'USER_DELETE'],
    isActive: true, createdAt: '',
  });

  const fixture   = TestBed.createComponent(UsersComponent);
  const component = fixture.componentInstance;

  return { fixture, component, httpMock,
    dialog:  TestBed.inject(MatDialog),
    snackBar: TestBed.inject(MatSnackBar),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('UsersComponent', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  // ── Creation ──────────────────────────────────────────────────────────────

  it('should create', () => {
    const { fixture, httpMock } = setup();
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/users`).flush({ data: MOCK_USERS });
    expect(fixture.componentInstance).toBeTruthy();
  });

  // ── Loading state ─────────────────────────────────────────────────────────

  it('starts in loading state', () => {
    const { component, fixture, httpMock } = setup();
    fixture.detectChanges();
    expect(component.loading()).toBeTrue();
    httpMock.expectOne(`${environment.apiUrl}/users`).flush({ data: MOCK_USERS });
  });

  it('clears loading after success', fakeAsync(() => {
    const { component, fixture, httpMock } = setup();
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/users`).flush({ data: MOCK_USERS });
    tick();
    expect(component.loading()).toBeFalse();
  }));

  it('clears loading after error', fakeAsync(() => {
    const { component, fixture, httpMock } = setup();
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/users`)
            .flush({}, { status: 500, statusText: 'Error' });
    tick();
    expect(component.loading()).toBeFalse();
  }));

  // ── Data source ───────────────────────────────────────────────────────────

  it('populates dataSource after successful load', fakeAsync(() => {
    const { component, fixture, httpMock } = setup();
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/users`).flush({ data: MOCK_USERS });
    tick();
    expect(component.dataSource.data.length).toBe(2);
  }));

  // ── Initial signal values ─────────────────────────────────────────────────

  it('searchTerm starts empty', () => {
    const { component, fixture, httpMock } = setup();
    fixture.detectChanges();
    expect(component.searchTerm()).toBe('');
    httpMock.expectOne(`${environment.apiUrl}/users`).flush({ data: MOCK_USERS });
  });

  it('roleFilter starts empty', () => {
    const { component, fixture, httpMock } = setup();
    fixture.detectChanges();
    expect(component.roleFilter()).toBe('');
    httpMock.expectOne(`${environment.apiUrl}/users`).flush({ data: MOCK_USERS });
  });

  // ── displayedColumns ─────────────────────────────────────────────────────

  it('displayedColumns includes expected column ids', () => {
    const { component, fixture, httpMock } = setup();
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/users`).flush({ data: MOCK_USERS });
    expect(component.displayedColumns).toContain('name');
    expect(component.displayedColumns).toContain('email');
    expect(component.displayedColumns).toContain('role');
    expect(component.displayedColumns).toContain('actions');
  });

  // ── onSearch() ────────────────────────────────────────────────────────────

  it('onSearch() updates searchTerm signal and dataSource filter', fakeAsync(() => {
    const { component, fixture, httpMock } = setup();
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/users`).flush({ data: MOCK_USERS });
    tick();

    const event = { target: { value: 'alice' } } as unknown as Event;
    component.onSearch(event);

    expect(component.searchTerm()).toBe('alice');
    expect(component.dataSource.filter).toBe('alice');
  }));

  // ── resetFilters() ────────────────────────────────────────────────────────

  it('resetFilters() clears signals and reloads', fakeAsync(() => {
    const { component, fixture, httpMock } = setup();
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/users`).flush({ data: MOCK_USERS });
    tick();

    component.searchTerm.set('some');
    component.roleFilter.set('ADMIN');
    component.resetFilters();

    expect(component.searchTerm()).toBe('');
    expect(component.roleFilter()).toBe('');
    expect(component.dataSource.filter).toBe('');

    // Second load triggered by resetFilters
    httpMock.expectOne(`${environment.apiUrl}/users`).flush({ data: MOCK_USERS });
    tick();
  }));

  // ── openCreate() ─────────────────────────────────────────────────────────

  it('openCreate() opens MatDialog', fakeAsync(() => {
    const { component, fixture, httpMock, dialog } = setup();
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/users`).flush({ data: MOCK_USERS });
    tick();

    spyOn(dialog, 'open').and.returnValue({ afterClosed: () => of(null) } as any);
    component.openCreate();
    expect(dialog.open).toHaveBeenCalled();
  }));

  // ── deleteUser() ──────────────────────────────────────────────────────────

  it('deleteUser() opens confirm dialog then calls DELETE on confirmation', fakeAsync(() => {
    const { component, fixture, httpMock, dialog } = setup();
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/users`).flush({ data: MOCK_USERS });
    tick();

    spyOn(dialog, 'open').and.returnValue({ afterClosed: () => of(true) } as any);
    component.deleteUser(MOCK_USERS[0]!);

    const delReq = httpMock.expectOne(`${environment.apiUrl}/users/u-1`);
    expect(delReq.request.method).toBe('DELETE');
    delReq.flush({});
    tick();

    // Reload after delete
    httpMock.expectOne(`${environment.apiUrl}/users`).flush({ data: [] });
    tick();
  }));

  it('deleteUser() does NOT call DELETE when confirmation is cancelled', fakeAsync(() => {
    const { component, fixture, httpMock, dialog } = setup();
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/users`).flush({ data: MOCK_USERS });
    tick();

    spyOn(dialog, 'open').and.returnValue({ afterClosed: () => of(false) } as any);
    component.deleteUser(MOCK_USERS[0]!);
    httpMock.expectNone(`${environment.apiUrl}/users/u-1`);
  }));

  // ── HTTP ──────────────────────────────────────────────────────────────────

  it('calls users API with withCredentials', () => {
    const { fixture, httpMock } = setup();
    fixture.detectChanges();
    const req = httpMock.expectOne(`${environment.apiUrl}/users`);
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ data: MOCK_USERS });
  });
});
