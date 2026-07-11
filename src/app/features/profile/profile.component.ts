import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatChipsModule,
    MatDividerModule, MatProgressSpinnerModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl:    './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  readonly auth          = inject(AuthService);
  private readonly fb    = inject(FormBuilder);
  private readonly snack = inject(MatSnackBar);

  readonly saving     = signal(false);
  readonly successMsg = signal('');

  readonly form = this.fb.group({
    firstName:  [this.auth.currentUser()?.firstName  ?? '', Validators.required],
    lastName:   [this.auth.currentUser()?.lastName   ?? '', Validators.required],
    email:      [this.auth.currentUser()?.email      ?? '', [Validators.required, Validators.email]],
    department: [this.auth.currentUser()?.department ?? '', Validators.required],
  });

  ngOnInit(): void {
    const u = this.auth.currentUser();
    if (u) {
      this.form.patchValue({
        firstName:  u.firstName,
        lastName:   u.lastName,
        email:      u.email,
        department: u.department,
      });
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    this.auth.updateProfile(this.form.value as any).pipe(
      finalize(() => this.saving.set(false)),
    ).subscribe({
      next: () => {
        const successText = $localize`:Profile|Success snackbar@@profile.snack.success:Profile updated successfully.`;
        const closeText   = $localize`:Global|Snackbar close action@@global.snack.close:Close`;
        this.successMsg.set(successText);
        this.snack.open(successText, closeText, { duration: 3000 });
      },
      error: err => {
        const closeText = $localize`:Global|Snackbar close action@@global.snack.close:Close`;
        const msg = err?.error?.message ?? $localize`:Profile|Error snackbar@@profile.snack.error:Failed to update profile.`;
        this.snack.open(msg, closeText, { duration: 4000 });
      },
    });
  }
}
