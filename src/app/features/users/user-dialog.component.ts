import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../../core/auth/models/auth.models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatProgressSpinnerModule,
  ],
  templateUrl: './user-dialog.component.html',
  styleUrl:    './user-dialog.component.scss',
})
export class UserDialogComponent {
  private readonly fb    = inject(FormBuilder);
  private readonly http  = inject(HttpClient);
  private readonly snack = inject(MatSnackBar);
  private readonly ref   = inject(MatDialogRef<UserDialogComponent>);
  readonly data: User | null = inject(MAT_DIALOG_DATA);

  readonly isEdit = !!this.data;
  readonly saving = signal(false);

  readonly form = this.fb.group({
    firstName:  [this.data?.firstName  ?? '', Validators.required],
    lastName:   [this.data?.lastName   ?? '', Validators.required],
    email:      [this.data?.email      ?? '', [Validators.required, Validators.email]],
    department: [this.data?.department ?? '', Validators.required],
    role:       [this.data?.role       ?? 'EMPLOYEE', Validators.required],
    ...(this.isEdit ? {} : {
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    }),
  });

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const obs = this.isEdit
      ? this.http.put(
          `${environment.apiUrl}/users/${this.data!.id}`,
          this.form.value,
          { withCredentials: true },
        )
      : this.http.post(
          `${environment.apiUrl}/users`,
          this.form.value,
          { withCredentials: true },
        );

    const closeText = $localize`:Global|Snackbar close action@@global.snack.close:Close`;
    obs.subscribe({
      next:  () => {
        this.ref.close(true);
        this.snack.open(
          $localize`:User dialog|Saved snackbar@@userDialog.snack.saved:User saved.`,
          closeText, { duration: 3000 },
        );
      },
      error: err => {
        this.saving.set(false);
        this.snack.open(
          err?.error?.message ?? $localize`:User dialog|Save error snackbar@@userDialog.snack.error:Failed to save user.`,
          closeText, { duration: 4000 },
        );
      },
    });
  }
}
