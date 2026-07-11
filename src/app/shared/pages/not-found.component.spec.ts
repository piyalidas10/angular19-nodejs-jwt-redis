import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { NotFoundComponent } from './not-found.component';

// ─── Setup helper ─────────────────────────────────────────────────────────────

function setup() {
  TestBed.configureTestingModule({
    imports: [NotFoundComponent, RouterTestingModule, NoopAnimationsModule],
  });

  const fixture   = TestBed.createComponent(NotFoundComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return { fixture, component };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('NotFoundComponent', () => {

  // ── Creation ────────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(setup().component).toBeTruthy();
  });

  // ── Template — structure ──────────────────────────────────────────────────

  it('renders .container wrapper', () => {
    const { fixture } = setup();
    expect(fixture.debugElement.query(By.css('.container'))).toBeTruthy();
  });

  it('renders a mat-icon with "search_off"', () => {
    const { fixture } = setup();
    const icon = fixture.debugElement.query(By.css('.icon'));
    expect(icon.nativeElement.textContent.trim()).toBe('search_off');
  });

  it('renders the 404 heading', () => {
    const { fixture } = setup();
    const h1 = fixture.debugElement.query(By.css('h1'));
    expect(h1.nativeElement.textContent).toContain('404');
    expect(h1.nativeElement.textContent).toContain('Page Not Found');
  });

  it('renders the descriptive paragraph', () => {
    const { fixture } = setup();
    const p = fixture.debugElement.query(By.css('p'));
    expect(p.nativeElement.textContent).toContain("doesn't exist");
  });

  // ── Navigation link ───────────────────────────────────────────────────────

  it('renders the "Go to Dashboard" link', () => {
    const { fixture } = setup();
    const link = fixture.debugElement.query(By.css('a[routerLink]'));
    expect(link).toBeTruthy();
    expect(link.nativeElement.textContent.trim()).toBe('Go to Dashboard');
  });

  it('"Go to Dashboard" link targets /dashboard', () => {
    const { fixture } = setup();
    const link = fixture.debugElement.query(By.css('a[routerLink]'));
    expect(link.attributes['routerLink']).toBe('/dashboard');
  });

  it('"Go to Dashboard" has color="primary"', () => {
    const { fixture } = setup();
    const link = fixture.debugElement.query(By.css('a[routerLink]'));
    expect(link.nativeElement.getAttribute('ng-reflect-color')).toBe('primary');
  });
});
