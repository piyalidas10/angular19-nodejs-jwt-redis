import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Generic confirmation dialog.
 *
 * Usage:
 *   this.dialog.open(ConfirmDialogComponent, {
 *     data: { title: 'Delete User', message: 'Are you sure?' }
 *   });
 *
 * The dialog closes with:
 *   - `true`      when the user clicks Confirm
 *   - `undefined` when the user clicks Cancel or dismisses the dialog
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl:    './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  readonly data = inject<{ title: string; message: string }>(MAT_DIALOG_DATA);
}
