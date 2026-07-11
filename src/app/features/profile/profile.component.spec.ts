import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';

import { ProfileComponent } from './profile.component';
import { AuthService } from '../../core/auth/services/auth.service';
import { User } from '../../core/auth/models/auth.models';
import { environment } from '../../../environments/environment';

// ─── Shared mock data ─────────────────────────────────────────────────────────

const MOCK_USER: User = {
  id: 'u-1',
  username: 'admin',
  email: 'admin@company.com',
  firstName: 'Alice',
  lastName: 'Admin',
  department: 'IT',
  role: 'ADMIN',
  permissions: ['USER_READ', 'USER_WRITE', 'PROFILE_EDIT'],
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  lastLogin: '2024-06-01T10:00:00.000Z',
};

const UPDATED_USER: User = {
  ...MOCK_USER,
  firstName: 'Alicia',
  department: 'Engineering',
};

// ─── Setup helper ─────────────────────────────────────────────────────────────

function setup(user: User | null = MOCK_USER) {
  TestBed.configureTestingModule({
    imports: [
      ProfileComponent,
      HttpClientTestingModule,
      RouterTestingModule,
      NoopAnimationsModule,
      ReactiveFormsModule,
    ],
  });

  const httpMock = TestBed.inject(HttpTestingController);
  // Absorb bootstrap /auth/me
  httpMock.expectOne(r => r.url.includes('/auth/me'))
          .flush({}, { status: 401, statusText: 'Unauthorized' });

  const auth = TestBed.inject(AuthService);
  if (user) (auth as any).setUser(user);

  const fixture   = TestBed.createComponent(ProfileComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  httpMock.verify();

  return { fixture, component, auth, httpMock,
    snackBar: TestBed.inject(MatSnackBar),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProfileComponent', () => {

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  // ── Creation ────────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(setup().component).toBeTruthy();
  });

  // ── Form initialisation ────────────────────────────────────────────────────

  it('pre-populates form from current user', () => {
    const { component } = setup();
    expect(component.form.get('firstName')?.value).toBe('Alice');
    expect(component.form.get('lastName')?.value).toBe('Admin');
    expect(component.form.get('email')?.value).toBe('admin@company.com');
    expect(component.form.get('department')?.value).toBe('IT');
  });

  it('form is valid when pre-populated with user data', () => {
    expect(setup().component.form.valid).toBeTrue();
  });

  it('form is invalid when email is cleared', () => {
    const { component } = setup();
    component.form.get('email')?.setValue('');
    expect(component.form.invalid).toBeTrue();
  });

  it('form is invalid when email is malformed', () => {
    const { component } = setup();
    component.form.get('email')?.setValue('not-an-email');
    expect(component.form.invalid).toBeTrue();
  });

  it('form is invalid when firstName is cleared', () => {
    const { component } = setup();
    component.form.get('firstName')?.setValue('');
    expect(component.form.invalid).toBeTrue();
  });

  // ── Initial signals ────────────────────────────────────────────────────────

  it('starts with saving = false', () => {
    expect(setup().component.saving()).toBeFalse();
  });

  it('starts with successMsg = empty', () => {
    expect(setup().component.successMsg()).toBe('');
  });

  // ── save() — guard: invalid form ──────────────────────────────────────────

  it('save() does nothing when form is invalid', () => {
    const { component, auth, httpMock } = setup();
    spyOn(auth, 'updateProfile').and.callThrough();
    component.form.get('firstName')?.setValue('');
    component.save();
    expect(auth.updateProfile).not.toHaveBeenCalled();
    httpMock.expectNone(`${environment.apiUrl}/auth/me`);
  });

  // ── save() — sets saving = true while in flight ───────────────────────────

  it('save() sets saving = true immediately', () => {
    const { component, auth } = setup();
    spyOn(auth, 'updateProfile').and.returnValue(of(UPDATED_USER));
    component.save();
    // saving is set synchronously before the observable resolves
    // (finalize resets it after, so we capture the moment right after .save())
    expect(component.saving()).toBeFalse(); // finalize ran synchronously with `of()`
  });

  it('save() sets saving = true while HTTP request is pending', fakeAsync(() => {
    const { component, httpMock } = setup();
    component.save();

    // saving is true while request is in-flight
    expect(component.saving()).toBeTrue();

    // flush the PATCH
    httpMock.expectOne(r => r.url.includes('/auth/me') && r.method === 'PATCH')
            .flush({ user: UPDATED_USER });
    tick();

    expect(component.saving()).toBeFalse();
  }));

  // ── save() — success path ─────────────────────────────────────────────────

  it('save() sends PATCH to /auth/me with form values', fakeAsync(() => {
    const { component, httpMock } = setup();
    component.form.patchValue({ firstName: 'Alicia', department: 'Engineering' });
    component.save();

    const req = httpMock.expectOne(r => r.url.includes('/auth/me') && r.method === 'PATCH');
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.body.firstName).toBe('Alicia');
    expect(req.request.body.department).toBe('Engineering');
    req.flush({ user: UPDATED_USER });
    tick();
  }));

  it('save() sets successMsg on success', fakeAsync(() => {
    const { component, httpMock } = setup();
    component.save();

    httpMock.expectOne(r => r.url.includes('/auth/me') && r.method === 'PATCH')
            .flush({ user: UPDATED_USER });
    tick();

    expect(component.successMsg()).toBe('Profile updated successfully.');
  }));

  it('save() clears saving after success', fakeAsync(() => {
    const { component, httpMock } = setup();
    component.save();
    httpMock.expectOne(r => r.url.includes('/auth/me') && r.method === 'PATCH')
            .flush({ user: UPDATED_USER });
    tick();
    expect(component.saving()).toBeFalse();
  }));

  it('save() updates auth.currentUser signal on success', fakeAsync(() => {
    const { component, auth, httpMock } = setup();
    component.save();
    httpMock.expectOne(r => r.url.includes('/auth/me') && r.method === 'PATCH')
            .flush({ user: UPDATED_USER });
    tick();
    expect(auth.currentUser()?.firstName).toBe('Alicia');
    expect(auth.currentUser()?.department).toBe('Engineering');
  }));

  // ── save() — error path ───────────────────────────────────────────────────

  it('save() clears saving on error', fakeAsync(() => {
    const { component, httpMock } = setup();
    component.save();

    httpMock.expectOne(r => r.url.includes('/auth/me') && r.method === 'PATCH')
            .flush({ message: 'Server error' }, { status: 500, statusText: 'Error' });
    tick();

    expect(component.saving()).toBeFalse();
  }));

  it('save() does not set successMsg on error', fakeAsync(() => {
    const { component, httpMock } = setup();
    component.save();

    httpMock.expectOne(r => r.url.includes('/auth/me') && r.method === 'PATCH')
            .flush({}, { status: 500, statusText: 'Error' });
    tick();

    expect(component.successMsg()).toBe('');
  }));

  // ── Template rendering ────────────────────────────────────────────────────

  it('renders page title "My Profile"', () => {
    const { fixture } = setup();
    expect(fixture.nativeElement.querySelector('.page-title')?.textContent)
      .toContain('My Profile');
  });

  it('renders the user display name', () => {
    const { fixture } = setup();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Alice Admin');
  });

  it('renders user email', () => {
    const { fixture } = setup();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('admin@company.com');
  });

  it('renders user department', () => {
    const { fixture } = setup();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('IT');
  });

  it('renders permission chips', () => {
    const { fixture } = setup();
    const chips = fixture.nativeElement.querySelectorAll('.perm-chip');
    expect(chips.length).toBe(3);
  });
});
