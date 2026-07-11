import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { SettingsComponent } from './settings.component';
import { AuthService } from '../../core/auth/services/auth.service';

// ─── Setup helper ─────────────────────────────────────────────────────────────

function setup() {
  TestBed.configureTestingModule({
    imports: [
      SettingsComponent,
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
    id: '1', username: 'admin', email: 'admin@company.com',
    firstName: 'Alice', lastName: 'Admin', department: 'IT',
    role: 'ADMIN', permissions: ['USER_READ'],
    isActive: true, createdAt: '',
  });

  const fixture   = TestBed.createComponent(SettingsComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  httpMock.verify();

  return { fixture, component, auth };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SettingsComponent', () => {

  // ── Creation ────────────────────────────────────────────────────────────────

  it('should create', () => {
    const { component } = setup();
    expect(component).toBeTruthy();
  });

  // ── Initial state ────────────────────────────────────────────────────────────

  it('starts with darkMode = false', () => {
    const { component } = setup();
    expect(component.darkMode()).toBeFalse();
  });

  // ── toggleDark() ─────────────────────────────────────────────────────────────

  it('toggleDark(true) sets darkMode signal to true', () => {
    const { component } = setup();
    component.toggleDark(true);
    expect(component.darkMode()).toBeTrue();
  });

  it('toggleDark(false) sets darkMode signal to false', () => {
    const { component } = setup();
    component.toggleDark(true);
    component.toggleDark(false);
    expect(component.darkMode()).toBeFalse();
  });

  it('toggleDark(true) adds dark-theme class to body', () => {
    const { component } = setup();
    component.toggleDark(true);
    expect(document.body.classList.contains('dark-theme')).toBeTrue();
    // cleanup
    document.body.classList.remove('dark-theme');
  });

  it('toggleDark(false) removes dark-theme class from body', () => {
    const { component } = setup();
    document.body.classList.add('dark-theme');
    component.toggleDark(false);
    expect(document.body.classList.contains('dark-theme')).toBeFalse();
  });

  // ── logout() ─────────────────────────────────────────────────────────────────

  it('logout() calls auth.logout()', () => {
    const { component, auth } = setup();
    spyOn(auth, 'logout').and.returnValue(of(undefined));
    component.logout();
    expect(auth.logout).toHaveBeenCalled();
  });

  // ── Template rendering ────────────────────────────────────────────────────────

  it('renders Settings heading', () => {
    const { fixture } = setup();
    const title = fixture.nativeElement.querySelector('.page-title');
    expect(title?.textContent).toContain('Settings');
  });

  it('renders current username', () => {
    const { fixture } = setup();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('admin');
  });

  it('renders current role', () => {
    const { fixture } = setup();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('ADMIN');
  });

  it('renders Sign Out button', () => {
    const { fixture } = setup();
    const btn = fixture.nativeElement.querySelector('button[color="warn"]');
    expect(btn).toBeTruthy();
    expect(btn?.textContent).toContain('Sign Out');
  });
});
