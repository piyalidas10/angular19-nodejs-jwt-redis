import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { ShellComponent, NAV_ITEMS } from './shell.component';
import { AuthService } from '../../core/auth/services/auth.service';
import { User } from '../../core/auth/models/auth.models';

// ─── Shared mock user ─────────────────────────────────────────────────────────

const ADMIN_USER: User = {
  id: 'u-1', username: 'admin', email: 'admin@co.com',
  firstName: 'Alice', lastName: 'Admin', department: 'IT',
  role: 'ADMIN', permissions: ['USER_READ', 'USER_WRITE', 'USER_DELETE', 'ROLE_MANAGE', 'PROFILE_EDIT'],
  isActive: true, createdAt: '2024-01-01',
};

const EMPLOYEE_USER: User = {
  id: 'u-2', username: 'employee', email: 'emp@co.com',
  firstName: 'Eva', lastName: 'Employee', department: 'Sales',
  role: 'EMPLOYEE', permissions: ['PROFILE_EDIT'],
  isActive: true, createdAt: '2024-01-01',
};

// ─── Setup helper ─────────────────────────────────────────────────────────────

function setup(user: User = ADMIN_USER) {
  TestBed.configureTestingModule({
    imports: [
      ShellComponent,
      RouterTestingModule,
      HttpClientTestingModule,
      NoopAnimationsModule,
    ],
  });

  const httpMock = TestBed.inject(HttpTestingController);
  httpMock.expectOne(r => r.url.includes('/auth/me'))
          .flush({}, { status: 401, statusText: 'Unauthorized' });
  httpMock.verify();

  const auth = TestBed.inject(AuthService);
  (auth as any).setUser(user);

  const fixture   = TestBed.createComponent(ShellComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return { fixture, component, auth };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ShellComponent', () => {

  // ── Creation ────────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(setup().component).toBeTruthy();
  });

  // ── Initial state ────────────────────────────────────────────────────────

  it('isDark starts as false', () => {
    expect(setup().component.isDark).toBeFalse();
  });

  it('isMobile starts as false (no viewport resize in tests)', () => {
    expect(setup().component.isMobile()).toBeFalse();
  });

  // ── visibleNavItems() — permission filtering ──────────────────────────────

  it('ADMIN sees all NAV_ITEMS', () => {
    const { component } = setup(ADMIN_USER);
    expect(component.visibleNavItems().length).toBe(NAV_ITEMS.length);
  });

  it('EMPLOYEE does not see Users nav item (requires USER_READ)', () => {
    const { component } = setup(EMPLOYEE_USER);
    const labels = component.visibleNavItems().map(i => i.label);
    expect(labels).not.toContain('Users');
  });

  it('EMPLOYEE does not see Roles nav item (requires ROLE_MANAGE)', () => {
    const { component } = setup(EMPLOYEE_USER);
    const labels = component.visibleNavItems().map(i => i.label);
    expect(labels).not.toContain('Roles');
  });

  it('EMPLOYEE still sees Dashboard, My Profile, Settings', () => {
    const { component } = setup(EMPLOYEE_USER);
    const labels = component.visibleNavItems().map(i => i.label);
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('My Profile');
    expect(labels).toContain('Settings');
  });

  it('items without a permission requirement are always visible', () => {
    const unguarded = NAV_ITEMS.filter(i => !i.permission).map(i => i.label);
    const { component } = setup(EMPLOYEE_USER);
    const visible = component.visibleNavItems().map(i => i.label);
    unguarded.forEach(label => expect(visible).toContain(label));
  });

  // ── toggleTheme() ─────────────────────────────────────────────────────────

  it('toggleTheme() flips isDark from false to true', () => {
    const { component } = setup();
    component.toggleTheme();
    expect(component.isDark).toBeTrue();
    document.body.classList.remove('dark-theme'); // cleanup
  });

  it('toggleTheme() flips isDark from true to false', () => {
    const { component } = setup();
    component.isDark = true;
    component.toggleTheme();
    expect(component.isDark).toBeFalse();
  });

  it('toggleTheme() adds dark-theme class to body', () => {
    const { component } = setup();
    component.toggleTheme();
    expect(document.body.classList.contains('dark-theme')).toBeTrue();
    document.body.classList.remove('dark-theme'); // cleanup
  });

  it('toggleTheme() removes dark-theme class from body on second call', () => {
    const { component } = setup();
    component.toggleTheme();
    component.toggleTheme();
    expect(document.body.classList.contains('dark-theme')).toBeFalse();
  });

  // ── logout() ──────────────────────────────────────────────────────────────

  it('logout() calls auth.logout()', () => {
    const { component, auth } = setup();
    spyOn(auth, 'logout').and.returnValue(of(undefined));
    component.logout();
    expect(auth.logout).toHaveBeenCalled();
  });

  // ── Template rendering ────────────────────────────────────────────────────

  it('renders the sidenav-container', () => {
    const { fixture } = setup();
    expect(fixture.debugElement.query(By.css('.sidenav-container'))).toBeTruthy();
  });

  it('renders toolbar with "AuthApp" title', () => {
    const { fixture } = setup();
    const toolbar = fixture.debugElement.query(By.css('.toolbar-title'));
    expect(toolbar.nativeElement.textContent.trim()).toBe('AuthApp');
  });

  it('renders sidenav header with "AuthApp" brand', () => {
    const { fixture } = setup();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.sidenav-header .logo-text')?.textContent?.trim()).toBe('AuthApp');
  });

  it('renders user display name in the sidebar footer', () => {
    const { fixture } = setup(ADMIN_USER);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.name')?.textContent?.trim()).toBe('Alice Admin');
  });

  it('renders router-outlet for child routes', () => {
    const { fixture } = setup();
    expect(fixture.debugElement.query(By.css('router-outlet'))).toBeTruthy();
  });
});
