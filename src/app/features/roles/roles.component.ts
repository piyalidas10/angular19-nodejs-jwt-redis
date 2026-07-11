import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { environment } from '../../../environments/environment';
import { RoleInfo } from '../../core/auth/models/auth.models';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatChipsModule, MatIconModule,
    MatExpansionModule, MatListModule, MatDividerModule,
    MatProgressBarModule, SkeletonComponent,
  ],
  templateUrl: './roles.component.html',
  styleUrl:    './roles.component.scss',
})
export class RolesComponent implements OnInit {
  private readonly http = inject(HttpClient);

  readonly loading = signal(true);
  readonly roles   = signal<RoleInfo[]>([]);

  ngOnInit(): void {
    this.http
      .get<{ roles: RoleInfo[] }>(`${environment.apiUrl}/roles`, { withCredentials: true })
      .subscribe({
        next:  res => { this.roles.set(res.roles); this.loading.set(false); },
        error: ()  => this.loading.set(false),
      });
  }
}
