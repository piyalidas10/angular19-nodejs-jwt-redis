import { Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * Fullscreen loading overlay shown during auth initialisation and
 * any long-running async operation.
 *
 * Usage:
 *   <app-loading-spinner />
 *   <app-loading-spinner message="Loading dashboard…" />
 */
@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  templateUrl: './loading-spinner.component.html',
  styleUrl:    './loading-spinner.component.scss',
})
export class LoadingSpinnerComponent {
  /** Optional status message shown below the spinner. */
  readonly message = input<string>('');
}
