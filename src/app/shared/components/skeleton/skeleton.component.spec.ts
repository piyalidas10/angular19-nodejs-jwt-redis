import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { SkeletonComponent } from './skeleton.component';

// ─── Host component — drives signal inputs via bindings ──────────────────────

@Component({
  standalone: true,
  imports: [SkeletonComponent],
  template: `
    <app-skeleton
      [count]="count"
      [height]="height"
      [width]="width"
      [gap]="gap"
    />
  `,
})
class HostComponent {
  count  = 3;
  height = '24px';
  width  = '100%';
  gap    = 8;
}

function setup(props: Partial<HostComponent> = {}) {
  TestBed.configureTestingModule({
    imports: [HostComponent],
  });

  const fixture   = TestBed.createComponent(HostComponent);
  const host      = fixture.componentInstance;
  Object.assign(host, props);
  fixture.detectChanges();

  const skeletonEl = fixture.debugElement.query(By.directive(SkeletonComponent));
  const component  = skeletonEl.componentInstance as SkeletonComponent;

  return { fixture, host, component };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SkeletonComponent', () => {

  // ── Creation ──────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(setup().component).toBeTruthy();
  });

  // ── Default signal values ─────────────────────────────────────────────────

  it('has default count of 3', () => {
    expect(setup().component.count()).toBe(3);
  });

  it('has default height of 24px', () => {
    expect(setup().component.height()).toBe('24px');
  });

  it('has default width of 100%', () => {
    expect(setup().component.width()).toBe('100%');
  });

  it('has default gap of 8', () => {
    expect(setup().component.gap()).toBe(8);
  });

  // ── rows computed signal ──────────────────────────────────────────────────

  it('rows computed returns an array with length equal to count', () => {
    const { component } = setup({ count: 5 });
    expect(component.rows().length).toBe(5);
  });

  it('rows computed returns empty array when count is 0', () => {
    const { component } = setup({ count: 0 });
    expect(component.rows()).toEqual([]);
  });

  it('rows computed returns correct array for count = 1', () => {
    const { component } = setup({ count: 1 });
    expect(component.rows().length).toBe(1);
  });

  // ── Template — row count ──────────────────────────────────────────────────

  it('renders the correct number of skeleton rows (default 3)', () => {
    const { fixture } = setup();
    const rows = fixture.debugElement.queryAll(By.css('.skeleton'));
    expect(rows.length).toBe(3);
  });

  it('renders 5 skeleton rows when count = 5', () => {
    const { fixture } = setup({ count: 5 });
    const rows = fixture.debugElement.queryAll(By.css('.skeleton'));
    expect(rows.length).toBe(5);
  });

  it('renders 0 skeleton rows when count = 0', () => {
    const { fixture } = setup({ count: 0 });
    const rows = fixture.debugElement.queryAll(By.css('.skeleton'));
    expect(rows.length).toBe(0);
  });

  // ── Template — inline styles ──────────────────────────────────────────────

  it('applies height signal as inline style on each row', () => {
    const { fixture } = setup({ count: 2, height: '64px' });
    const rows = fixture.debugElement.queryAll(By.css('.skeleton'));
    rows.forEach(row =>
      expect(row.nativeElement.style.height).toBe('64px'),
    );
  });

  it('applies width signal as inline style on each row', () => {
    const { fixture } = setup({ count: 2, width: '60%' });
    const rows = fixture.debugElement.queryAll(By.css('.skeleton'));
    rows.forEach(row =>
      expect(row.nativeElement.style.width).toBe('60%'),
    );
  });

  it('applies gap signal as inline style on the wrapper', () => {
    const { fixture } = setup({ gap: 16 });
    const wrapper = fixture.debugElement.query(By.css('.skeleton-wrapper'));
    expect(wrapper.nativeElement.style.gap).toBe('16px');
  });

  // ── Template — CSS classes ────────────────────────────────────────────────

  it('each rendered row has the .skeleton CSS class', () => {
    const { fixture } = setup({ count: 3 });
    const rows = fixture.debugElement.queryAll(By.css('.skeleton'));
    expect(rows.length).toBe(3);
    rows.forEach(row =>
      expect(row.nativeElement.classList).toContain('skeleton'),
    );
  });

  it('wrapper element has the .skeleton-wrapper CSS class', () => {
    const { fixture } = setup();
    const wrapper = fixture.debugElement.query(By.css('.skeleton-wrapper'));
    expect(wrapper).toBeTruthy();
  });

  // ── Signal reactivity ─────────────────────────────────────────────────────

  it('re-renders when count input binding changes', () => {
    const { fixture, host } = setup({ count: 2 });
    expect(fixture.debugElement.queryAll(By.css('.skeleton')).length).toBe(2);

    host.count = 4;
    fixture.detectChanges();
    expect(fixture.debugElement.queryAll(By.css('.skeleton')).length).toBe(4);
  });

  it('updates height style when height input binding changes', () => {
    const { fixture, host } = setup({ count: 1, height: '32px' });
    let row = fixture.debugElement.query(By.css('.skeleton'));
    expect(row.nativeElement.style.height).toBe('32px');

    host.height = '80px';
    fixture.detectChanges();
    row = fixture.debugElement.query(By.css('.skeleton'));
    expect(row.nativeElement.style.height).toBe('80px');
  });
});
