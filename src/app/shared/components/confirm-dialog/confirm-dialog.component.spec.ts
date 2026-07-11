import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { ConfirmDialogComponent } from './confirm-dialog.component';

// ─── Shared dialog data ───────────────────────────────────────────────────────

const DEFAULT_DATA = { title: 'Delete User', message: 'Are you sure you want to delete?' };

// ─── Setup helper ─────────────────────────────────────────────────────────────

function setup(data = DEFAULT_DATA) {
  const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<ConfirmDialogComponent>>(
    'MatDialogRef', ['close'],
  );

  TestBed.configureTestingModule({
    imports: [ConfirmDialogComponent, NoopAnimationsModule],
    providers: [
      { provide: MatDialogRef, useValue: dialogRefSpy },
      { provide: MAT_DIALOG_DATA, useValue: data },
    ],
  });

  const fixture   = TestBed.createComponent(ConfirmDialogComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return { fixture, component, dialogRef: dialogRefSpy };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ConfirmDialogComponent', () => {

  // ── Creation ────────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(setup().component).toBeTruthy();
  });

  // ── Data injection ────────────────────────────────────────────────────────

  it('exposes injected title via data.title', () => {
    const { component } = setup();
    expect(component.data.title).toBe('Delete User');
  });

  it('exposes injected message via data.message', () => {
    const { component } = setup();
    expect(component.data.message).toBe('Are you sure you want to delete?');
  });

  // ── Template — title ─────────────────────────────────────────────────────

  it('renders the dialog title', () => {
    const { fixture } = setup();
    const title = fixture.debugElement.query(By.css('[mat-dialog-title]'));
    expect(title.nativeElement.textContent.trim()).toBe('Delete User');
  });

  it('renders a custom title when provided', () => {
    const { fixture } = setup({ title: 'Revoke Session', message: 'Revoke this session?' });
    const title = fixture.debugElement.query(By.css('[mat-dialog-title]'));
    expect(title.nativeElement.textContent.trim()).toBe('Revoke Session');
  });

  // ── Template — message ────────────────────────────────────────────────────

  it('renders the dialog message', () => {
    const { fixture } = setup();
    const msg = fixture.debugElement.query(By.css('.message'));
    expect(msg.nativeElement.textContent.trim()).toBe('Are you sure you want to delete?');
  });

  it('renders a custom message when provided', () => {
    const { fixture } = setup({ title: 'Clear Data', message: 'This action cannot be undone.' });
    const msg = fixture.debugElement.query(By.css('.message'));
    expect(msg.nativeElement.textContent.trim()).toBe('This action cannot be undone.');
  });

  // ── Template — buttons ────────────────────────────────────────────────────

  it('renders a Cancel button', () => {
    const { fixture } = setup();
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    const labels  = buttons.map((b: any) => b.nativeElement.textContent.trim());
    expect(labels).toContain('Cancel');
  });

  it('renders a Confirm button', () => {
    const { fixture } = setup();
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    const labels  = buttons.map((b: any) => b.nativeElement.textContent.trim());
    expect(labels).toContain('Confirm');
  });

  it('Confirm button has color="warn"', () => {
    const { fixture } = setup();
    const confirmBtn = fixture.debugElement
      .queryAll(By.css('button'))
      .find((b: any) => b.nativeElement.textContent.trim() === 'Confirm');
    expect(confirmBtn).toBeTruthy();
    expect(confirmBtn!.nativeElement.getAttribute('ng-reflect-color')).toBe('warn');
  });

  // ── mat-dialog-close bindings ─────────────────────────────────────────────

  it('Cancel button has mat-dialog-close (closes with undefined)', () => {
    const { fixture } = setup();
    const cancelBtn = fixture.debugElement
      .queryAll(By.css('button'))
      .find((b: any) => b.nativeElement.textContent.trim() === 'Cancel');
    // mat-dialog-close directive must be present
    expect(cancelBtn!.nativeElement.hasAttribute('mat-dialog-close')).toBeTrue();
  });

  it('Confirm button binds [mat-dialog-close]="true"', () => {
    const { fixture } = setup();
    const confirmBtn = fixture.debugElement
      .queryAll(By.css('button'))
      .find((b: any) => b.nativeElement.textContent.trim() === 'Confirm');
    // The ng-reflect attribute is set by Angular for bound inputs in dev mode
    expect(
      confirmBtn!.nativeElement.getAttribute('ng-reflect-dialog-result'),
    ).toBe('true');
  });
});
