import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  MatDialogRef, MAT_DIALOG_DATA, MatDialogModule,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';

import { UserDialogComponent } from './user-dialog.component';
import { User } from '../../core/auth/models/auth.models';
import { environment } from '../../../environments/environment';

// ─── Mock user (edit mode) ───────────────────────────────────────────────────

const MOCK_USER: User = {
  id: 'u-1', username: 'alice', email: 'alice@co.com',
  firstName: 'Alice', lastName: 'Test', department: 'IT',
  role: 'EMPLOYEE', permissions: ['PROFILE_EDIT'],
  isActive: true, createdAt: '2024-01-01',
};

// ─── Setup helpers ────────────────────────────────────────────────────────────

function setupCreate() {
  return setupDialog(null);
}

function setupEdit(user: User = MOCK_USER) {
  return setupDialog(user);
}

function setupDialog(dialogData: User | null) {
  const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<UserDialogComponent>>(
    'MatDialogRef', ['close'],
  );

  TestBed.configureTestingModule({
    imports: [
      UserDialogComponent,
      ReactiveFormsModule,
      HttpClientTestingModule,
      RouterTestingModule,
      NoopAnimationsModule,
      MatDialogModule,
    ],
    providers: [
      { provide: MatDialogRef, useValue: dialogRefSpy },
      { provide: MAT_DIALOG_DATA, useValue: dialogData },
    ],
  });

  const httpMock = TestBed.inject(HttpTestingController);
  // AuthService bootstrap absorb
  httpMock.expectOne(r => r.url.includes('/auth/me'))
          .flush({}, { status: 401, statusText: 'Unauthorized' });
  httpMock.verify();

  const fixture   = TestBed.createComponent(UserDialogComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return { fixture, component, httpMock, dialogRef: dialogRefSpy };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('UserDialogComponent — CREATE mode', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('should create', () => expect(setupCreate().component).toBeTruthy());

  it('isEdit is false in create mode', () => {
    expect(setupCreate().component.isEdit).toBeFalse();
  });

  it('starts with saving = false', () => {
    expect(setupCreate().component.saving()).toBeFalse();
  });

  it('form is invalid with empty fields', () => {
    expect(setupCreate().component.form.invalid).toBeTrue();
  });

  it('form includes username and password controls in create mode', () => {
    const { component } = setupCreate();
    expect(component.form.contains('username')).toBeTrue();
    expect(component.form.contains('password')).toBeTrue();
  });

  it('form is valid when all required fields are filled', () => {
    const { component } = setupCreate();
    component.form.patchValue({
      firstName: 'Andrew', lastName: 'Smith', email: 'Andrew@co.com',
      department: 'Sales', role: 'EMPLOYEE',
      username: 'bsmith', password: 'secure1',
    });
    expect(component.form.valid).toBeTrue();
  });

  it('save() does nothing when form is invalid', () => {
    const { component, httpMock } = setupCreate();
    component.save();
    httpMock.expectNone(`${environment.apiUrl}/users`);
  });

  it('save() POSTs to /users and closes dialog on success', fakeAsync(() => {
    const { component, httpMock, dialogRef } = setupCreate();
    component.form.patchValue({
      firstName: 'Andrew', lastName: 'Smith', email: 'Andrew@co.com',
      department: 'Sales', role: 'EMPLOYEE',
      username: 'bsmith', password: 'secure1',
    });
    component.save();

    const req = httpMock.expectOne(`${environment.apiUrl}/users`);
    expect(req.request.method).toBe('POST');
    req.flush({ user: {} });
    tick();

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  }));

  it('save() resets saving signal on POST error', fakeAsync(() => {
    const { component, httpMock } = setupCreate();
    component.form.patchValue({
      firstName: 'Andrew', lastName: 'Smith', email: 'Andrew@co.com',
      department: 'Sales', role: 'EMPLOYEE',
      username: 'bsmith', password: 'secure1',
    });
    component.save();

    httpMock.expectOne(`${environment.apiUrl}/users`)
            .flush({ message: 'Error' }, { status: 409, statusText: 'Conflict' });
    tick();

    expect(component.saving()).toBeFalse();
  }));
});

describe('UserDialogComponent — EDIT mode', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('isEdit is true when user data is passed', () => {
    expect(setupEdit().component.isEdit).toBeTrue();
  });

  it('form does NOT include username/password controls in edit mode', () => {
    const { component } = setupEdit();
    expect(component.form.contains('username')).toBeFalse();
    expect(component.form.contains('password')).toBeFalse();
  });

  it('form is pre-populated with user data', () => {
    const { component } = setupEdit();
    expect(component.form.get('firstName')?.value).toBe('Alice');
    expect(component.form.get('email')?.value).toBe('alice@co.com');
    expect(component.form.get('role')?.value).toBe('EMPLOYEE');
  });

  it('form is valid when pre-populated', () => {
    expect(setupEdit().component.form.valid).toBeTrue();
  });

  it('save() PUTs to /users/:id and closes dialog on success', fakeAsync(() => {
    const { component, httpMock, dialogRef } = setupEdit();
    component.save();

    const req = httpMock.expectOne(`${environment.apiUrl}/users/u-1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ user: {} });
    tick();

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  }));

  it('save() sends withCredentials on PUT', fakeAsync(() => {
    const { component, httpMock } = setupEdit();
    component.save();

    const req = httpMock.expectOne(`${environment.apiUrl}/users/u-1`);
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ user: {} });
    tick();
  }));
});
