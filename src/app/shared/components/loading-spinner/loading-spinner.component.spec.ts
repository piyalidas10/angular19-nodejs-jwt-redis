import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LoadingSpinnerComponent } from './loading-spinner.component';

// ─── Host component — drives signal input via binding ─────────────────────────

@Component({
  standalone: true,
  imports: [LoadingSpinnerComponent],
  template: `<app-loading-spinner [message]="message" />`,
})
class HostComponent {
  message = '';
}

function setup(message = '') {
  TestBed.configureTestingModule({
    imports: [HostComponent, NoopAnimationsModule],
  });

  const fixture   = TestBed.createComponent(HostComponent);
  const host      = fixture.componentInstance;
  host.message    = message;
  fixture.detectChanges();

  const spinnerEl  = fixture.debugElement.query(By.directive(LoadingSpinnerComponent));
  const component  = spinnerEl.componentInstance as LoadingSpinnerComponent;

  return { fixture, host, component };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LoadingSpinnerComponent', () => {

  // ── Creation ────────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(setup().component).toBeTruthy();
  });

  // ── Default signal value ──────────────────────────────────────────────────

  it('has default message of empty string', () => {
    expect(setup().component.message()).toBe('');
  });

  // ── Overlay element ───────────────────────────────────────────────────────

  it('renders the .overlay wrapper', () => {
    const { fixture } = setup();
    expect(fixture.debugElement.query(By.css('.overlay'))).toBeTruthy();
  });

  it('overlay has role="status" for accessibility', () => {
    const { fixture } = setup();
    const overlay = fixture.debugElement.query(By.css('.overlay'));
    expect(overlay.nativeElement.getAttribute('role')).toBe('status');
  });

  it('overlay has aria-live="polite"', () => {
    const { fixture } = setup();
    const overlay = fixture.debugElement.query(By.css('.overlay'));
    expect(overlay.nativeElement.getAttribute('aria-live')).toBe('polite');
  });

  // ── Spinner element ───────────────────────────────────────────────────────

  it('renders a mat-spinner element', () => {
    const { fixture } = setup();
    expect(fixture.debugElement.query(By.css('mat-spinner'))).toBeTruthy();
  });

  // ── Message — hidden when empty ───────────────────────────────────────────

  it('does NOT render .msg when message signal is empty', () => {
    const { fixture } = setup('');
    expect(fixture.debugElement.query(By.css('.msg'))).toBeNull();
  });

  // ── Message — shown when provided ────────────────────────────────────────

  it('renders .msg when message signal is non-empty', () => {
    const { fixture } = setup('Loading dashboard…');
    expect(fixture.debugElement.query(By.css('.msg'))).toBeTruthy();
  });

  it('displays the provided message text', () => {
    const { fixture } = setup('Please wait…');
    const msg = fixture.debugElement.query(By.css('.msg'));
    expect(msg.nativeElement.textContent.trim()).toBe('Please wait…');
  });

  it('whitespace-only message is truthy in @if — .msg IS rendered', () => {
    const { fixture } = setup('   ');
    expect(fixture.debugElement.query(By.css('.msg'))).toBeTruthy();
  });

  // ── Signal reactivity via host binding ────────────────────────────────────

  it('shows .msg when host changes message from empty to non-empty', () => {
    const { fixture, host } = setup('');
    expect(fixture.debugElement.query(By.css('.msg'))).toBeNull();

    host.message = 'Now loading';
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.msg'))).toBeTruthy();
  });

  it('removes .msg when host changes message to empty string', () => {
    const { fixture, host } = setup('Loading');
    expect(fixture.debugElement.query(By.css('.msg'))).toBeTruthy();

    host.message = '';
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.msg'))).toBeNull();
  });

  it('message signal reflects the current bound value', () => {
    const { host, component, fixture } = setup('Initial');
    expect(component.message()).toBe('Initial');

    host.message = 'Updated';
    fixture.detectChanges();
    expect(component.message()).toBe('Updated');
  });
});
