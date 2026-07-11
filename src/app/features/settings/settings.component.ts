import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatListModule, MatSlideToggleModule,
    MatIconModule, MatButtonModule, MatDividerModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl:    './settings.component.scss',
})
export class SettingsComponent {
  readonly auth         = inject(AuthService);
  private readonly snack = inject(MatSnackBar);

  readonly darkMode = signal(false);

  toggleDark(on: boolean): void {
    this.darkMode.set(on);
    document.body.classList.toggle('dark-theme', on);
  }

  logout(): void {
    this.auth.logout().subscribe();
  }
}
