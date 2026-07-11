import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DashboardComponent, DashboardData } from './dashboard.component';
import { AuthService } from '../../core/auth/services/auth.service';
import { environment } from '../../../environments/environment';

// ─── Shared mock data ────────────────────────────────────────────────────────

const MOCK_DASHBOARD: DashboardData = {
  stats: { totalUsers: 10, activeUsers: 8, totalRoles: 3, totalPermissions: 6 },
  recentActivity: [
    { id: 1, action: 'User login', user: 'admin', time: new Date().toISOString() },
  ],
  apiStatus: { status: 'healthy', uptime: 3600, timestamp: new Date().toISOString() },
  currentUser: null,
};

// ─── Setup helper ────────────────────────────────────────────────────────────

function setup() {
  TestBed.configureTestingModule({
    imports: [
      DashboardComponent,
      HttpClientTestingModule,
      RouterTestingModule,
      NoopAnimationsModule,
    ],
  });

  const httpMock = TestBed.inject(HttpTestingController);
  const auth     = TestBed.inject(AuthService);

  // Absorb bootstrap /auth/me
  const meReq = httpMock.expectOne(r => r.url.includes('/auth/me'));
  meReq.flush({}, { status: 401, statusText: 'Unauthorized' });

  // Inject a signed-in user
  (auth as any).setUser({
    id: '1', username: 'admin', email: 'admin@test.com',
    firstName: 'Alice', lastName: 'Admin', department: 'IT',
    role: 'ADMIN', permissions: ['USER_READ', 'USER_WRITE'],
    isActive: true, createdAt: '',
  });

  const fixture = TestBed.createComponent(DashboardComponent);
  const component = fixture.componentInstance;

  return { fixture, component, httpMock };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('DashboardComponent', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  // ── Creation ──────────────────────────────────────────────────────────────

  it('should create', () => {
    const { fixture, httpMock } = setup();
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/dashboard`).flush(MOCK_DASHBOARD);
    expect(fixture.componentInstance).toBeTruthy();
  });

  // ── Loading state ─────────────────────────────────────────────────────────

  it('starts in loading state', () => {
    const { component, fixture, httpMock } = setup();
    fixture.detectChanges();
    expect(component.loading()).toBeTrue();
    httpMock.expectOne(`${environment.apiUrl}/dashboard`).flush(MOCK_DASHBOARD);
  });

  it('clears loading state after successful API response', fakeAsync(() => {
    const { component, fixture, httpMock } = setup();
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/dashboard`).flush(MOCK_DASHBOARD);
    tick();
    expect(component.loading()).toBeFalse();
  }));

  it('clears loading state on API error', fakeAsync(() => {
    const { component, fixture, httpMock } = setup();
    fixture.detectChanges();
    httpMock
      .expectOne(`${environment.apiUrl}/dashboard`)
      .flush({}, { status: 500, statusText: 'Server Error' });
    tick();
    expect(component.loading()).toBeFalse();
  }));

  // ── Data population ───────────────────────────────────────────────────────

  it('populates data signal on success', fakeAsync(() => {
    const { component, fixture, httpMock } = setup();
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/dashboard`).flush(MOCK_DASHBOARD);
    tick();
    expect(component.data()).toEqual(MOCK_DASHBOARD);
  }));

  it('leaves data signal null on error', fakeAsync(() => {
    const { component, fixture, httpMock } = setup();
    fixture.detectChanges();
    httpMock
      .expectOne(`${environment.apiUrl}/dashboard`)
      .flush({}, { status: 500, statusText: 'Server Error' });
    tick();
    expect(component.data()).toBeNull();
  }));

  // ── statsCards() ─────────────────────────────────────────────────────────

  it('statsCards() returns empty array when data is null', () => {
    const { component, fixture, httpMock } = setup();
    fixture.detectChanges();
    expect(component.statsCards()).toEqual([]);
    httpMock.expectOne(`${environment.apiUrl}/dashboard`).flush(MOCK_DASHBOARD);
  });

  it('statsCards() returns 4 cards after data loads', fakeAsync(() => {
    const { component, fixture, httpMock } = setup();
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/dashboard`).flush(MOCK_DASHBOARD);
    tick();
    expect(component.statsCards().length).toBe(4);
  }));

  it('statsCards() maps stat values correctly', fakeAsync(() => {
    const { component, fixture, httpMock } = setup();
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/dashboard`).flush(MOCK_DASHBOARD);
    tick();
    const cards = component.statsCards();
    expect(cards[0].value).toBe(10); // totalUsers
    expect(cards[1].value).toBe(8);  // activeUsers
    expect(cards[2].value).toBe(3);  // totalRoles
    expect(cards[3].value).toBe(6);  // totalPermissions
  }));

  // ── formatUptime() ───────────────────────────────────────────────────────

  it('formatUptime() formats seconds to h/m string', () => {
    const { component, fixture, httpMock } = setup();
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/dashboard`).flush(MOCK_DASHBOARD);
    expect(component.formatUptime(3661)).toBe('1h 1m');
    expect(component.formatUptime(0)).toBe('0h 0m');
    expect(component.formatUptime(7200)).toBe('2h 0m');
  });

  // ── Template rendering ────────────────────────────────────────────────────

  it('renders skeleton while loading', () => {
    const { fixture, httpMock } = setup();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-skeleton')).toBeTruthy();
    httpMock.expectOne(`${environment.apiUrl}/dashboard`).flush(MOCK_DASHBOARD);
  });

  it('renders stat cards after data loads', fakeAsync(() => {
    const { fixture, httpMock } = setup();
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/dashboard`).flush(MOCK_DASHBOARD);
    tick();
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.stat-card');
    expect(cards.length).toBe(4);
  }));

  it('renders page title', fakeAsync(() => {
    const { fixture, httpMock } = setup();
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/dashboard`).flush(MOCK_DASHBOARD);
    tick();
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.page-title');
    expect(title?.textContent).toContain('Dashboard');
  }));

  // ── HTTP request details ──────────────────────────────────────────────────

  it('calls dashboard API with withCredentials', () => {
    const { fixture, httpMock } = setup();
    fixture.detectChanges();
    const req = httpMock.expectOne(`${environment.apiUrl}/dashboard`);
    expect(req.request.withCredentials).toBeTrue();
    req.flush(MOCK_DASHBOARD);
  });
});
