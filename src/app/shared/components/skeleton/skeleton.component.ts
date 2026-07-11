import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Skeleton loader — renders animated placeholder blocks while data loads.
 *
 * Usage:
 *   <app-skeleton [count]="5" [height]="'48px'" />
 *   <app-skeleton [count]="3" height="80px" width="60%" [gap]="12" />
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton.component.html',
  styleUrl:    './skeleton.component.scss',
})
export class SkeletonComponent {
  /** Number of placeholder rows to render. */
  readonly count  = input<number>(3);
  /** CSS height of each row (e.g. '24px', '80px'). */
  readonly height = input<string>('24px');
  /** CSS width of each row (e.g. '100%', '60%'). */
  readonly width  = input<string>('100%');
  /** Gap between rows in pixels. */
  readonly gap    = input<number>(8);

  /** Derived array used by @for — recomputed whenever count changes. */
  readonly rows = computed(() =>
    Array.from({ length: this.count() }, (_, i) => i),
  );
}
