import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../../core/auth/services/auth.service';

// ─── Setup helper ─────────────────────────────────────────────────────────────

function setup() {
  TestBed.configureTestingModule({
    imports: [
      LoginComponent,
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

  const fixture   = TestBed.createComponent(LoginComponent);
  const component = fixture.componentInstance;
  const auth      = TestBed.inject(AuthService);
  const router    = TestBed.inject(Router);

  fixture.detectChanges();
  httpMock.verify();

  return { fixture, component, auth, router, httpMock };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LoginComponent', () => {

  // ── Creation ────────────────────────────────────────────────────────────────

  it('should create', () => {
    const { component } = setup();
    expect(component).toBeTruthy();
  });

  // ── Initial state ────────────────────────────────────────────────────────────

  it('starts with empty form fields', () => {
    const { component } = setup();
    expect(component.form.get('username')?.value).toBe('');
    expect(component.form.get('password')?.value).toBe('');
  });

  it('starts with invalid form (fields required)', () => {
    const { component } = setup();
    expect(component.form.invalid).toBeTrue();
  });

  it('starts with no error message', () => {
    const { component } = setup();
    expect(component.errorMessage()).toBe('');
  });

  it('starts with password hidden', () => {
    const { component } = setup();
    expect(component.showPassword()).toBeFalse();
  });

  it('exposes three demo credentials', () => {
    const { component } = setup();
    expect(component.demoCredentials.length).toBe(3);
    const usernames = component.demoCredentials.map(c => c.username);
    expect(usernames).toContain('admin');
    expect(usernames).toContain('manager');
    expect(usernames).toContain('employee');
  });

  // ── Form validation ───────────────────────────────────────────────────────

  it('form becomes valid when both fields are filled', () => {
    const { component } = setup();
    component.form.patchValue({ username: 'admin', password: 'Admin@123' });
    expect(component.form.valid).toBeTrue();
  });

  it('form is invalid when username is empty', () => {
    const { component } = setup();
    component.form.patchValue({ username: '', password: 'Admin@123' });
    expect(component.form.invalid).toBeTrue();
  });

  it('form is invalid when password is empty', () => {
    const { component } = setup();
    component.form.patchValue({ username: 'admin', password: '' });
    expect(component.form.invalid).toBeTrue();
  });

  // ── showPassword toggle ────────────────────────────────────────────────────

  it('toggles showPassword signal', () => {
    const { component } = setup();
    expect(component.showPassword()).toBeFalse();
    component.showPassword.set(true);
    expect(component.showPassword()).toBeTrue();
    component.showPassword.set(false);
    expect(component.showPassword()).toBeFalse();
  });

  // ── fillCredentials() ─────────────────────────────────────────────────────

  it('fillCredentials() patches form values', () => {
    const { component } = setup();
    component.fillCredentials({ username: 'manager', password: 'Manager@123' });
    expect(component.form.get('username')?.value).toBe('manager');
    expect(component.form.get('password')?.value).toBe('Manager@123');
  });

  // ── submit() — invalid form ────────────────────────────────────────────────

  it('submit() does nothing when form is invalid', () => {
    const { component, auth } = setup();
    spyOn(auth, 'login').and.callThrough();
    component.submit();
    expect(auth.login).not.toHaveBeenCalled();
  });

  // ── submit() — successful login ────────────────────────────────────────────

  it('submit() calls auth.login with form values', fakeAsync(() => {
    const { component, auth, httpMock } = setup();
    const mockUser = {
      id: '1', username: 'admin', email: '', firstName: '', lastName: '',
      department: '', role: 'ADMIN' as const, permissions: [],
      isActive: true, createdAt: '',
    };
    spyOn(auth, 'login').and.returnValue(of(mockUser));

    component.form.patchValue({ username: 'admin', password: 'Admin@123' });
    component.submit();
    tick();

    expect(auth.login).toHaveBeenCalledWith({ username: 'admin', password: 'Admin@123' });
    httpMock.verify();
  }));

  it('submit() clears error message before calling login', fakeAsync(() => {
    const { component, auth } = setup();
    component.errorMessage.set('Old error');
    const mockUser = {
      id: '1', username: 'admin', email: '', firstName: '', lastName: '',
      department: '', role: 'ADMIN' as const, permissions: [],
      isActive: true, createdAt: '',
    };
    spyOn(auth, 'login').and.returnValue(of(mockUser));

    component.form.patchValue({ username: 'admin', password: 'Admin@123' });
    component.submit();
    tick();

    expect(component.errorMessage()).toBe('');
  }));

  // ── submit() — failed login ────────────────────────────────────────────────

  it('submit() sets errorMessage on login failure', fakeAsync(() => {
    const { component, auth } = setup();
    spyOn(auth, 'login').and.returnValue(
      throwError(() => ({ error: { message: 'Invalid credentials' } })),
    );

    component.form.patchValue({ username: 'admin', password: 'wrong' });
    component.submit();
    tick();

    expect(component.errorMessage()).toBe('Invalid credentials');
  }));

  it('submit() uses fallback message when error has no body', fakeAsync(() => {
    const { component, auth } = setup();
    spyOn(auth, 'login').and.returnValue(throwError(() => ({})));

    component.form.patchValue({ username: 'admin', password: 'wrong' });
    component.submit();
    tick();

    expect(component.errorMessage()).toContain('Login failed');
  }));

  // ── Template ──────────────────────────────────────────────────────────────

  it('renders Sign In heading', () => {
    const { fixture } = setup();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Sign In');
  });

  it('renders demo credential buttons', () => {
    const { fixture } = setup();
    const el     = fixture.nativeElement as HTMLElement;
    const btns   = el.querySelectorAll('.demo-hints button');
    expect(btns.length).toBe(3);
  });
});
