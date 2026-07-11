import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth/services/auth.service';
import { LoginRequest } from '../../core/auth/models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrl:    './login.component.scss',
})
export class LoginComponent {
  readonly auth = inject(AuthService);
  private readonly fb     = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snack  = inject(MatSnackBar);

  readonly showPassword = signal(false);
  readonly errorMessage = signal('');

  readonly demoCredentials = [
    { username: 'admin',    password: 'Admin@123',    role: 'ADMIN'    },
    { username: 'manager',  password: 'Manager@123',  role: 'MANAGER'  },
    { username: 'employee', password: 'Employee@123', role: 'EMPLOYEE' },
  ];

  readonly form = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.errorMessage.set('');

    const creds = this.form.value as LoginRequest;
    this.auth.login(creds).subscribe({
      next:  () => this.router.navigate(['/dashboard']),
      error: err => {
        const msg = err?.error?.message ?? 'Login failed. Please check your credentials.';
        this.errorMessage.set(msg);
      },
    });
  }

  fillCredentials(cred: { username: string; password: string }): void {
    this.form.patchValue({ username: cred.username, password: cred.password });
  }
}
